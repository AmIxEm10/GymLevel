/**
 * ErrorBoundary.tsx
 * -----------------
 * Global React error boundary. Wraps the root Stack in _layout.tsx so any
 * unhandled component exception shows a recoverable crash screen instead of a
 * blank/red production screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <Stack />
 *   </ErrorBoundary>
 */

import * as Updates from 'expo-updates';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to your monitoring service here (e.g. Sentry) when integrated.
    if (__DEV__) {
      console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
    }
  }

  private handleReload = async () => {
    try {
      // Try an OTA reload first (expo-updates); falls back to app restart.
      await Updates.reloadAsync();
    } catch {
      // If reloadAsync is unavailable (dev client), reset local state so the
      // tree can attempt to re-render.
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{ flex: 1, backgroundColor: '#020617' }}
      >
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              borderWidth: 2,
              borderColor: '#ef4444',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              backgroundColor: 'rgba(239,68,68,0.08)',
            }}
          >
            <Text style={{ fontSize: 32 }}>⚠</Text>
          </View>

          {/* Title */}
          <Text
            style={{
              color: '#f1f5f9',
              fontSize: 20,
              fontWeight: '900',
              letterSpacing: 3,
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: 8,
              textShadowColor: '#ef4444',
              textShadowRadius: 12,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            Erreur Système
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              color: '#94a3b8',
              fontSize: 13,
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 8,
            }}
          >
            Une anomalie inattendue a interrompu le Système.
          </Text>

          {/* Error detail (dev only) */}
          {__DEV__ && this.state.error ? (
            <View
              style={{
                backgroundColor: '#0d1117',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#1e2d45',
                padding: 12,
                marginBottom: 24,
                width: '100%',
              }}
            >
              <Text
                style={{
                  color: '#f87171',
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
                numberOfLines={6}
              >
                {this.state.error.message}
              </Text>
            </View>
          ) : (
            <View style={{ marginBottom: 24 }} />
          )}

          {/* Reload button */}
          <Pressable
            onPress={this.handleReload}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#3b82f6',
              borderRadius: 14,
              backgroundColor: 'rgba(59,130,246,0.15)',
              paddingHorizontal: 28,
              paddingVertical: 14,
              shadowColor: '#3b82f6',
              shadowOpacity: 0.7,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 0 },
            })}
            accessibilityLabel="Relancer l'application"
            accessibilityRole="button"
          >
            <Text
              style={{
                color: '#93c5fd',
                fontSize: 12,
                fontWeight: '900',
                letterSpacing: 4,
                textTransform: 'uppercase',
                textShadowColor: '#3b82f6',
                textShadowRadius: 8,
                textShadowOffset: { width: 0, height: 0 },
              }}
            >
              Relancer le Système
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}
