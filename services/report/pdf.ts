import { Platform } from 'react-native';
import { Portfolio } from '@/types/portfolio';

// Conditional imports for platform compatibility
let Print: any = null;
let Sharing: any = null;

if (Platform.OS !== 'web') {
  Print = require('expo-print');
  Sharing = require('expo-sharing');
}

export interface ReportData {
  portfolio: Portfolio;
  currency: string;
  currencySymbol: string;
  generatedAt: string;
}

export class PDFReportService {
  static async generatePortfolioReport(data: ReportData): Promise<string | null> {
    try {
      const html = this.generateHTML(data);
      
      if (Platform.OS === 'web') {
        // For web, create a blob and download
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return 'Web download initiated';
      }
      
      if (!Print) {
        console.error('expo-print not available');
        return null;
      }
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      
      return uri;
    } catch (error) {
      console.error('Error generating PDF report:', error);
      return null;
    }
  }

  static async shareReport(data: ReportData): Promise<boolean> {
    try {
      const uri = await this.generatePortfolioReport(data);
      
      if (!uri) {
        return false;
      }
      
      if (Platform.OS === 'web') {
        return true; // Already handled in generatePortfolioReport
      }
      
      if (!Sharing) {
        console.error('expo-sharing not available');
        return false;
      }
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Portföy Raporu Paylaş',
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error sharing report:', error);
      return false;
    }
  }

  private static generateHTML(data: ReportData): string {
    const { portfolio, currency, currencySymbol, generatedAt } = data;
    
    const assetRows = portfolio.assets.map(asset => `
      <tr>
        <td>${asset.symbol}</td>
        <td>${asset.name}</td>
        <td>${asset.quantity.toFixed(4)}</td>
        <td>${currencySymbol}${asset.avgPrice.toFixed(2)}</td>
        <td>${currencySymbol}${asset.currentPrice.toFixed(2)}</td>
        <td>${currencySymbol}${asset.value.toFixed(2)}</td>
        <td style="color: ${asset.profit >= 0 ? '#10B981' : '#EF4444'}">
          ${currencySymbol}${asset.profit.toFixed(2)} (${asset.profitPercentage.toFixed(2)}%)
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Portföy Raporu</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            color: #1f2937;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 24px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #111827;
            margin: 0 0 8px 0;
          }
          .subtitle {
            font-size: 16px;
            color: #6b7280;
            margin: 0;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
          }
          .summary-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .summary-label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
          }
          .profit {
            color: #10B981;
          }
          .loss {
            color: #EF4444;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">Portföy Raporu</h1>
            <p class="subtitle">Oluşturulma Tarihi: ${new Date(generatedAt).toLocaleDateString('tr-TR')}</p>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <div class="summary-label">Toplam Değer</div>
              <div class="summary-value">${currencySymbol}${portfolio.totalValue.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Toplam Kar/Zarar</div>
              <div class="summary-value ${portfolio.totalProfit >= 0 ? 'profit' : 'loss'}">
                ${currencySymbol}${portfolio.totalProfit.toFixed(2)}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Getiri Oranı</div>
              <div class="summary-value ${portfolio.totalProfitPercentage >= 0 ? 'profit' : 'loss'}">
                ${portfolio.totalProfitPercentage.toFixed(2)}%
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Varlık Sayısı</div>
              <div class="summary-value">${portfolio.assets.length}</div>
            </div>
          </div>
          
          <h2>Varlık Detayları</h2>
          <table>
            <thead>
              <tr>
                <th>Sembol</th>
                <th>İsim</th>
                <th>Miktar</th>
                <th>Ort. Fiyat</th>
                <th>Güncel Fiyat</th>
                <th>Toplam Değer</th>
                <th>Kar/Zarar</th>
              </tr>
            </thead>
            <tbody>
              ${assetRows}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Bu rapor otomatik olarak oluşturulmuştur. Para birimi: ${currency}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}