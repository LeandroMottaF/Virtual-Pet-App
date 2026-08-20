import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PetProfileAvatar from './petprofileavatar';
import ProgressBar from './progressbar';

export type PetData = {
  id: string;
  name: string;
  type: 'momoxi' | 'olho';
  hunger: number;
  friendshipExp: number; // Exp para o próximo nível
  friendshipLevel: number;
};

type PetStatusModalProps = {
  visible: boolean;
  onClose: () => void;
  pets: PetData[];
};

export default function PetStatusModal({ visible, onClose, pets }: PetStatusModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Garante que o índice fique dentro dos limites caso a lista de pets mude
  const safeIndex = Math.min(currentIndex, Math.max(0, pets.length - 1));
  const currentPet = pets[safeIndex] || pets[0];

  const handlePrevPet = () => {
    if (pets.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? pets.length - 1 : prev - 1));
  };

  const handleNextPet = () => {
    if (pets.length <= 1) return;
    setCurrentIndex((prev) => (prev === pets.length - 1 ? 0 : prev + 1));
  };

  if (!currentPet) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* BOTÃO DE FECHAR */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* 🎠 CARROSSEL COM FOTO E SETAS */}
          <View style={styles.carouselContainer}>
            <TouchableOpacity
              style={[styles.arrowButton, pets.length <= 1 && styles.disabledArrow]}
              onPress={handlePrevPet}
              disabled={pets.length <= 1}
            >
              <Text style={[styles.arrowText, { fontSize: 20, alignContent: 'center', marginBottom: 3, marginRight: 3 }]}>◀</Text>
            </TouchableOpacity>

            <View style={styles.largeAvatarWrapper}>
              <PetProfileAvatar petChoice={currentPet.type} />
            </View>

            <TouchableOpacity
              style={[styles.arrowButton, pets.length <= 1 && styles.disabledArrow]}
              onPress={handleNextPet}
              disabled={pets.length <= 1}
            >
              <Text style={[styles.arrowText, { fontSize: 20, alignContent: 'center', marginBottom: 3, marginLeft: 3 }]}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* NOME DO PET + INDICADOR DE QUANTIDADE DE PETS */}
          <View style={styles.petNameContainer}>
            <Text style={styles.petName}>{currentPet.name}</Text>
            {pets.length > 1 && (
              <Text style={styles.petCounterText}>{`${safeIndex + 1}/${pets.length}`}</Text>
            )}
            <View style={styles.badgeLevel}>
              <Text style={styles.badgeText}>Nível {currentPet.friendshipLevel}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* STATUS: FOME E AMIZADE DO PET ATUAL */}
          <View style={styles.statsContainer}>
            <ProgressBar
              label="🍖 Comida"
              value={currentPet.hunger}
              color="#FF5964"
            />

            <ProgressBar
              label="❤️ Amizade"
              value={currentPet.friendshipExp}
              color="#FF6B6B"
              subLabel={`Lvl ${currentPet.friendshipLevel}`}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    height: 540,
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#252530',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: '#3A3A4A',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 10,
  },
  closeButtonText: {
    color: '#A0A0A0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  carouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 60,
  },
  largeAvatarWrapper: {
    marginHorizontal: 16,
    transform: [{ scale: 1.25 }],
  },
  arrowButton: {
    backgroundColor: '#64d8e5',
    width: 45,
    height: 45,
    borderWidth: 2,
    borderRadius: 5,
    borderColor: '#090909',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 13,
  },
  disabledArrow: {
    opacity: 0.3,
    borderColor: '#555',
  },
  arrowText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  petNameContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  petName: {
    color: '#FFD166',
    fontSize: 24,
    fontWeight: 'bold',
  },
  petCounterText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  badgeLevel: {
    backgroundColor: '#1E1E24',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD166',
    marginTop: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#3A3A4A',
    marginVertical: 16,
  },
  statsContainer: {
    width: '100%',
  },
});