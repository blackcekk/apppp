import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Plus, Minus, Edit, Trash2, RotateCcw } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { ActionLogRepository } from '@/repositories/ActionLogRepository';
import { ActionLog } from '@/types/portfolio';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActionLogs = useCallback(async () => {
    try {
      const logs = await ActionLogRepository.getAll();
      setActionLogs(logs);
    } catch (error) {
      console.error('Error loading action logs:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadActionLogs();
  }, [loadActionLogs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadActionLogs();
  }, [loadActionLogs]);

  const getActionIcon = (type: ActionLog['type']) => {
    const iconProps = { size: 20, color: colors.textSecondary };
    
    switch (type) {
      case 'add_asset':
        return <Plus {...iconProps} color={colors.success} />;
      case 'remove_asset':
        return <Minus {...iconProps} color={colors.error} />;
      case 'add_transaction':
        return <Plus {...iconProps} color={colors.primary} />;
      case 'edit_transaction':
        return <Edit {...iconProps} color={colors.warning} />;
      case 'remove_transaction':
        return <Trash2 {...iconProps} color={colors.error} />;
      case 'add_dca_plan':
        return <RotateCcw {...iconProps} color={colors.success} />;
      case 'remove_dca_plan':
        return <Trash2 {...iconProps} color={colors.error} />;
      default:
        return <Clock {...iconProps} />;
    }
  };

  const getActionTitle = (type: ActionLog['type']) => {
    switch (type) {
      case 'add_asset':
        return 'Varlık Eklendi';
      case 'remove_asset':
        return 'Varlık Silindi';
      case 'add_transaction':
        return 'İşlem Eklendi';
      case 'edit_transaction':
        return 'İşlem Düzenlendi';
      case 'remove_transaction':
        return 'İşlem Silindi';
      case 'add_dca_plan':
        return 'DCA Planı Eklendi';
      case 'remove_dca_plan':
        return 'DCA Planı Silindi';
      default:
        return 'Bilinmeyen İşlem';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} dakika önce`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} saat önce`;
    } else if (diffInHours < 48) {
      return 'Dün';
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const renderActionLog = (log: ActionLog) => (
    <View
      key={log.id}
      style={[
        styles.logItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.logHeader}>
        <View style={styles.logIconContainer}>
          {getActionIcon(log.type)}
        </View>
        <View style={styles.logContent}>
          <Text style={[styles.logTitle, { color: colors.text }]}>
            {getActionTitle(log.type)}
          </Text>
          <Text style={[styles.logDescription, { color: colors.textSecondary }]}>
            {log.description}
          </Text>
        </View>
        <Text style={[styles.logTime, { color: colors.textSecondary }]}>
          {formatDate(log.timestamp)}
        </Text>
      </View>
      
      {log.data && (
        <View style={[styles.logData, { backgroundColor: colors.background }]}>
          <Text style={[styles.logDataText, { color: colors.textSecondary }]}>
            {JSON.stringify(log.data, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Clock color={colors.textSecondary} size={48} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Geçmiş yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!actionLogs.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Clock color={colors.textSecondary} size={48} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Henüz İşlem Geçmişi Yok
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Varlık ekleyip çıkardığınızda, işlem yaptığınızda geçmiş burada görünecek
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>İşlem Geçmişi</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Son {actionLogs.length} işlem
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {actionLogs.map(renderActionLog)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
  },
  logItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  logIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  logDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  logTime: {
    fontSize: 12,
    marginTop: 2,
  },
  logData: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  logDataText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});