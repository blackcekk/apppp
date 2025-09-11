import { IMarketService, MarketQuote, OHLCData, MarketSearchResult, MarketConnectionStatus } from './IMarketService';

export class MockMarketProvider implements IMarketService {
  private isConnected = true;
  private subscriptions = new Map<string, (quote: MarketQuote) => void>();
  private intervals = new Map<string, ReturnType<typeof setInterval>>();

  private mockData: MarketQuote[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 43250.50,
      change: 1250.30,
      changePercent: 2.98,
      category: 'crypto',
      timestamp: Date.now(),
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2280.75,
      change: -45.20,
      changePercent: -1.94,
      category: 'crypto',
      timestamp: Date.now(),
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 182.52,
      change: 3.45,
      changePercent: 1.93,
      category: 'stocks',
      timestamp: Date.now(),
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 139.68,
      change: -2.15,
      changePercent: -1.52,
      category: 'stocks',
      timestamp: Date.now(),
    },
    {
      symbol: 'EUR/USD',
      name: 'Euro/US Dollar',
      price: 1.0892,
      change: 0.0023,
      changePercent: 0.21,
      category: 'forex',
      timestamp: Date.now(),
    },
    {
      symbol: 'GOLD',
      name: 'Gold',
      price: 2042.30,
      change: 12.50,
      changePercent: 0.62,
      category: 'commodities',
      timestamp: Date.now(),
    },
  ];

  async searchSymbols(query: string): Promise<MarketSearchResult[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (!query || query.length < 1) {
      return [];
    }

    const searchTerm = query.toLowerCase();
    return this.mockData
      .filter(item => 
        item.symbol.toLowerCase().includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm)
      )
      .map(item => ({
        symbol: item.symbol,
        name: item.name,
        category: item.category,
      }))
      .slice(0, 10);
  }

  async getQuote(symbol: string): Promise<MarketQuote | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const quote = this.mockData.find(item => 
      item.symbol.toUpperCase() === symbol.toUpperCase()
    );
    
    if (!quote) return null;

    // Add some price volatility
    const volatility = (Math.random() - 0.5) * 0.02; // ±1%
    const newPrice = quote.price * (1 + volatility);
    const change = newPrice - quote.price;
    const changePercent = (change / quote.price) * 100;

    return {
      ...quote,
      price: newPrice,
      change,
      changePercent,
      timestamp: Date.now(),
    };
  }

  async getOHLC(symbol: string, period: '1D' | '1W' | '1M' | '3M' | '1Y'): Promise<OHLCData[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quote = await this.getQuote(symbol);
    if (!quote) return [];

    const periods = {
      '1D': { points: 24, interval: 60 * 60 * 1000 }, // hourly
      '1W': { points: 7, interval: 24 * 60 * 60 * 1000 }, // daily
      '1M': { points: 30, interval: 24 * 60 * 60 * 1000 }, // daily
      '3M': { points: 90, interval: 24 * 60 * 60 * 1000 }, // daily
      '1Y': { points: 52, interval: 7 * 24 * 60 * 60 * 1000 }, // weekly
    };

    const { points, interval } = periods[period];
    const data: OHLCData[] = [];
    const basePrice = quote.price;

    for (let i = points - 1; i >= 0; i--) {
      const timestamp = Date.now() - (i * interval);
      const volatility = (Math.random() - 0.5) * 0.1; // ±5%
      const open = basePrice * (1 + volatility);
      const close = open * (1 + (Math.random() - 0.5) * 0.05);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);

      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000000),
      });
    }

    return data;
  }

  streamQuotes(symbols: string[], onTick: (quote: MarketQuote) => void): () => void {
    symbols.forEach(symbol => {
      const interval = setInterval(async () => {
        const quote = await this.getQuote(symbol);
        if (quote) {
          onTick(quote);
        }
      }, 2000 + Math.random() * 3000); // 2-5 seconds

      this.intervals.set(symbol, interval);
      this.subscriptions.set(symbol, onTick);
    });

    return () => {
      symbols.forEach(symbol => {
        const interval = this.intervals.get(symbol);
        if (interval) {
          clearInterval(interval);
          this.intervals.delete(symbol);
        }
        this.subscriptions.delete(symbol);
      });
    };
  }

  getConnectionStatus(): MarketConnectionStatus {
    return {
      isConnected: this.isConnected,
      provider: 'mock',
      lastUpdate: Date.now(),
    };
  }

  disconnect(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.subscriptions.clear();
    this.isConnected = false;
  }
}