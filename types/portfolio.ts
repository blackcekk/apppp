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
  targetWeight?: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  side: 'buy' | 'sell' | 'dividend' | 'fee';
  quantity: number;
  price: number;
  fee: number;
  note: string;
  attachments: string[];
  date: string;
}

export interface DCAPlan {
  id: string;
  symbol: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  amountType: 'cash' | 'units';
  amount: number;
  nextRunAt: string;
  isActive: boolean;
}

export interface ActionLog {
  id: string;
  type: 'add_asset' | 'remove_asset' | 'add_transaction' | 'edit_transaction' | 'remove_transaction' | 'add_dca_plan' | 'remove_dca_plan';
  description: string;
  data: any;
  timestamp: string;
  canUndo: boolean;
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