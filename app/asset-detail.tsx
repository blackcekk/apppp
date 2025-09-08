import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { PriceChart } from '@/components/PriceChart';
import { TransactionList } from '@/components/TransactionList';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react-native';
import { ChartData } from '@/types/portfolio';

type Period = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const { portfolio, transactions } = usePortfolio();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1M');
  const [isLoading] = useState(false);
  
  const asset = useMemo(() => {
    return portfolio.find(a => a.id === id);
  }, [portfolio, id]);
  
  const assetTransactions = useMemo(() => {
    return transactions.filter(t => t.assetId === id).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, id]);
  
  // Mock chart data - in production, fetch from API
  const chartData = useMemo<ChartData[]>(() => {
    if (!asset) return [];
    
    const now = Date.now();
    const periods: Record<Period, number> = {
      '1D': 24,
      '1W': 7 * 24,
      '1M': 30 * 24,
      '3M': 90 * 24,
      '1Y': 365 * 24,
      'ALL': 365 * 24 * 2,
    };
    
    const hours = periods[selectedPeriod];
    const interval = hours / 50; // 50 data points
    
    return Array.from({ length: 50 }, (_, i) => {
      const variance = Math.random() * 0.1 - 0.05; // ±5% variance
      const trend = selectedPeriod === '1D' ? 0 : (i / 50) * 0.02; // slight upward trend
      return {
        timestamp: now - (hours - i * interval) * 3600000,
        price: asset.currentPrice * (1 + variance + trend),
        volume: Math.random() * 1000000,
      };
    });
  }, [asset, selectedPeriod]);
  
  if (!asset) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Asset Not Found' }} />
        <Text style={[styles.errorText, { color: colors.error }]}>
          Asset not found
        </Text>
      </View>
    );
  }
  
  const isPositive = asset.profit >= 0;
  const profitColor = isPositive ? colors.success : colors.error;
  const ProfitIcon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        title: asset.name,
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
      }} />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.currentPrice, { color: colors.text }]}>
            {getCurrencySymbol()}{asset.currentPrice.toFixed(2)}
          </Text>
          <View style={styles.changeContainer}>
            <ProfitIcon size={16} color={profitColor} />
            <Text style={[styles.changeText, { color: profitColor }]}>
              {getCurrencySymbol()}{Math.abs(asset.profit).toFixed(2)} ({asset.profitPercentage.toFixed(2)}%)
            </Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('quantity')}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {asset.quantity.toFixed(4)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('avgPrice')}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {getCurrencySymbol()}{asset.avgPrice.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('totalValue')}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {getCurrencySymbol()}{asset.value.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={[styles.chartSection, { backgroundColor: colors.card }]}>
        <View style={styles.periodSelector}>
          {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as Period[]).map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                { backgroundColor: selectedPeriod === period ? colors.primary : 'transparent' }
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodText,
                { color: selectedPeriod === period ? '#fff' : colors.textSecondary }
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <PriceChart data={chartData} height={250} />
        )}
      </View>
      
      <View style={[styles.transactionsSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('transactions')}
        </Text>
        <TransactionList transactions={assetTransactions} />
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          activeOpacity={0.8}
        >
          <DollarSign size={20} color="#fff" />
          <Text style={styles.actionButtonText}>{t('buy')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          activeOpacity={0.8}
        >
          <Activity size={20} color="#fff" />
          <Text style={styles.actionButtonText}>{t('sell')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    marginBottom: 12,
  },
  priceContainer: {
    marginBottom: 20,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartSection: {
    padding: 16,
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionsSection: {
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});