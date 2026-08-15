import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type ProgressBarProps = {
  label: string;
  value: number; // 0 a 100
  color: string;
  subLabel?: string;
};

export default function ProgressBar({ label, value, color, subLabel }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {subLabel ? (
          <Text style={styles.subLabel}>{subLabel}</Text>
        ) : (
          <Text style={styles.valueText}>{`${Math.round(clampedValue)}%`}</Text>
        )}
      </View>
      
      <View style={styles.barBackground}>
        <View 
          style={[
            styles.barFill, 
            { width: `${clampedValue}%`, backgroundColor: color }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subLabel: {
    color: '#FFD166',
    fontSize: 13,
    fontWeight: 'bold',
  },
  valueText: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  barBackground: {
    height: 12,
    backgroundColor: '#1E1E24',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3A45',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
});