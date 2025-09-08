export async function fetchMarketData(category: string) {
  // Mock data for demonstration
  const mockData = [
    {
      id: "1",
      symbol: "BTC",
      name: "Bitcoin",
      price: 43250.50,
      change: 1250.30,
      changePercent: 2.98,
      category: "crypto",
    },
    {
      id: "2",
      symbol: "ETH",
      name: "Ethereum",
      price: 2280.75,
      change: -45.20,
      changePercent: -1.94,
      category: "crypto",
    },
    {
      id: "3",
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 182.52,
      change: 3.45,
      changePercent: 1.93,
      category: "stocks",
    },
    {
      id: "4",
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      price: 139.68,
      change: -2.15,
      changePercent: -1.52,
      category: "stocks",
    },
    {
      id: "5",
      symbol: "EUR/USD",
      name: "Euro/US Dollar",
      price: 1.0892,
      change: 0.0023,
      changePercent: 0.21,
      category: "forex",
    },
    {
      id: "6",
      symbol: "GOLD",
      name: "Gold",
      price: 2042.30,
      change: 12.50,
      changePercent: 0.62,
      category: "commodities",
    },
  ];

  if (category === "all") {
    return mockData;
  }

  return mockData.filter(item => item.category === category);
}