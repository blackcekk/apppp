import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { DCAPlan } from '@/types/portfolio';
import { DCAPlanRepository } from '@/repositories/DCAPlanRepository';
import { Calendar, DollarSign, Hash, Clock } from 'lucide-react-native';

export default function DCAFormScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    symbol: '',
    frequency: 'monthly' as DCAPlan['frequency'],
    amountType: 'cash' as DCAPlan['amountType'],
    amount: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.symbol.trim()) {
      Alert.alert('Hata', 'Sembol alanı zorunludur.');
      return;
    }

    if (!formData.amount.trim() || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar giriniz.');
      return;
    }

    setIsSubmitting(true);

    try {
      const nextRunAt = DCAPlanRepository.calculateNextRunDate(formData.frequency);
      
      const newPlan: Omit<DCAPlan, 'id'> = {
        symbol: formData.symbol.toUpperCase(),
        frequency: formData.frequency,
        amountType: formData.amountType,
        amount: Number(formData.amount),
        nextRunAt: nextRunAt.toISOString(),
        isActive: true,
      };

      await DCAPlanRepository.add(newPlan);
      
      Alert.alert(
        'Başarılı',
        'DCA planınız oluşturuldu.',
        [{ text: 'Tamam', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating DCA plan:', error);
      Alert.alert('Hata', 'Plan oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const frequencyOptions: { value: DCAPlan['frequency']; label: string }[] = [
    { value: 'weekly', label: 'Haftalık' },
    { value: 'biweekly', label: '2 Haftalık' },
    { value: 'monthly', label: 'Aylık' },
  ];

  const amountTypeOptions: { value: DCAPlan['amountType']; label: string; icon: any }[] = [
    { value: 'cash', label: 'Nakit Tutarı', icon: DollarSign },
    { value: 'units', label: 'Adet', icon: Hash },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Yeni DCA Planı',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Varlık Bilgileri</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Sembol</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }
              ]}
              value={formData.symbol}
              onChangeText={(text) => setFormData(prev => ({ ...prev, symbol: text }))}
              placeholder="Örn: AAPL, BTC"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sıklık</Text>
          
          <View style={styles.optionsGrid}>
            {frequencyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: formData.frequency === option.value ? colors.primary : colors.background,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, frequency: option.value }))}
              >
                <Clock 
                  color={formData.frequency === option.value ? colors.background : colors.textSecondary} 
                  size={20} 
                />
                <Text style={[
                  styles.optionText,
                  { 
                    color: formData.frequency === option.value ? colors.background : colors.text 
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Miktar Türü</Text>
          
          <View style={styles.optionsGrid}>
            {amountTypeOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: formData.amountType === option.value ? colors.primary : colors.background,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, amountType: option.value }))}
                >
                  <IconComponent 
                    color={formData.amountType === option.value ? colors.background : colors.textSecondary} 
                    size={20} 
                  />
                  <Text style={[
                    styles.optionText,
                    { 
                      color: formData.amountType === option.value ? colors.background : colors.text 
                    }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Miktar</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {formData.amountType === 'cash' ? 'Nakit Tutarı' : 'Adet'}
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }
              ]}
              value={formData.amount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
              placeholder={formData.amountType === 'cash' ? '100.00' : '1.5'}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { 
              backgroundColor: isSubmitting ? colors.textSecondary : colors.primary,
            }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Calendar color={colors.background} size={20} />
          <Text style={[styles.submitText, { color: colors.background }]}>
            {isSubmitting ? 'Oluşturuluyor...' : 'Plan Oluştur'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  optionsGrid: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '600',
  },
});