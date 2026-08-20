import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableWithoutFeedback, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HATCH_EGG_SPRITES } from './assets';

type PetType = 'momoxi' | 'olho';

type HatchProps = {
  petChoice: PetType;
  onHatchComplete: () => void;
};

type Stage = 'idle' | 'rachando' | 'rachandoMais' | 'quaseEclodindo' | 'eclodindo';

export default function HatchScreen({ petChoice, onHatchComplete }: HatchProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [frameIndex, setFrameIndex] = useState(0);
  const [isWaitingForClick, setIsWaitingForClick] = useState(false);
  const [step, setStep] = useState(0);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerImpact = () => {
    scaleAnim.setValue(1);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.08,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerShake = (intensity = 8) => {
    shakeAnim.stopAnimation();
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -intensity, duration: 35, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: intensity, duration: 35, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -intensity / 2, duration: 35, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: intensity / 2, duration: 35, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 35, useNativeDriver: true }),
    ]).start();
  };

  const changeStage = (nextStage: Stage) => {
    triggerImpact();
    setFrameIndex(0);
    setIsWaitingForClick(false);
    setStage(nextStage);
  };

  const currentSprites = HATCH_EGG_SPRITES[petChoice][stage];
  const allPetSprites = Object.values(HATCH_EGG_SPRITES[petChoice]).flat();

  useEffect(() => {
    if (stage === 'eclodindo' || stage === 'quaseEclodindo') return;

    const timer = setTimeout(() => {
      if (stage === 'idle') changeStage('rachando');
      else if (stage === 'rachando') changeStage('rachandoMais');
      else if (stage === 'rachandoMais') changeStage('quaseEclodindo');
    }, 3000);

    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage === 'eclodindo') return;

    setFrameIndex(0);

    const interval = setInterval(() => {
      setFrameIndex((prev) => {
        const totalFrames = currentSprites.length;

        if (stage === 'quaseEclodindo') {
          if (prev < 2) return prev + 1;
          return prev === 2 ? 3 : 2;
        }

        if (prev < totalFrames - 1) return prev + 1;
        return prev === totalFrames - 1 ? totalFrames - 2 : totalFrames - 1;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [stage]);

  useEffect(() => {
    if (stage === 'quaseEclodindo' && frameIndex >= 2) {
      setIsWaitingForClick(true);
    }
  }, [stage, frameIndex]);

  const handleEggClick = () => {
    if (stage === 'quaseEclodindo' && isWaitingForClick) {
      triggerImpact();
      changeStage('eclodindo');
      setStep(1);

      setTimeout(() => {
        setFrameIndex(1);
        setIsWaitingForClick(true);
      }, 250);
      return;
    }

    if (stage === 'eclodindo' && step === 1 && isWaitingForClick) {
      triggerImpact();
      triggerShake(3);

      setIsWaitingForClick(false);
      setStep(2);
      setFrameIndex(2);

      setTimeout(() => {
        setFrameIndex(3);
        setIsWaitingForClick(true);
      }, 250);
      return;
    }

    if (stage === 'eclodindo' && step === 2 && isWaitingForClick) {
      triggerImpact();
      triggerShake(10);

      setStep(3);
      setFrameIndex(4);
      setIsWaitingForClick(true);
      return;
    }

    if (stage === 'eclodindo' && step === 3 && isWaitingForClick) {
      triggerImpact();
      setFrameIndex(5);
      setIsWaitingForClick(false);
      triggerHatchFlash();
    }
  };

  const triggerHatchFlash = () => {
    const FADE_IN_TIME = 800;

    Animated.timing(flashAnim, {
      toValue: 1,
      duration: FADE_IN_TIME,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      onHatchComplete();
    }, FADE_IN_TIME);
  };

  const safeFrameIndex = Math.min(frameIndex, currentSprites.length - 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 💥 OVERLAY BRANCO RETANGULAR COM FADE IN E FADE OUT */}
        <Animated.View 
          style={[
            styles.flashOverlay, 
            { opacity: flashAnim }
          ]} 
          pointerEvents="none" 
        />

        {/* PRÉ-CARREGAMENTO OCULTO */}
        <View style={styles.hiddenPreload} pointerEvents="none">
          {allPetSprites.map((spriteSrc, idx) => (
            <Image key={idx} source={spriteSrc} style={styles.preloadImage} />
          ))}
        </View>

        {/* MENSAGEM INFORMATIVA */}
        {isWaitingForClick ? (
          <Text style={styles.instructionText}>Clique no ovo para ajudar a descascar!</Text>
        ) : (
          <Text style={styles.waitingText}>O ovo está rachando...</Text>
        )}

        {/* OVO PRINCIPAL */}
        <TouchableWithoutFeedback onPress={handleEggClick}>
          <Animated.Image
            source={currentSprites[safeFrameIndex]}
            style={[
              styles.eggImage,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateX: shakeAnim },
                ],
              },
            ]}
          />
        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1e1e24',
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1e1e24',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  hiddenPreload: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
  },
  preloadImage: {
    width: 1,
    height: 1,
  },
  instructionText: {
    color: '#FFD166',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  waitingText: {
    color: '#A0A0A0',
    fontSize: 16,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  eggImage: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    // @ts-ignore
    imageRendering: 'pixelated',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#c4c4c4',
    zIndex: 10,
  },
});