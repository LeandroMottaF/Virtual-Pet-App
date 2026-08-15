import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import EggSelectionScreen from '../components/eggselectionscreen';
import HatchScreen from '../components/hatchscreen';
import GameMapScreen from '../components/gamemapscreen';

type GameState = 'SELECTING_EGG' | 'HATCHING' | 'PLAYING';
type PetType = 'momoxi' | 'olho';

export default function MainGame() {
  const [gameState, setGameState] = useState<GameState>('SELECTING_EGG');
  const [selectedPet, setSelectedPet] = useState<PetType>('momoxi');
  const [isLoading, setIsLoading] = useState(true);

  // 🎬 Animação de transição suave do MainGame
  const transitionAnim = useRef(new Animated.Value(0)).current;

  // 🔍 VERIFICA SE JÁ EXISTE UM SAVE ANTES DE RENDERIZAR QUALQUER TELA
  useEffect(() => {
    const checkInitialSave = async () => {
      try {
        const savedData = await AsyncStorage.getItem('@virtual_pet_data');
        if (savedData !== null) {
          const parsed = JSON.parse(savedData);

          // Se o pet existir no save e tiver um nome definido, pula a eclosão
          if (parsed.pet && parsed.pet.name && parsed.pet.name.trim().length > 0) {
            if (parsed.pet.type) {
              setSelectedPet(parsed.pet.type);
            }
            setGameState('PLAYING');
          }
        }
      } catch (e) {
        console.error('Erro ao verificar save no MainGame:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialSave();
  }, []);

  const handleSelectEgg = (pet: PetType) => {
    setSelectedPet(pet);
    setGameState('HATCHING');
  };

  const handleHatchComplete = () => {
    // 1. O overlay começa em 1 (totalmente visível cobrindo o corte)
    transitionAnim.setValue(1);

    // 2. Troca o componente do jogo de fundo
    setGameState('PLAYING');

    // 3. Faz o Fade Out da transição revelando o mapa sem sobressaltos
    Animated.timing(transitionAnim, {
      toValue: 0,
      duration: 1000, // 1 segundo de dissolução suave
      useNativeDriver: true,
    }).start();
  };

  // ⏳ TELA DE CARREGAMENTO RÁPIDA ENQUANTO LÊ O ASYNCSTORAGE
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD166" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {gameState === 'SELECTING_EGG' && (
        <EggSelectionScreen onSelectEgg={handleSelectEgg} />
      )}

      {gameState === 'HATCHING' && (
        <HatchScreen
          petChoice={selectedPet}
          onHatchComplete={handleHatchComplete}
        />
      )}

      {gameState === 'PLAYING' && (
        <GameMapScreen
          selectedPet={selectedPet}
          onRestartGame={() => setGameState('SELECTING_EGG')} // 👈 Volta para a seleção de ovo ao recomeçar
        />
      )}

      {/* 💥 OVERLAY DE TRANSIÇÃO SUAVE PERMANENTE NO MAINGAME */}
      <Animated.View
        style={[
          styles.transitionOverlay,
          { opacity: transitionAnim },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e24', // Garante que o fundo do container pai nunca fique branco
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1e1e24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transitionOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#c4c4c4',
    zIndex: 999,
  },
});