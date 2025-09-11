import { IMarketService, MarketQuote, OHLCData, MarketSearchResult, MarketConnectionStatus } from './IMarketService';

export class RestMarketProvider implements IMarketService {
  private baseUrl: string;
  private apiKey?: string;
  private isConnected = false;
  private lastError?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async searchSymbols(query: string): Promise<MarketSearchResult[]> {
    if (!query?.trim() || query.length > 50) return [];
    
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query.trim())}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      this.isConnected = true;
      this.lastError = undefined;
      
      return data.results || [];
    } catch (error) {
      console.error('Search symbols error:', error);
      this.isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return [];
    }
  }

  async getQuote(symbol: string): Promise<MarketQuote | null> {
    if (!symbol?.trim() || symbol.length > 20) return null;
    
    try {
      const response = await fetch(`${this.baseUrl}/quote/${encodeURIComponent(symbol.trim())}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      this.isConnected = true;
      this.lastError = undefined;
      
      return {
        symbol: data.symbol,
        name: data.name,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        category: data.category || 'stocks',
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Get quote error:', error);
      this.isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return null;
    }
  }

  async getOHLC(symbol: string, period: '1D' | '1W' | '1M' | '3M' | '1Y'): Promise<OHLCData[]> {
    if (!symbol?.trim() || symbol.length > 20) return [];
    
    try {
      const response = await fetch(
        `${this.baseUrl}/ohlc/${encodeURIComponent(symbol.trim())}?period=${period}`,
        { headers: this.getHeaders() }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      this.isConnected = true;
      this.lastError = undefined;
      
      return data.ohlc || [];
    } catch (error) {
      console.error('Get OHLC error:', error);
      this.isConnected = false;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return [];
    }
  }

  streamQuotes(symbols: string[], onTick: (quote: MarketQuote) => void): () => void {
    const validSymbols = symbols.filter(s => s?.trim() && s.length <= 20);
    if (validSymbols.length === 0) return () => {};

    const interval = setInterval(async () => {
      for (const symbol of validSymbols) {
        const quote = await this.getQuote(symbol);
        if (quote) {
          onTick(quote);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }

  getConnectionStatus(): MarketConnectionStatus {
    return {
      isConnected: this.isConnected,
      provider: 'rest',
      lastUpdate: Date.now(),
      error: this.lastError,
    };
  }

  disconnect(): void {
    this.isConnected = false;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }
}