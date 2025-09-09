export type NotificationType = "app" | "alarm" | "both";

export interface Alert {
  id: string;
  symbol: string;
  targetPrice: number;
  type: "above" | "below";
  enabled: boolean;
  note?: string;
  notificationType: NotificationType;
}