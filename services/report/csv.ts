import { Platform } from 'react-native';
import { Portfolio, Transaction } from '@/types/portfolio';

// Conditional imports for platform compatibility
let Sharing: any = null;
let FileSystem: any = null;

if (Platform.OS !== 'web') {
  try {
    Sharing = require('expo-sharing');
    FileSystem = require('expo-file-system');
  } catch (error) {
    console.warn('expo-sharing or expo-file-system not available');
  }
}

export interface CSVExportData {
  portfolio: Portfolio;
  transactions: Transaction[];
  currency: string;
}

export class CSVReportService {
  static async exportPortfolioCSV(data: CSVExportData): Promise<string | null> {
    try {
      const csvContent = this.generatePortfolioCSV(data);
      
      if (Platform.OS === 'web') {
        // For web, create a blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return 'Web download initiated';
      }
      
      if (!FileSystem) {
        console.error('expo-file-system not available');
        return null;
      }
      
      const fileName = `portfolio-${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      return fileUri;
    } catch (error) {
      console.error('Error generating CSV:', error);
      return null;
    }
  }

  static async exportTransactionsCSV(data: CSVExportData): Promise<string | null> {
    try {
      const csvContent = this.generateTransactionsCSV(data);
      
      if (Platform.OS === 'web') {
        // For web, create a blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return 'Web download initiated';
      }
      
      if (!FileSystem) {
        console.error('expo-file-system not available');
        return null;
      }
      
      const fileName = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      return fileUri;
    } catch (error) {
      console.error('Error generating transactions CSV:', error);
      return null;
    }
  }

  static async shareCSV(filePath: string, title: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return true; // Already handled in export methods
      }
      
      if (!Sharing) {
        console.error('expo-sharing not available');
        return false;
      }
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: title,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error sharing CSV:', error);
      return false;
    }
  }

  private static generatePortfolioCSV(data: CSVExportData): string {
    const { portfolio, currency } = data;
    
    const headers = [
      'Sembol',
      'İsim',
      'Miktar',
      'Ortalama Fiyat',
      'Güncel Fiyat',
      'Toplam Değer',
      'Kar/Zarar',
      'Kar/Zarar %',
      'Hedef Ağırlık %',
      'Para Birimi'
    ];
    
    const rows = portfolio.assets.map(asset => [
      asset.symbol,
      asset.name,
      asset.quantity.toString(),
      asset.avgPrice.toFixed(2),
      asset.currentPrice.toFixed(2),
      asset.value.toFixed(2),
      asset.profit.toFixed(2),
      asset.profitPercentage.toFixed(2),
      (asset.targetWeight || 0).toString(),
      currency
    ]);
    
    // Add summary row
    rows.push([
      'TOPLAM',
      '',
      '',
      '',
      '',
      portfolio.totalValue.toFixed(2),
      portfolio.totalProfit.toFixed(2),
      portfolio.totalProfitPercentage.toFixed(2),
      '',
      currency
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `\"${field}\"`).join(','))
      .join('\\n');
    
    return csvContent;
  }

  private static generateTransactionsCSV(data: CSVExportData): string {
    const { transactions, currency } = data;
    
    const headers = [
      'Tarih',
      'Sembol',
      'İşlem Türü',
      'Miktar',
      'Fiyat',
      'Komisyon',
      'Toplam Tutar',
      'Not',
      'Para Birimi'
    ];
    
    const rows = transactions.map(transaction => {
      const totalAmount = (transaction.quantity * transaction.price) + transaction.fee;
      
      return [
        new Date(transaction.date).toLocaleDateString('tr-TR'),
        transaction.symbol,
        transaction.side.toUpperCase(),
        transaction.quantity.toString(),
        transaction.price.toFixed(2),
        transaction.fee.toFixed(2),
        totalAmount.toFixed(2),
        transaction.note || '',
        currency
      ];
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `\"${field}\"`).join(','))
      .join('\\n');
    
    return csvContent;
  }
}