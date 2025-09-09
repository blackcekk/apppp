import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';

import { usePortfolio } from '@/providers/PortfolioProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { PieChart, BarChart3, RefreshCw } from 'lucide-react-native';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

interface RebalanceRecommendation {
  symbol: string;
  name: string;
  currentWeight: number;
  targetWeight: number;
  currentValue: number;
  targetValue: number;
  action: 'buy' | 'sell' | 'hold';
  amount: number;
  difference: number;
}

export default function RebalanceScreen() {
  const { colors } = useTheme();

  const { portfolio, totalValue } = usePortfolio();
  const { currentCurrency } = useCurrency();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<'pie' | 'bar'>('pie');

  const rebalanceData = useMemo(() => {
    if (totalValue === 0) return [];

    const recommendations: RebalanceRecommendation[] = [];
    let totalTargetWeight = 0;

    // Calculate current weights and prepare recommendations
    portfolio.forEach(asset => {
      const currentWeight = (asset.value / totalValue) * 100;
      const targetWeight = asset.targetWeight || 0;
      totalTargetWeight += targetWeight;

      const targetValue = (targetWeight / 100) * totalValue;
      const difference = targetValue - asset.value;
      const action = Math.abs(difference) < totalValue * 0.01 ? 'hold' : 
                    difference > 0 ? 'buy' : 'sell';

      recommendations.push({
        symbol: asset.symbol,
        name: asset.name,
        currentWeight,
        targetWeight,
        currentValue: asset.value,
        targetValue,
        action,
        amount: Math.abs(difference),
        difference
      });
    });

    // Normalize target weights if they don't add up to 100%
    if (totalTargetWeight > 0 && totalTargetWeight !== 100) {
      recommendations.forEach(rec => {
        rec.targetWeight = (rec.targetWeight / totalTargetWeight) * 100;
        rec.targetValue = (rec.targetWeight / 100) * totalValue;
        rec.difference = rec.targetValue - rec.currentValue;
        rec.amount = Math.abs(rec.difference);
        rec.action = Math.abs(rec.difference) < totalValue * 0.01 ? 'hold' : 
                     rec.difference > 0 ? 'buy' : 'sell';
      });
    }

    return recommendations.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }, [portfolio, totalValue]);

  const hasTargetWeights = portfolio.some(asset => asset.targetWeight && asset.targetWeight > 0);

  const renderAllocationChart = () => {
    if (!hasTargetWeights) {
      return (
        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            Hedef ağırlıkları ayarlayın
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Dağılım Karşılaştırması</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                { 
                  backgroundColor: viewMode === 'pie' ? colors.primary : 'transparent',
                  borderColor: colors.border 
                }
              ]}
              onPress={() => setViewMode('pie')}
            >
              <PieChart 
                size={16} 
                color={viewMode === 'pie' ? colors.background : colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                { 
                  backgroundColor: viewMode === 'bar' ? colors.primary : 'transparent',
                  borderColor: colors.border 
                }
              ]}
              onPress={() => setViewMode('bar')}
            >
              <BarChart3 
                size={16} 
                color={viewMode === 'bar' ? colors.background : colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chartContent}>
          {rebalanceData.map((item, index) => (
            <View key={item.symbol} style={styles.allocationItem}>
              <View style={styles.allocationHeader}>
                <Text style={[styles.assetSymbol, { color: colors.text }]}>{item.symbol}</Text>
                <View style={styles.weightComparison}>
                  <Text style={[styles.currentWeight, { color: colors.textSecondary }]}>
                    {formatPercentage(item.currentWeight)}
                  </Text>
                  <Text style={[styles.arrow, { color: colors.textSecondary }]}>→</Text>
                  <Text style={[styles.targetWeight, { color: colors.primary }]}>
                    {formatPercentage(item.targetWeight)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.progressBars}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        backgroundColor: colors.textSecondary,
                        width: `${Math.min(item.currentWeight, 100)}%`
                      }
                    ]} 
                  />
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        backgroundColor: colors.primary,
                        width: `${Math.min(item.targetWeight, 100)}%`
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!hasTargetWeights) {
      return null;
    }

    const actionableRecommendations = rebalanceData.filter(rec => rec.action !== 'hold');

    if (actionableRecommendations.length === 0) {
      return (
        <View style={[styles.recommendationsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Öneriler</Text>
          <View style={styles.balancedMessage}>
            <RefreshCw color={colors.success} size={24} />
            <Text style={[styles.balancedText, { color: colors.success }]}>
              Portföyünüz hedef dağılıma uygun!
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.recommendationsContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Yeniden Dengeleme Önerileri</Text>
        
        {actionableRecommendations.map(rec => (
          <View key={rec.symbol} style={[styles.recommendationItem, { borderColor: colors.border }]}>
            <View style={styles.recommendationHeader}>
              <Text style={[styles.recommendationSymbol, { color: colors.text }]}>
                {rec.symbol}
              </Text>
              <View style={[
                styles.actionBadge,
                { backgroundColor: rec.action === 'buy' ? colors.success : colors.error }
              ]}>
                <Text style={[styles.actionText, { color: colors.background }]}>
                  {rec.action === 'buy' ? 'AL' : 'SAT'}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.recommendationAmount, { color: colors.text }]}>
              {formatCurrency(rec.amount, currentCurrency)}
            </Text>
            
            <Text style={[styles.recommendationReason, { color: colors.textSecondary }]}>
              {rec.action === 'buy' 
                ? `Hedef ağırlığa ulaşmak için ${formatCurrency(rec.amount, currentCurrency)} alın`
                : `Hedef ağırlığa ulaşmak için ${formatCurrency(rec.amount, currentCurrency)} satın`
              }
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Yeniden Dengeleme',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderAllocationChart()}
        {renderRecommendations()}
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
  chartContainer: {
    borderRadius: 16,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chartContent: {
    gap: 16,
  },
  allocationItem: {
    gap: 8,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: '600',
  },
  weightComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentWeight: {
    fontSize: 14,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 14,
  },
  targetWeight: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBars: {
    gap: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 40,
  },
  recommendationsContainer: {
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  balancedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  balancedText: {
    fontSize: 16,
    fontWeight: '500',
  },
  recommendationItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationSymbol: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recommendationAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  recommendationReason: {
    fontSize: 14,
  },
});