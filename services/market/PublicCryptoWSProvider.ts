import { Platform } from 'react-native';
import { IMarketService, MarketQuote, OHLCData, MarketSearchResult, MarketConnectionStatus } from './IMarketService';

export class PublicCryptoWSProvider implements IMarketService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private subscriptions = new Map<string, (quote: MarketQuote) => void>();
  private lastError?: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private wsUrl: string = 'wss://stream.binance.com:9443/ws/!ticker@arr') {}

  async searchSymbols(query: string): Promise<MarketSearchResult[]> {
    if (!query?.trim() || query.length > 50) return [];
    
    const cryptoSymbols = [
      { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'crypto' as const },
      { symbol: 'ETHUSDT', name: 'Ethereum', category: 'crypto' as const },
      { symbol: 'BNBUSDT', name: 'BNB', category: 'crypto' as const },
      { symbol: 'ADAUSDT', name: 'Cardano', category: 'crypto' as const },
      { symbol: 'SOLUSDT', name: 'Solana', category: 'crypto' as const },
      { symbol: 'XRPUSDT', name: 'XRP', category: 'crypto' as const },
      { symbol: 'DOTUSDT', name: 'Polkadot', category: 'crypto' as const },
      { symbol: 'DOGEUSDT', name: 'Dogecoin', category: 'crypto' as const },
    ];

    const searchTerm = query.toLowerCase().trim();
    return cryptoSymbols.filter(item => 
      item.symbol.toLowerCase().includes(searchTerm) ||
      item.name.toLowerCase().includes(searchTerm)
    );
  }

  async getQuote(symbol: string): Promise<MarketQuote | null> {
    if (!symbol?.trim() || symbol.length > 20) return null;
    
    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        setTimeout(() => resolve(null), 100);
        return;
      }

      const timeout = setTimeout(() => resolve(null), 5000);
      
      const handler = (quote: MarketQuote) => {
        if (quote.symbol === symbol.trim().toUpperCase()) {
          clearTimeout(timeout);
          resolve(quote);
        }
      };

      this.subscriptions.set('temp_' + Date.now(), handler);
      this.connect();
    });
  }

  async getOHLC(symbol: string, period: '1D' | '1W' | '1M' | '3M' | '1Y'): Promise<OHLCData[]> {
    if (!symbol?.trim() || symbol.length > 20) return [];
    
    const mockData: OHLCData[] = [];
    const basePrice = 50000;
    const periods = {
      '1D': 24,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '1Y': 365,
    };

    for (let i = 0; i < periods[period]; i++) {
      const timestamp = Date.now() - (i * 24 * 60 * 60 * 1000);
      const volatility = (Math.random() - 0.5) * 0.1;
      const open = basePrice * (1 + volatility);
      const close = open * (1 + (Math.random() - 0.5) * 0.05);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);

      mockData.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000000),
      });
    }

    return mockData.reverse();
  }

  streamQuotes(symbols: string[], onTick: (quote: MarketQuote) => void): () => void {
    const validSymbols = symbols.filter(s => s?.trim() && s.length <= 20);
    if (validSymbols.length === 0) return () => {};

    validSymbols.forEach(symbol => {
      this.subscriptions.set(symbol, onTick);
    });

    if (Platform.OS !== 'web') {
      this.connect();
    }

    return () => {
      validSymbols.forEach(symbol => {
        this.subscriptions.delete(symbol);
      });
      if (this.subscriptions.size === 0) {
        this.disconnect();
      }
    };
  }

  getConnectionStatus(): MarketConnectionStatus {
    return {
      isConnected: this.isConnected,
      provider: 'crypto_ws',
      lastUpdate: Date.now(),
      error: this.lastError,
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.subscriptions.clear();
  }

  private connect(): void {
    if (Platform.OS === 'web' || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.lastError = undefined;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            data.forEach(ticker => this.processTicker(ticker));
          } else {
            this.processTicker(data);
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.ws = null;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.lastError = 'Connection error';
        this.isConnected = false;
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private processTicker(ticker: any): void {
    if (!ticker.s || !ticker.c) return;

    const quote: MarketQuote = {
      symbol: ticker.s,
      name: ticker.s.replace('USDT', ''),
      price: parseFloat(ticker.c),
      change: parseFloat(ticker.P || '0'),
      changePercent: parseFloat(ticker.P || '0'),
      category: 'crypto',
      timestamp: Date.now(),
    };

    this.subscriptions.forEach((callback, symbol) => {
      if (symbol === quote.symbol || symbol.includes('temp_')) {
        callback(quote);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      if (this.subscriptions.size > 0) {
        console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
        this.connect();
      }
    }, delay);
  }
}