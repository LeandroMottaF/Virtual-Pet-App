import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MEAT_ICON_ASSET } from './assets';

type ShopModalProps = {
  visible: boolean;
  onClose: () => void;
  coins: number;
  onBuyMeat: (cost: number) => void;
};

export default function ShopModal({ visible, onClose, coins, onBuyMeat }: ShopModalProps) {
  const MEAT_PRICE = 15;

  const handleBuy = () => {
    if (coins >= MEAT_PRICE) {
      onBuyMeat(MEAT_PRICE);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>🏪 Loja da Ilha</Text>

          <View style={styles.itemRow}>
            <Image source={MEAT_ICON_ASSET} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}> Carne</Text>
              <Text style={styles.itemPrice}>💰 {MEAT_PRICE} moedas</Text>
            </View>
            <TouchableOpacity 
              style={[styles.buyBtn, coins < MEAT_PRICE && styles.buyBtnDisabled]} 
              onPress={handleBuy}
              disabled={coins < MEAT_PRICE}
            >
              <Text style={styles.buyBtnText}>Comprar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 340, backgroundColor: '#252530', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: '#3A3A4A', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 12, right: 16 },
  closeTxt: { color: '#888', fontSize: 18, fontWeight: 'bold' },
  title: { color: '#FFD166', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E24', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#3A3A4A', width: '100%' },
  itemImage: { width: 44, height: 44, resizeMode: 'contain' },
  itemInfo: { flex: 1, marginLeft: 10 },
  itemName: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  itemDesc: { color: '#AAA', fontSize: 10 },
  itemPrice: { color: '#FFD166', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  buyBtn: { backgroundColor: '#FFD166', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  buyBtnDisabled: { opacity: 0.4 },
  buyBtnText: { color: '#1E1E24', fontSize: 12, fontWeight: 'bold' },
});