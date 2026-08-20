import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { PET_SPRITES } from './assets';

type PetType = 'momoxi' | 'olho';

type PetProfileAvatarProps = {
  petChoice: PetType;
};

export default function PetProfileAvatar({ petChoice }: PetProfileAvatarProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  const allSprites = PET_SPRITES[petChoice] || PET_SPRITES.momoxi;

  const maxFrames = petChoice === 'olho' ? 5 : 8;
  const idleSprites = allSprites.slice(0, maxFrames);

  useEffect(() => {
    setFrameIndex(0);

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % idleSprites.length);
    }, 150);

    return () => clearInterval(interval);
  }, [petChoice, idleSprites.length]);

  return (
    <View style={styles.avatarBox}>
      <Image
        source={idleSprites[frameIndex % idleSprites.length]}
        style={styles.avatarImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatarBox: {
    width: 130,
    height: 140,
    backgroundColor: '#2A2A35',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFD166',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    justifyContent: 'center',
    width: 200,
    height: 200,
    resizeMode: 'contain',
    // @ts-ignore
    imageRendering: 'pixelated',
    marginLeft: 12,
  },
});