import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Asset, Transaction } from "@/types/portfolio";
import { useQuery, useMutation } from "@tanstack/react-query";
import { safeAsyncStorageGet, safeAsyncStorageSet } from "@/utils/storage";

export const [PortfolioProvider, usePortfolio] = createContextHook(() => {
  const [portfolio, setPortfolio] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hideBalances, setHideBalances] = useState(false);

  const { data: savedData, refetch: refreshPortfolio, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      try {
        const [portfolio, transactions, hideBalancesData] = await Promise.all([
          safeAsyncStorageGet<Asset[]>("portfolio", []),
          safeAsyncStorageGet<Transaction[]>("transactions", []),
          AsyncStorage.getItem("hideBalances"),
        ]);
        
        return {
          portfolio,
          transactions,
          hideBalances: hideBalancesData === "true",
        };
      } catch (error) {
        console.error("Error loading portfolio data:", error);
        return {
          portfolio: [],
          transactions: [],
          hideBalances: false,
        };
      }
    },
  });

  useEffect(() => {
    if (savedData) {
      setPortfolio(savedData.portfolio);
      setTransactions(savedData.transactions);
      setHideBalances(savedData.hideBalances);
    }
  }, [savedData]);

  const saveMutation = useMutation({
    mutationFn: async (data: { portfolio?: Asset[]; transactions?: Transaction[] }) => {
      if (data.portfolio) {
        await safeAsyncStorageSet("portfolio", data.portfolio);
      }
      if (data.transactions) {
        await safeAsyncStorageSet("transactions", data.transactions);
      }
    },
  });

  const { mutate: saveMutate } = saveMutation;

  const addTransaction = useCallback((transaction: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    
    // Update portfolio based on transaction
    const existingAsset = portfolio.find(a => a.symbol === transaction.symbol);
    let updatedPortfolio: Asset[];
    
    if (existingAsset) {
      updatedPortfolio = portfolio.map(asset => {
        if (asset.symbol === transaction.symbol) {
          const newQuantity = transaction.type === "buy" 
            ? asset.quantity + transaction.quantity
            : asset.quantity - transaction.quantity;
          
          const newAvgPrice = transaction.type === "buy"
            ? (asset.avgPrice * asset.quantity + transaction.price * transaction.quantity) / newQuantity
            : asset.avgPrice;
          
          return {
            ...asset,
            quantity: newQuantity,
            avgPrice: newAvgPrice,
            currentPrice: asset.currentPrice || transaction.price,
          };
        }
        return asset;
      });
    } else if (transaction.type === "buy") {
      const newAsset: Asset = {
        id: Date.now().toString(),
        symbol: transaction.symbol,
        name: transaction.symbol,
        quantity: transaction.quantity,
        avgPrice: transaction.price,
        currentPrice: transaction.price,
        value: transaction.quantity * transaction.price,
        profit: 0,
        profitPercentage: 0,
      };
      updatedPortfolio = [...portfolio, newAsset];
    } else {
      updatedPortfolio = portfolio;
    }
    
    setPortfolio(updatedPortfolio);
    saveMutate({ portfolio: updatedPortfolio, transactions: updatedTransactions });
  }, [portfolio, transactions, saveMutate]);

  const toggleHideBalances = useCallback(async () => {
    const newValue = !hideBalances;
    setHideBalances(newValue);
    await AsyncStorage.setItem("hideBalances", newValue.toString());
  }, [hideBalances]);

  const totalValue = useMemo(() => {
    return portfolio.reduce((sum, asset) => sum + (asset.quantity * asset.currentPrice), 0);
  }, [portfolio]);

  const totalCost = useMemo(() => {
    return portfolio.reduce((sum, asset) => sum + (asset.quantity * asset.avgPrice), 0);
  }, [portfolio]);

  const totalProfit = totalValue - totalCost;
  const profitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  return useMemo(() => ({
    portfolio,
    transactions,
    addTransaction,
    totalValue,
    totalProfit,
    profitPercentage,
    refreshPortfolio,
    isLoading,
    hideBalances,
    toggleHideBalances,
  }), [portfolio, transactions, addTransaction, totalValue, totalProfit, profitPercentage, refreshPortfolio, isLoading, hideBalances, toggleHideBalances]);
});