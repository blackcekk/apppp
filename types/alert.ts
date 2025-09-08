export interface Alert {
  id: string;
  symbol: string;
  targetPrice: number;
  type: "above" | "below";
  enabled: boolean;
  note?: string;
}