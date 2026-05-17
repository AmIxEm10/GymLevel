import { router } from 'expo-router';
import { Inbox, Mail, MailOpen, X } from 'lucide-react-native';
import { memo, useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  selectMessages,
  selectUnreadCount,
  useAppStore,
} from '@/store/useAppStore';
import type { SystemMessage, SystemMessageTone } from '@/types';

// ---------------------------------------------------------------------------
// Tone palette — neon hues inspired by the Solo Leveling System interface.
// ---------------------------------------------------------------------------

const TONE_PALETTE: Record<
  SystemMessageTone,
  { color: string; glow: string; label: string }
> = {
  info:      { color: '#22D3EE', glow: '#A5F3FC', label: 'Rapport' },
  warning:   { color: '#FBBF24', glow: '#FEF3C7', label: 'Avertissement' },
  ominous:   { color: '#F43F5E', glow: '#FCA5A5', label: 'Le Système' },
  reward:    { color: '#A855F7', glow: '#E9D5FF', label: 'Récompense' },
  evolution: { color: '#FBBF24', glow: '#FEF3C7', label: 'Évolution' },
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MailboxScreen() {
  const messages = useAppStore(selectMessages);
  const unreadCount = useAppStore(selectUnreadCount);
  const markMessageRead = useAppStore(s => s.markMessageRead);
  const markAllRead = useAppStore(s => s.markAllMessagesRead);

  const [openId, setOpenId] = useState<string | null>(null);

  // Sort by most recent first — defensive in case the store ever reorders.
  const sorted = [...messages].sort((a, b) => b.sentAt - a.sentAt);
  const openMessage = openId ? sorted.find(m => m.id === openId) ?? null : null;

  // Auto-mark as read when a message is opened for the first time.
  useEffect(() => {
    if (openMessage && !openMessage.read) {
      markMessageRead(openMessage.id);
    }
  }, [openMessage, markMessageRead]);

  const handlePressMessage = useCallback((id: string) => {
    setOpenId(id);
  }, []);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#020617]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-1">
          <Text className="text-[10px] font-black uppercase tracking-[5px] text-blue-400">
            BOÎTE AUX LETTRES
          </Text>
          <Text
            className="mt-1 text-3xl font-black tracking-[3px] text-blue-200"
            style={{ textShadowColor: '#60A5FA', textShadowRadius: 16 }}
          >
            MESSAGES
          </Text>
          <Text className="mt-1 text-[10px] italic text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''} en attente`
              : 'Tout est lu, chasseur.'}
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          aria-label="Close"
          className="rounded-lg border border-slate-700 bg-white/5 p-2 active:opacity-60"
        >
          <X size={16} color="#94A3B8" />
        </Pressable>
      </View>

      {/* Mark-all-read */}
      {unreadCount > 0 ? (
        <View className="px-5 pb-3">
          <Pressable
            onPress={markAllRead}
            className="flex-row items-center justify-center rounded-xl border border-cyan-400/50 bg-cyan-500/10 py-2 active:opacity-70"
          >
            <MailOpen size={12} color="#A5F3FC" strokeWidth={2.25} />
            <Text className="ml-2 text-[10px] font-black uppercase tracking-[3px] text-cyan-200">
              Tout marquer comme lu
            </Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={sorted}
        keyExtractor={m => m.id}
        renderItem={({ item }) => (
          <MessageCard message={item} onPress={handlePressMessage} />
        )}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 20, gap: 8 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      />

      {/* Message detail modal — simple overlay pane */}
      {openMessage ? (
        <View
          pointerEvents="auto"
          className="absolute inset-0 bg-black/80"
          style={{ justifyContent: 'center', padding: 20 }}
        >
          <Pressable
            onPress={() => setOpenId(null)}
            className="absolute inset-0"
          />
          <View
            className="rounded-2xl border bg-slate-950/95 p-5"
            style={{
              borderColor: TONE_PALETTE[openMessage.tone].color,
              shadowColor: TONE_PALETTE[openMessage.tone].color,
              shadowOpacity: 0.9,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[9px] font-black uppercase tracking-[4px]"
                style={{
                  color: TONE_PALETTE[openMessage.tone].color,
                  textShadowColor: TONE_PALETTE[openMessage.tone].color,
                  textShadowRadius: 8,
                }}
              >
                {TONE_PALETTE[openMessage.tone].label}
              </Text>
              <Pressable
                onPress={() => setOpenId(null)}
                aria-label="Close"
                className="rounded-lg border border-slate-700 bg-white/5 p-1.5 active:opacity-60"
              >
                <X size={12} color="#94A3B8" />
              </Pressable>
            </View>
            <Text
              className="mt-2 text-lg font-black tracking-[2px] text-slate-100"
              style={{
                textShadowColor: TONE_PALETTE[openMessage.tone].color,
                textShadowRadius: 10,
              }}
            >
              {openMessage.title}
            </Text>
            <View
              className="mt-2 h-[1px]"
              style={{ backgroundColor: TONE_PALETTE[openMessage.tone].color }}
            />
            <Text className="mt-3 text-[12px] leading-5 text-slate-300">
              {openMessage.body}
            </Text>
            <Text className="mt-4 text-[9px] uppercase tracking-widest text-slate-600">
              Reçu le{' '}
              {new Date(openMessage.sentAt).toLocaleString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MessageCard = memo(function MessageCard({
  message,
  onPress,
}: {
  message: SystemMessage;
  onPress: (id: string) => void;
}) {
  const palette = TONE_PALETTE[message.tone];
  const unread = !message.read;
  return (
    <Pressable
      onPress={() => onPress(message.id)}
      className="flex-row items-center rounded-2xl border p-3 active:opacity-70"
      style={{
        borderColor: unread ? palette.color : '#1e293b',
        backgroundColor: unread
          ? `${palette.color}14`
          : 'rgba(255,255,255,0.02)',
        shadowColor: unread ? palette.color : 'transparent',
        shadowOpacity: unread ? 0.75 : 0,
        shadowRadius: unread ? 12 : 0,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-full"
        style={{
          borderWidth: 1,
          borderColor: palette.color,
          backgroundColor: `${palette.color}22`,
        }}
      >
        {unread ? (
          <Mail size={14} color={palette.color} strokeWidth={2.25} />
        ) : (
          <MailOpen size={14} color="#64748B" strokeWidth={2} />
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className="flex-1 text-[12px] font-black uppercase tracking-[2px]"
            numberOfLines={1}
            style={{
              color: unread ? palette.color : '#94A3B8',
              textShadowColor: unread ? palette.color : 'transparent',
              textShadowRadius: unread ? 8 : 0,
            }}
          >
            {message.title}
          </Text>
          <Text className="ml-2 text-[9px] uppercase tracking-widest text-slate-500">
            {formatTimestamp(message.sentAt)}
          </Text>
        </View>
        <Text
          className="mt-0.5 text-[11px] italic text-slate-500"
          numberOfLines={1}
        >
          {message.body.replace(/\n+/g, ' · ')}
        </Text>
      </View>
      {unread ? (
        <View
          className="ml-2 h-2 w-2 rounded-full"
          style={{
            backgroundColor: '#F43F5E',
            shadowColor: '#F43F5E',
            shadowOpacity: 0.9,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      ) : null}
    </Pressable>
  );
});

function EmptyState() {
  return (
    <View className="mt-24 items-center justify-center px-5">
      <View
        className="h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-white/5"
        style={{
          shadowColor: '#22D3EE',
          shadowOpacity: 0.4,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        <Inbox size={24} color="#64748B" strokeWidth={1.5} />
      </View>
      <Text className="mt-4 text-[12px] font-black uppercase tracking-[3px] text-slate-400">
        Aucun message
      </Text>
      <Text className="mt-2 text-center text-[10px] italic text-slate-600">
        Le Système t'observe. Il parlera quand l'heure sonnera.
      </Text>
    </View>
  );
}
