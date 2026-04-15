import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Root HTML shell used by Expo Router's static export.
 * This is where we inject the PWA meta tags and the global CSS that
 * kills the white bands on iOS "Add to Home Screen".
 *
 * Key ingredients:
 *   - viewport-fit=cover           → content extends under the notch
 *   - apple-mobile-web-app-capable → removes Safari chrome when launched
 *                                    from the Home Screen
 *   - black-translucent status bar → app background shows behind the bar
 *   - html/body background = #020617 → no white flash / safe-area edges
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* PWA — Apple */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="GymLevel" />

        {/* PWA — Android / generic */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#020617" />
        <meta name="color-scheme" content="dark" />

        {/* Expo Router default — keeps RN scroll locking disabled on web */}
        <ScrollViewStyleReset />

        {/* Global CSS — force every top-level node to the System's dark bg
            so iOS can't paint the safe-area insets white. */}
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const GLOBAL_CSS = `
  html, body {
    background-color: #020617 !important;
    margin: 0 !important;
    padding: 0 !important;
    min-height: 100vh;
    min-height: 100dvh;
    overscroll-behavior-y: none;
    -webkit-tap-highlight-color: transparent;
  }
  body {
    color-scheme: dark;
  }
  #root {
    background-color: #020617 !important;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
`;
