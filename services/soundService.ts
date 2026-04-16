/**
 * SoundService — minimal HTML5 Audio wrapper.
 * --------------------------------------------------------------
 * - On web: preloads MP3 files and exposes `play(eventId)`.
 * - On native: no-op (we ship without expo-av to keep the bundle lean).
 * - Honours a global mute toggle.
 * - Falls back to a synthetic WebAudio click for `CLICK_NEON` and
 *   `IMPACT_METAL` if the file is missing — the UI never breaks.
 *
 * File layout: `public/assets/sounds/<file>.mp3`. After `expo export -p web`,
 * the deploy step copies `public/*` into `dist/`, so the same path resolves
 * to `/<basePath>/assets/sounds/<file>.mp3` on GitHub Pages.
 */

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Event catalogue
// ---------------------------------------------------------------------------

export type SoundEventId =
  | 'LEVEL_UP'
  | 'ARISE_EXTRACTION'
  | 'DUNGEON_START'
  | 'THEME_AMBIENT'
  | 'EVOLUTION_THEME'
  | 'IMPACT_METAL'
  | 'CLICK_NEON';

const SOUND_FILES: Record<SoundEventId, string> = {
  LEVEL_UP:         'Palier_Atteint.mp3',
  ARISE_EXTRACTION: 'Extrayez_l_Essence.mp3',
  DUNGEON_START:    'Le_Contrat_de_Fer.mp3',
  THEME_AMBIENT:    'Le_Regne_du_Monarque.mp3',
  EVOLUTION_THEME:  'Le_Monarque_s_eveille.mp3',
  IMPACT_METAL:     'Impact_Metal.mp3',
  CLICK_NEON:       'Click_Neon.mp3',
};

/** Default channel-level volumes (0..1). */
const DEFAULT_VOLUMES: Record<SoundEventId, number> = {
  LEVEL_UP:         0.85,
  ARISE_EXTRACTION: 0.95,
  DUNGEON_START:    0.80,
  THEME_AMBIENT:    0.20, // looping background — kept low
  EVOLUTION_THEME:  0.90,
  IMPACT_METAL:     0.45,
  CLICK_NEON:       0.30,
};

/** Events that loop by default. */
const LOOPING: Set<SoundEventId> = new Set(['THEME_AMBIENT']);

// ---------------------------------------------------------------------------
// Asset URL resolver — respects the Expo experimental baseUrl on web.
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  if (Platform.OS !== 'web') return '';
  // process.env.EXPO_BASE_URL is injected at build time by expo export.
  // Falls back to '' for local dev / native.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromEnv = (process.env as any)?.EXPO_BASE_URL as string | undefined;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv.endsWith('/') ? fromEnv.slice(0, -1) : fromEnv;
  }
  // Last-resort: derive from window.location.pathname when deployed under
  // /GymLevel/ on GitHub Pages.
  if (typeof window !== 'undefined' && window.location?.pathname) {
    const m = window.location.pathname.match(/^\/(GymLevel)(\/|$)/);
    if (m) return `/${m[1]}`;
  }
  return '';
}

function assetUrl(file: string): string {
  return `${getBaseUrl()}/assets/sounds/${file}`;
}

// ---------------------------------------------------------------------------
// Web implementation — HTML5 Audio
// ---------------------------------------------------------------------------

interface ChannelHandle {
  /** Underlying <audio> element (web only). */
  el: HTMLAudioElement | null;
  /** True once the file has been requested at least once. */
  loaded: boolean;
  /** True if loading the file failed (404 etc.) — falls back to synth. */
  failed: boolean;
}

class WebSoundService {
  private muted = false;
  private channels = new Map<SoundEventId, ChannelHandle>();
  private audioCtx: AudioContext | null = null;

