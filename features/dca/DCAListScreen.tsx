import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { DCAPlan } from '@/types/portfolio';
import { DCAPlanRepository } from '@/repositories/DCAPlanRepository';
import { TransactionRepository } from '@/repositories/TransactionRepository';
import { Plus, Calendar, DollarSign, TrendingUp, Play, Pause, Trash2 } from 'lucide-react-native';
import { formatCurrency } from '@/utils/formatters';

export default function DCAListScreen() {
  const { colors } = useTheme();
  const { addTransaction } = usePortfolio();
  const { currentCurrency } = useCurrency();
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<DCAPlan[]>([]);
  const [duePlans, setDuePlans] = useState<DCAPlan[]>([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const allPlans = await DCAPlanRepository.getAll();
      const due = await DCAPlanRepository.getDue();
      setPlans(allPlans);
      setDuePlans(due);
    } catch (error) {
      console.error('Error loading DCA plans:', error);
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      await DCAPlanRepository.update(planId, { isActive: !isActive });
      await loadPlans();
    } catch (error) {
      console.error('Error toggling plan status:', error);
    }
  };

  const deletePlan = async (planId: string) => {
    Alert.alert(
      'Plan Sil',
      'Bu DCA planını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await DCAPlanRepository.remove(planId);
              await loadPlans();
            } catch (error) {
              console.error('Error deleting plan:', error);
            }
          }
        }
      ]
    );
  };

  const executePlan = async (plan: DCAPlan) => {
    try {
      // Mock price for execution
      const mockPrice = Math.random() * 100 + 50;
      
      const quantity = plan.amountType === 'cash' 
        ? plan.amount / mockPrice 
        : plan.amount;

      // Add transaction to portfolio
      const newTransaction = {
        symbol: plan.symbol,
        side: 'buy' as const,
        quantity,
        price: mockPrice,
        fee: 0,
        note: `DCA Plan Execution - ${plan.frequency}`,
        attachments: [],
        date: new Date().toISOString(),
      };

      await TransactionRepository.add(newTransaction);
      addTransaction(newTransaction);

      // Update next run date
      await DCAPlanRepository.updateNextRunDate(plan.id);
      
      Alert.alert(
        'Plan Gerçekleştirildi',
        `${plan.symbol} için ${quantity.toFixed(4)} adet alım gerçekleştirildi.`,
        [{ text: 'Tamam' }]
      );

      await loadPlans();
    } catch (error) {
      console.error('Error executing plan:', error);
      Alert.alert('Hata', 'Plan gerçekleştirilemedi.');
    }
  };

  const getFrequencyText = (frequency: DCAPlan['frequency']) => {
    switch (frequency) {
      case 'weekly': return 'Haftalık';
      case 'biweekly': return '2 Haftalık';
      case 'monthly': return 'Aylık';
      default: return frequency;
    }
  };

  const renderPlan = (plan: DCAPlan, isDue: boolean = false) => (
    <View key={plan.id} style={[
      styles.planItem, 
      { 
        backgroundColor: colors.card, 
        borderColor: isDue ? colors.warning : colors.border,
        borderWidth: isDue ? 2 : 1,
      }
    ]}>
      <View style={styles.planHeader}>
        <View style={styles.planInfo}>
          <Text style={[styles.planSymbol, { color: colors.text }]}>{plan.symbol}</Text>
          <Text style={[styles.planFrequency, { color: colors.textSecondary }]}>
            {getFrequencyText(plan.frequency)}
          </Text>
        </View>
        
        <View style={styles.planActions}>
          <TouchableOpacity
            onPress={() => togglePlanStatus(plan.id, plan.isActive)}
            style={[
              styles.actionButton,
              { backgroundColor: plan.isActive ? colors.success : colors.textSecondary }
            ]}
          >
            {plan.isActive ? (
              <Pause color={colors.background} size={16} />
            ) : (
              <Play color={colors.background} size={16} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => deletePlan(plan.id)}
            style={[styles.actionButton, { backgroundColor: colors.error }]}
          >
            <Trash2 color={colors.background} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.planDetails}>
        <View style={styles.planAmount}>
          <DollarSign color={colors.primary} size={16} />
          <Text style={[styles.amountText, { color: colors.text }]}>
            {plan.amountType === 'cash' 
              ? formatCurrency(plan.amount, currentCurrency)
              : `${plan.amount} adet`
            }
          </Text>
        </View>

        <View style={styles.planNextRun}>
          <Calendar color={colors.textSecondary} size={16} />
          <Text style={[styles.nextRunText, { color: colors.textSecondary }]}>
            Sonraki: {new Date(plan.nextRunAt).toLocaleDateString('tr')}
          </Text>
        </View>
      </View>

      {isDue && plan.isActive && (
        <TouchableOpacity
          style={[styles.executeButton, { backgroundColor: colors.primary }]}
          onPress={() => executePlan(plan)}
        >
          <TrendingUp color={colors.background} size={16} />
          <Text style={[styles.executeText, { color: colors.background }]}>
            Şimdi Gerçekleştir
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'DCA Planları',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/dca-form')}
              style={[styles.addButton, { backgroundColor: colors.primary }]}
            >
              <Plus color={colors.background} size={20} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {duePlans.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.warning }]}>
              Gerçekleştirilmeyi Bekleyen Planlar
            </Text>
            {duePlans.map(plan => renderPlan(plan, true))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Tüm Planlar ({plans.length})
          </Text>
          
          {plans.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar color={colors.textSecondary} size={48} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Henüz DCA planınız yok
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                Düzenli yatırım yapmak için bir plan oluşturun
              </Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/dca-form')}
              >
                <Plus color={colors.background} size={20} />
                <Text style={[styles.createButtonText, { color: colors.background }]}>
                  İlk Planınızı Oluşturun
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            plans.map(plan => renderPlan(plan))
          )}
        </View>
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
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  planItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planSymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  planFrequency: {
    fontSize: 14,
  },
  planActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planDetails: {
    gap: 8,
    marginBottom: 12,
  },
  planAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  planNextRun: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextRunText: {
    fontSize: 14,
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  executeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});