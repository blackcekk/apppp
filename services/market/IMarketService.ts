export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  category: 'crypto' | 'stocks' | 'forex' | 'commodities';
  timestamp: number;
}

export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface MarketSearchResult {
  symbol: string;
  name: string;
  category: 'crypto' | 'stocks' | 'forex' | 'commodities';
  exchange?: string;
}

export interface MarketConnectionStatus {
  isConnected: boolean;
  provider: string;
  lastUpdate?: number;
  error?: string;
}

export interface IMarketService {
  searchSymbols(query: string): Promise<MarketSearchResult[]>;
  getQuote(symbol: string): Promise<MarketQuote | null>;
  getOHLC(symbol: string, period: '1D' | '1W' | '1M' | '3M' | '1Y'): Promise<OHLCData[]>;
  streamQuotes(symbols: string[], onTick: (quote: MarketQuote) => void): () => void;
  getConnectionStatus(): MarketConnectionStatus;
  disconnect(): void;
}