  constructor() {
    // Lazy preload happens on the first play() call to respect autoplay
    // policies — but we eagerly create the elements so the network
    // round-trip starts ASAP.
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      this.preloadAll();
    }
  }

  preloadAll(): void {
    (Object.keys(SOUND_FILES) as SoundEventId[]).forEach(id => {
      this.ensureChannel(id);
    });
  }

  private ensureChannel(id: SoundEventId): ChannelHandle {
    let handle = this.channels.get(id);
    if (handle) return handle;
    handle = { el: null, loaded: false, failed: false };
    try {
      const el = new Audio(assetUrl(SOUND_FILES[id]));
      el.preload = 'auto';
      el.volume = DEFAULT_VOLUMES[id];
      el.loop = LOOPING.has(id);
      el.addEventListener('canplaythrough', () => {
        handle!.loaded = true;
      });
      el.addEventListener('error', () => {
        handle!.failed = true;
      });
      handle.el = el;
    } catch {
      handle.failed = true;
    }
    this.channels.set(id, handle);
    return handle;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.channels.forEach(h => {
      if (h.el) h.el.muted = muted;
    });
  }

  isMuted(): boolean {
    return this.muted;
  }

  play(id: SoundEventId, opts?: { volume?: number; restart?: boolean }): void {
    if (this.muted) return;
    const handle = this.ensureChannel(id);
    if (handle.failed || !handle.el) {
      // Synthetic fallback for the two short cues only.
      if (id === 'CLICK_NEON') this.playSynthClick();
      else if (id === 'IMPACT_METAL') this.playSynthImpact();
      return;
    }
    const el = handle.el;
    if (typeof opts?.volume === 'number') {
      el.volume = Math.min(1, Math.max(0, opts.volume));
    }
    try {
      if (opts?.restart || el.ended || el.paused) {
        el.currentTime = 0;
      }
      const p = el.play();
      // Browsers may reject autoplay before user interaction — swallow.
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          if (id === 'CLICK_NEON') this.playSynthClick();
          else if (id === 'IMPACT_METAL') this.playSynthImpact();
        });
      }
    } catch {
      // Silent — UI must never break on missing audio.
    }
  }

  stop(id: SoundEventId): void {
    const handle = this.channels.get(id);
    if (handle?.el) {
      try {
        handle.el.pause();
        handle.el.currentTime = 0;
      } catch {
        /* noop */
      }
    }
  }

  stopAll(): void {
    this.channels.forEach((_, id) => this.stop(id));
  }

  // -------------------------------------------------------------------
  // Synthetic fallbacks (small WebAudio blips so the UI feels alive
  // even without the MP3 files in place yet)
  // -------------------------------------------------------------------

  private getCtx(): AudioContext | null {
    if (this.audioCtx) return this.audioCtx;
    if (typeof window === 'undefined') return null;
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.audioCtx = new Ctor();
    } catch {
      this.audioCtx = null;
    }
    return this.audioCtx;
  }

  private playSynthClick(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  private playSynthImpact(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Metallic short noise burst
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.2);
  }
}

// ---------------------------------------------------------------------------
// Native fallback — no-op to keep the bundle native-friendly without expo-av.
// ---------------------------------------------------------------------------

class NoopSoundService {
  preloadAll(): void {}
  setMuted(_muted: boolean): void {}
  isMuted(): boolean {
    return false;
  }
  play(_id: SoundEventId): void {}
  stop(_id: SoundEventId): void {}
  stopAll(): void {}
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

const SoundService =
  Platform.OS === 'web' ? new WebSoundService() : new NoopSoundService();

export default SoundService;

/** Convenience wrappers — keep store / UI imports terse. */
export function playSound(
  id: SoundEventId,
  opts?: { volume?: number; restart?: boolean },
): void {
  SoundService.play(id, opts);
}
export function stopSound(id: SoundEventId): void {
  SoundService.stop(id);
}
export function stopAllSounds(): void {
  SoundService.stopAll();
}
export function setSoundMuted(muted: boolean): void {
  SoundService.setMuted(muted);
}
