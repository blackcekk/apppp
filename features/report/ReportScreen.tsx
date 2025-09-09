import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Download, Share, PieChart, BarChart3, Calendar, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { PDFReportService, ReportData } from '@/services/report/pdf';
import { CSVReportService, CSVExportData } from '@/services/report/csv';
import { TransactionRepository } from '@/repositories/TransactionRepository';

export default function ReportScreen() {
  const { colors } = useTheme();
  const { portfolio, totalValue, totalProfit, profitPercentage } = usePortfolio();
  const { currentCurrency, getCurrencySymbol } = useCurrency();
  const [isGenerating, setIsGenerating] = useState(false);

  const reportData: ReportData = useMemo(() => ({
    portfolio: {
      assets: portfolio,
      totalValue,
      totalProfit,
      totalProfitPercentage: profitPercentage,
    },
    currency: currentCurrency,
    currencySymbol: getCurrencySymbol(),
    generatedAt: new Date().toISOString(),
  }), [portfolio, totalValue, totalProfit, profitPercentage, currentCurrency, getCurrencySymbol]);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const result = await PDFReportService.generatePortfolioReport(reportData);
      if (result) {
        Alert.alert(
          'Başarılı',
          'PDF raporu oluşturuldu ve indirildi.',
          [{ text: 'Tamam' }]
        );
      } else {
        Alert.alert(
          'Hata',
          'PDF raporu oluşturulurken bir hata oluştu.',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert(
        'Hata',
        'PDF raporu oluşturulurken bir hata oluştu.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSharePDF = async () => {
    setIsGenerating(true);
    try {
      const success = await PDFReportService.shareReport(reportData);
      if (!success) {
        Alert.alert(
          'Hata',
          'Rapor paylaşılırken bir hata oluştu.',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert(
        'Hata',
        'Rapor paylaşılırken bir hata oluştu.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPortfolioCSV = async () => {
    setIsGenerating(true);
    try {
      const transactions = await TransactionRepository.getAll();
      const csvData: CSVExportData = {
        portfolio: {
          assets: portfolio,
          totalValue,
          totalProfit,
          totalProfitPercentage: profitPercentage,
        },
        transactions,
        currency: currentCurrency,
      };
      
      const result = await CSVReportService.exportPortfolioCSV(csvData);
      if (result) {
        if (result === 'Web download initiated') {
          Alert.alert(
            'Başarılı',
            'Portföy CSV dosyası indirildi.',
            [{ text: 'Tamam' }]
          );
        } else {
          await CSVReportService.shareCSV(result, 'Portföy CSV Paylaş');
        }
      } else {
        Alert.alert(
          'Hata',
          'CSV dosyası oluşturulurken bir hata oluştu.',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Error exporting portfolio CSV:', error);
      Alert.alert(
        'Hata',
        'CSV dosyası oluşturulurken bir hata oluştu.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportTransactionsCSV = async () => {
    setIsGenerating(true);
    try {
      const transactions = await TransactionRepository.getAll();
      const csvData: CSVExportData = {
        portfolio: {
          assets: portfolio,
          totalValue,
          totalProfit,
          totalProfitPercentage: profitPercentage,
        },
        transactions,
        currency: currentCurrency,
      };
      
      const result = await CSVReportService.exportTransactionsCSV(csvData);
      if (result) {
        if (result === 'Web download initiated') {
          Alert.alert(
            'Başarılı',
            'İşlemler CSV dosyası indirildi.',
            [{ text: 'Tamam' }]
          );
        } else {
          await CSVReportService.shareCSV(result, 'İşlemler CSV Paylaş');
        }
      } else {
        Alert.alert(
          'Hata',
          'CSV dosyası oluşturulurken bir hata oluştu.',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Error exporting transactions CSV:', error);
      Alert.alert(
        'Hata',
        'CSV dosyası oluşturulurken bir hata oluştu.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSummaryCard = (title: string, value: string, icon: React.ReactNode, color?: string) => (
    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.summaryIcon, { backgroundColor: color || colors.primary + '20' }]}>
        {icon}
      </View>
      <View style={styles.summaryContent}>
        <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );

  const renderActionButton = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    onPress: () => void,
    disabled: boolean = false
  ) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled || isGenerating}
      activeOpacity={0.7}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
        {icon}
      </View>
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!portfolio.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <FileText color={colors.textSecondary} size={48} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Portföyünüz Boş
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Rapor oluşturmak için önce varlık ekleyin
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Raporlar</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Portföy analizi ve dışa aktarma
          </Text>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Portföy Özeti</Text>
          <View style={styles.summaryGrid}>
            {renderSummaryCard(
              'Toplam Değer',
              `${getCurrencySymbol()}${totalValue.toFixed(2)}`,
              <PieChart color={colors.primary} size={24} />
            )}
            {renderSummaryCard(
              'Toplam Kar/Zarar',
              `${getCurrencySymbol()}${totalProfit.toFixed(2)}`,
              <TrendingUp color={totalProfit >= 0 ? colors.success : colors.error} size={24} />,
              totalProfit >= 0 ? colors.success + '20' : colors.error + '20'
            )}
            {renderSummaryCard(
              'Getiri Oranı',
              `${profitPercentage.toFixed(2)}%`,
              <BarChart3 color={profitPercentage >= 0 ? colors.success : colors.error} size={24} />,
              profitPercentage >= 0 ? colors.success + '20' : colors.error + '20'
            )}
            {renderSummaryCard(
              'Varlık Sayısı',
              portfolio.length.toString(),
              <Calendar color={colors.primary} size={24} />
            )}
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Dışa Aktarma</Text>
          
          {renderActionButton(
            'PDF Raporu İndir',
            'Detaylı portföy raporu oluştur',
            <Download color={colors.primary} size={24} />,
            handleGeneratePDF
          )}
          
          {renderActionButton(
            'PDF Raporu Paylaş',
            'Raporu diğer uygulamalarla paylaş',
            <Share color={colors.primary} size={24} />,
            handleSharePDF
          )}
          
          {renderActionButton(
            'Portföy CSV İndir',
            'Varlık listesini CSV formatında indir',
            <FileText color={colors.success} size={24} />,
            handleExportPortfolioCSV
          )}
          
          {renderActionButton(
            'İşlemler CSV İndir',
            'Tüm işlem geçmişini CSV formatında indir',
            <FileText color={colors.warning} size={24} />,
            handleExportTransactionsCSV
          )}
        </View>

        <View style={styles.disclaimer}>
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            * Raporlar mevcut portföy durumunu yansıtır. Gerçek zamanlı fiyat değişiklikleri raporda görünmeyebilir.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
  summaryContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryGrid: {
    gap: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 72,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
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
  disclaimer: {
    padding: 16,
    paddingTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
});