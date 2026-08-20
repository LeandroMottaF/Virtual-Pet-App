import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';

import { EGG_SPRITES, EGG_PREVIEWS } from './assets';

type PetType = 'momoxi' | 'olho';

type Props = {
  onSelectEgg: (pet: PetType) => void;
};

export default function EggSelectionScreen({ onSelectEgg }: Props) {
  const [selected, setSelected] = useState<PetType>('momoxi');
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const ALL_EGG_SPRITES = [
      ...EGG_SPRITES.momoxi,
      ...EGG_SPRITES.olho,
    ];

    ALL_EGG_SPRITES.forEach((sprite) => {
      const asset = Asset.fromModule(sprite);
      if (asset.uri) {
        Image.prefetch(asset.uri);
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev === 0 ? 1 : 0));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Escolha seu Ovo!</Text>
        <Text style={styles.subtitle}>Quem vai nascer dele?</Text>

        <View style={styles.cardsContainer}>
          {/* Card do Ovo Momoxi */}
          <TouchableOpacity
            style={[styles.card, selected === 'momoxi' && styles.cardSelected]}
            onPress={() => setSelected('momoxi')}
            activeOpacity={0.8}
          >
            <Image
              source={
                selected === 'momoxi'
                  ? EGG_SPRITES.momoxi[frameIndex]
                  : EGG_PREVIEWS.momoxi
              }
              style={styles.eggImage}
            />
          </TouchableOpacity>

          {/* Card do Ovo Olho */}
          <TouchableOpacity
            style={[styles.card, selected === 'olho' && styles.cardSelected]}
            onPress={() => setSelected('olho')}
            activeOpacity={0.8}
          >
            <Image
              source={
                selected === 'olho'
                  ? EGG_SPRITES.olho[frameIndex]
                  : EGG_PREVIEWS.olho
              }
              style={styles.eggImage}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => onSelectEgg(selected)}
        >
          <Text style={styles.confirmText}>Chocar este Ovo!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121214',
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#121214',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    overflow: 'hidden',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    marginTop: -50,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 80,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#1E1E24',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    width: 140,
    height: 140,
  },
  cardSelected: {
    borderColor: '#FFD166',
    backgroundColor: '#2A2A35',
  },
  eggImage: {
    width: 125,
    height: 125,
    resizeMode: 'contain',
    // @ts-ignore
    imageRendering: 'pixelated',
  },
  confirmButton: {
    backgroundColor: '#FFD166',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  confirmText: {
    color: '#121214',
    fontSize: 16,
    fontWeight: 'bold',
  },
});