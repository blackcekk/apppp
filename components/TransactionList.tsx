import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '@/types/portfolio';
import { useTheme } from '@/providers/ThemeProvider';
import { useCurrency } from '@/providers/CurrencyProvider';

import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react-native';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
}

export function TransactionList({ transactions, onTransactionPress }: TransactionListProps) {
  const { colors } = useTheme();
  const { getCurrencySymbol } = useCurrency();

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isBuy = item.side === 'buy';
    const Icon = isBuy ? ArrowDownCircle : ArrowUpCircle;
    const color = isBuy ? colors.success : colors.error;
    
    return (
      <TouchableOpacity
        style={[styles.transactionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => onTransactionPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Icon size={24} color={color} />
        </View>
        
        <View style={styles.transactionInfo}>
          <View style={styles.transactionHeader}>
            <Text style={[styles.symbol, { color: colors.text }]}>{item.symbol}</Text>
            <Text style={[styles.amount, { color }]}>
              {isBuy ? '+' : '-'}{item.quantity}
            </Text>
          </View>
          
          <View style={styles.transactionDetails}>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
            <Text style={[styles.price, { color: colors.textSecondary }]}>
              @ {getCurrencySymbol()}{item.price.toFixed(2)}
            </Text>
          </View>
          
          {item.fee && item.fee > 0 && (
            <Text style={[styles.fee, { color: colors.textSecondary }]}>
              Fee: {getCurrencySymbol()}{item.fee.toFixed(2)}
            </Text>
          )}
          
          {item.note && (
            <Text style={[styles.notes, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.note}
            </Text>
          )}
        </View>
        
        <View style={styles.totalContainer}>
          <Text style={[styles.total, { color: colors.text }]}>
            {getCurrencySymbol()}{(item.quantity * item.price + item.fee).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No transactions yet
        </Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={transactions}
      renderItem={renderTransaction}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '600',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  date: {
    fontSize: 12,
  },
  price: {
    fontSize: 12,
  },
  fee: {
    fontSize: 11,
    marginTop: 2,
  },
  notes: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  totalContainer: {
    marginLeft: 12,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
});