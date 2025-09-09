import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { PriceChart } from '@/components/PriceChart';
import { TransactionList } from '@/components/TransactionList';
import { TrendingUp, TrendingDown, DollarSign, Activity, Plus, Minus } from 'lucide-react-native';
import { ChartData } from '@/types/portfolio';

type Period = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const { portfolio, transactions, addTransaction } = usePortfolio();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1M');
  const [isLoading] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
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
  
  const handleTrade = async () => {
    if (!quantity || parseFloat(quantity) <= 0) return;
    
    setIsProcessing(true);
    
    try {
      await addTransaction({
        assetId: asset.id,
        symbol: asset.symbol,
        type: tradeType,
        quantity: parseFloat(quantity),
        price: asset.currentPrice,
        date: new Date().toISOString(),
      });
      
      const message = tradeType === 'buy' 
        ? `${quantity} ${asset.symbol} başarıyla satın alındı!`
        : `${quantity} ${asset.symbol} başarıyla satıldı!`;
      
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('İşlem Başarılı', message);
      }
      
      setShowTradeModal(false);
      setQuantity('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'İşlem sırasında bir hata oluştu';
      
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Hata', errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
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
      
      {showTradeModal && (
        <View style={[styles.tradeModal, { backgroundColor: colors.background + 'E6' }]}>
          <View style={[styles.tradeModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.tradeModalTitle, { color: colors.text }]}>
              {tradeType === 'buy' ? 'Satın Al' : 'Sat'} - {asset.symbol}
            </Text>
            
            <View style={styles.tradeTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.tradeTypeButton,
                  { backgroundColor: tradeType === 'buy' ? colors.success : colors.card },
                  { borderColor: colors.success }
                ]}
                onPress={() => setTradeType('buy')}
              >
                <Plus size={16} color={tradeType === 'buy' ? '#fff' : colors.success} />
                <Text style={[
                  styles.tradeTypeText,
                  { color: tradeType === 'buy' ? '#fff' : colors.success }
                ]}>
                  Satın Al
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tradeTypeButton,
                  { backgroundColor: tradeType === 'sell' ? colors.error : colors.card },
                  { borderColor: colors.error }
                ]}
                onPress={() => setTradeType('sell')}
              >
                <Minus size={16} color={tradeType === 'sell' ? '#fff' : colors.error} />
                <Text style={[
                  styles.tradeTypeText,
                  { color: tradeType === 'sell' ? '#fff' : colors.error }
                ]}>
                  Sat
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tradeInfo}>
              <View style={styles.tradeInfoRow}>
                <Text style={[styles.tradeInfoLabel, { color: colors.textSecondary }]}>Mevcut Fiyat:</Text>
                <Text style={[styles.tradeInfoValue, { color: colors.text }]}>
                  {getCurrencySymbol()}{asset.currentPrice.toFixed(2)}
                </Text>
              </View>
              
              {tradeType === 'sell' && (
                <View style={styles.tradeInfoRow}>
                  <Text style={[styles.tradeInfoLabel, { color: colors.textSecondary }]}>Mevcut Miktar:</Text>
                  <Text style={[styles.tradeInfoValue, { color: colors.text }]}>
                    {asset.quantity.toFixed(4)}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.quantityInput}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Miktar</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, { backgroundColor: colors.background }]}
                  onPress={() => {
                    const current = parseFloat(quantity) || 0;
                    const newValue = Math.max(0, current - 0.1);
                    setQuantity(newValue.toFixed(4));
                  }}
                >
                  <Minus size={16} color={colors.text} />
                </TouchableOpacity>
                
                <TextInput
                  style={[styles.quantityTextInput, { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border
                  }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="0.0000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
                
                <TouchableOpacity
                  style={[styles.quantityButton, { backgroundColor: colors.background }]}
                  onPress={() => {
                    const current = parseFloat(quantity) || 0;
                    const newValue = current + 0.1;
                    setQuantity(newValue.toFixed(4));
                  }}
                >
                  <Plus size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              {tradeType === 'sell' && (
                <TouchableOpacity
                  style={styles.maxButton}
                  onPress={() => setQuantity(asset.quantity.toFixed(4))}
                >
                  <Text style={[styles.maxButtonText, { color: colors.primary }]}>Tümünü Sat</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {quantity && parseFloat(quantity) > 0 && (
              <View style={[styles.totalValue, { backgroundColor: colors.background }]}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Toplam Değer:</Text>
                <Text style={[styles.totalAmount, { color: colors.text }]}>
                  {getCurrencySymbol()}{(parseFloat(quantity) * asset.currentPrice).toFixed(2)}
                </Text>
              </View>
            )}
            
            <View style={styles.tradeModalButtons}>
              <TouchableOpacity
                style={[styles.tradeModalButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => {
                  setShowTradeModal(false);
                  setQuantity('');
                }}
                disabled={isProcessing}
              >
                <Text style={styles.tradeModalButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tradeModalButton,
                  { backgroundColor: tradeType === 'buy' ? colors.success : colors.error },
                  (!quantity || parseFloat(quantity) <= 0 || isProcessing) && { opacity: 0.5 }
                ]}
                onPress={handleTrade}
                disabled={!quantity || parseFloat(quantity) <= 0 || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.tradeModalButtonText}>
                    {tradeType === 'buy' ? 'Satın Al' : 'Sat'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          activeOpacity={0.8}
          onPress={() => {
            setTradeType('buy');
            setShowTradeModal(true);
          }}
        >
          <DollarSign size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Satın Al</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          activeOpacity={0.8}
          onPress={() => {
            setTradeType('sell');
            setShowTradeModal(true);
          }}
        >
          <Activity size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Sat</Text>
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
  tradeModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  tradeModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  tradeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  tradeTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tradeTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  tradeTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tradeInfo: {
    marginBottom: 20,
  },
  tradeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tradeInfoLabel: {
    fontSize: 14,
  },
  tradeInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  quantityInput: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityTextInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  maxButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  maxButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  tradeModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  tradeModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});