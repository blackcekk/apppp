export interface Asset {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  profit: number;
  profitPercentage: number;
  type?: 'crypto' | 'stock' | 'commodity' | 'forex';
  currency?: string;
}

export interface Transaction {
  id: string;
  assetId?: string;
  type: "buy" | "sell";
  symbol: string;
  quantity: number;
  price: number;
  fee?: number;
  date: string;
  notes?: string;
}

export interface Portfolio {
  assets: Asset[];
  totalValue: number;
  totalProfit: number;
  totalProfitPercentage: number;
}

export interface ChartData {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface PriceHistory {
  symbol: string;
  data: ChartData[];
  period: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
}