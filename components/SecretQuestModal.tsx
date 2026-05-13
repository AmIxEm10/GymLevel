import { Eye, Key, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';

import { useAppStore } from '@/store/useAppStore';

/**
 * Dark & mysterious modal that reveals a freshly-triggered secret quest.
 * Violet/black palette — intentionally different from the gold/neon loot
 * drop modal to tag these drops as hidden achievements.
 */
export function SecretQuestModal() {
  const drop = useAppStore(s => s.lastSecretQuest);
  const dismiss = useAppStore(s => s.dismissLastSecretQuest);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (drop) {
      opacity.setValue(0);
      scale.setValue(0.9);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [drop, opacity, scale]);

  if (!drop) return null;

  return (
    <Modal
      visible={drop !== null}
      transparent
      animationType="none"
      onRequestClose={dismiss}
    >
      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: 'rgba(10,0,20,0.92)',
          opacity,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({ backdropFilter: 'blur(14px)' } as any),
        }}
      >
        <Animated.Text
          className="mb-3 text-[10px] font-bold uppercase tracking-[7px]"
          style={{
            color: '#C084FC',
            textShadowColor: '#A855F7',
            textShadowRadius: 12,
            opacity,
          }}
        >
          ◆ Quête Secrète Complétée ◆
        </Animated.Text>

        <Animated.View
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 24,
            padding: 28,
            backgroundColor: 'rgba(3,0,10,0.92)',
            borderWidth: 2,
            borderColor: '#A855F7',
            transform: [{ scale }],
            shadowColor: '#A855F7',
            shadowOpacity: 0.95,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          {/* Header */}
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-center">
              <Eye size={14} color="#C084FC" strokeWidth={2.25} />
              <Text
                className="ml-1.5 text-[10px] font-black uppercase tracking-[5px] text-purple-300"
                style={{ textShadowColor: '#A855F7', textShadowRadius: 8 }}
              >
                Secret
              </Text>
            </View>
            <Pressable
              onPress={dismiss}
              aria-label="Fermer"
              className="rounded-lg border border-slate-800 bg-white/[0.03] p-1.5 active:opacity-60"
            >
              <X size={14} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Title */}
          <Text
            className="mt-5 text-center text-3xl font-black tracking-[2px] text-slate-100"
            style={{
              textShadowColor: '#A855F7',
              textShadowRadius: 18,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            {drop.def.name.toUpperCase()}
          </Text>

          {/* Description */}
          <Text className="mt-3 text-center text-sm italic leading-relaxed text-purple-200/90">
            « {drop.def.description} »
          </Text>

          {/* Hint */}
          <View className="mt-5 rounded-xl border border-purple-500/40 bg-purple-500/10 p-3">
            <View className="flex-row items-center">
              <Key size={12} color="#C084FC" strokeWidth={2} />
              <Text className="ml-1.5 text-[10px] font-bold uppercase tracking-[3px] text-purple-300">
                Déclencheur
              </Text>
            </View>
            <Text className="mt-1.5 text-xs leading-relaxed text-slate-300">
              {drop.def.hint}
            </Text>
          </View>

          {/* Rewards */}
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2">
              <Text className="text-[9px] font-bold uppercase tracking-widest text-amber-300">
                XP
              </Text>
              <Text
                className="mt-0.5 text-lg font-black text-amber-200"
                style={{ textShadowColor: '#FBBF24', textShadowRadius: 8 }}
              >
                +{drop.def.xpReward}
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-purple-500/50 bg-purple-500/10 px-3 py-2">
              <Text className="text-[9px] font-bold uppercase tracking-widest text-purple-300">
                Loot garanti
              </Text>
              <Text className="mt-0.5 text-sm font-black uppercase tracking-widest text-purple-200">
                {drop.def.lootRarity}
              </Text>
            </View>
          </View>

          {/* CTA */}
          <Pressable
            onPress={dismiss}
            className="mt-6 rounded-xl border-2 border-purple-400 bg-purple-500/20 py-3 active:opacity-70"
            style={{
              shadowColor: '#A855F7',
              shadowOpacity: 0.9,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Text
              className="text-center text-sm font-black uppercase tracking-[5px] text-purple-100"
              style={{ textShadowColor: '#A855F7', textShadowRadius: 10 }}
            >
              Accepter la Vérité
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
