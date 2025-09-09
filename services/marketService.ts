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
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 378.85,
    change: 5.23,
    changePercent: 1.40,
    category: "stocks",
  },
  {
    id: "6",
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 248.42,
    change: -8.15,
    changePercent: -3.18,
    category: "stocks",
  },
  {
    id: "7",
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 875.28,
    change: 12.45,
    changePercent: 1.44,
    category: "stocks",
  },
  {
    id: "8",
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 153.75,
    change: -2.30,
    changePercent: -1.47,
    category: "stocks",
  },
  {
    id: "9",
    symbol: "META",
    name: "Meta Platforms Inc.",
    price: 485.22,
    change: 8.90,
    changePercent: 1.87,
    category: "stocks",
  },
  {
    id: "10",
    symbol: "NFLX",
    name: "Netflix Inc.",
    price: 598.45,
    change: -5.67,
    changePercent: -0.94,
    category: "stocks",
  },
  {
    id: "11",
    symbol: "EUR/USD",
    name: "Euro/US Dollar",
    price: 1.0892,
    change: 0.0023,
    changePercent: 0.21,
    category: "forex",
  },
  {
    id: "12",
    symbol: "GBP/USD",
    name: "British Pound/US Dollar",
    price: 1.2654,
    change: -0.0045,
    changePercent: -0.35,
    category: "forex",
  },
  {
    id: "13",
    symbol: "USD/JPY",
    name: "US Dollar/Japanese Yen",
    price: 149.85,
    change: 0.75,
    changePercent: 0.50,
    category: "forex",
  },
  {
    id: "14",
    symbol: "GOLD",
    name: "Gold",
    price: 2042.30,
    change: 12.50,
    changePercent: 0.62,
    category: "commodities",
  },
  {
    id: "15",
    symbol: "SILVER",
    name: "Silver",
    price: 24.85,
    change: -0.35,
    changePercent: -1.39,
    category: "commodities",
  },
  {
    id: "16",
    symbol: "OIL",
    name: "Crude Oil",
    price: 78.45,
    change: 1.25,
    changePercent: 1.62,
    category: "commodities",
  },
];

export async function fetchMarketData(category: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (category === "all") {
    return mockData;
  }

  return mockData.filter(item => item.category === category);
}

export async function searchSymbols(query: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (!query || query.length < 1) {
    return [];
  }

  const searchTerm = query.toLowerCase();
  return mockData.filter(item => 
    item.symbol.toLowerCase().includes(searchTerm) ||
    item.name.toLowerCase().includes(searchTerm)
  ).slice(0, 10); // Limit to 10 results
}

export async function getSymbolPrice(symbol: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const asset = mockData.find(item => item.symbol.toUpperCase() === symbol.toUpperCase());
  return asset ? asset.price : null;
}