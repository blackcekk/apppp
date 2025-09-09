import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { TrendingUp, Search } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { searchSymbols, getSymbolPrice } from "@/services/marketService";
import { formatCurrency } from "@/utils/formatters";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  category: string;
}

interface SymbolSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectSymbol: (symbol: string, price: number) => void;
  placeholder?: string;
}

export default function SymbolSearch({
  value,
  onChangeText,
  onSelectSymbol,
  placeholder,
}: SymbolSearchProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length >= 1) {
      setIsLoading(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchSymbols(value);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Search error:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value]);

  const handleSelectSymbol = async (asset: Asset) => {
    onChangeText(asset.symbol);
    setShowSuggestions(false);
    setSuggestions([]);
    
    try {
      const currentPrice = await getSymbolPrice(asset.symbol);
      onSelectSymbol(asset.symbol, currentPrice || asset.price);
    } catch (error) {
      console.error("Price fetch error:", error);
      onSelectSymbol(asset.symbol, asset.price);
    }
  };

  const renderSuggestionItem = ({ item }: { item: Asset }) => {
    const isPositive = item.changePercent >= 0;
    
    return (
      <TouchableOpacity
        style={[styles.suggestionItem, { backgroundColor: colors.card }]}
        onPress={() => handleSelectSymbol(item)}
        testID={`symbol-suggestion-${item.symbol}`}
      >
        <View style={styles.suggestionLeft}>
          <Text style={[styles.suggestionSymbol, { color: colors.text }]}>
            {item.symbol}
          </Text>
          <Text style={[styles.suggestionName, { color: colors.textSecondary }]}>
            {item.name}
          </Text>
        </View>
        <View style={styles.suggestionRight}>
          <Text style={[styles.suggestionPrice, { color: colors.text }]}>
            {formatCurrency(item.price, "USD")}
          </Text>
          <Text
            style={[
              styles.suggestionChange,
              { color: isPositive ? colors.success : colors.error },
            ]}
          >
            {isPositive ? "+" : ""}{item.changePercent.toFixed(2)}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
        <TrendingUp color={colors.textSecondary} size={20} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder || t("transaction.symbol")}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="characters"
          testID="symbol-search-input"
        />
        {isLoading && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </View>
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: colors.background }]}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={(item) => item.id}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            testID="symbol-suggestions-list"
          />
        </View>
      )}
      
      {showSuggestions && suggestions.length === 0 && !isLoading && value.length >= 1 && (
        <View style={[styles.noResultsContainer, { backgroundColor: colors.card }]}>
          <Search color={colors.textSecondary} size={24} />
          <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
            {t("search.noResults")}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 300,
    zIndex: 1001,
  },
  suggestionsList: {
    borderRadius: 12,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  suggestionLeft: {
    flex: 1,
  },
  suggestionSymbol: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  suggestionName: {
    fontSize: 14,
  },
  suggestionRight: {
    alignItems: "flex-end",
  },
  suggestionPrice: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  suggestionChange: {
    fontSize: 14,
    fontWeight: "500",
  },
  noResultsContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1001,
  },
  noResultsText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
});