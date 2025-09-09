import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { Calendar, DollarSign, Hash } from "lucide-react-native";
import { router } from "expo-router";
import SymbolSearch from "@/components/SymbolSearch";

export default function AddTransactionScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { addTransaction, portfolio } = usePortfolio();
  const insets = useSafeAreaInsets();
  
  const [transactionType, setTransactionType] = useState<"buy" | "sell">("buy");
  const [symbol, setSymbol] = useState("");
  const [assetName, setAssetName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const handleSymbolSelect = (selectedSymbol: string, currentPrice: number, name?: string) => {
    console.log('AddTransaction: Symbol selected', { selectedSymbol, currentPrice, name });
    setSymbol(selectedSymbol);
    setPrice(currentPrice.toString());
    if (name) {
      setAssetName(name);
    }
    console.log('AddTransaction: State updated', { symbol: selectedSymbol, price: currentPrice.toString(), assetName: name });
  };

  const getCurrentHolding = () => {
    if (!symbol || transactionType !== 'sell') return null;
    const asset = portfolio.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
    return asset ? asset.quantity : 0;
  };

  const currentHolding = getCurrentHolding();

  const handleSubmit = () => {
    console.log('Submit pressed', { symbol, quantity, price, transactionType });
    
    if (!symbol || !quantity || !price) {
      console.log('Validation failed:', { symbol: !!symbol, quantity: !!quantity, price: !!price });
      if (Platform.OS === 'web') {
        alert(`Lütfen tüm alanları doldurun:\nSembol: ${symbol || 'Boş'}\nMiktar: ${quantity || 'Boş'}\nFiyat: ${price || 'Boş'}`);
      } else {
        Alert.alert('Hata', `Lütfen tüm alanları doldurun:\nSembol: ${symbol || 'Boş'}\nMiktar: ${quantity || 'Boş'}\nFiyat: ${price || 'Boş'}`);
      }
      return;
    }

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(price);
    
    if (isNaN(quantityNum) || isNaN(priceNum) || quantityNum <= 0 || priceNum <= 0) {
      console.log('Invalid numbers:', { quantityNum, priceNum });
      if (Platform.OS === 'web') {
        alert(`Geçersiz sayılar:\nMiktar: ${quantityNum}\nFiyat: ${priceNum}`);
      } else {
        Alert.alert('Hata', `Geçersiz sayılar:\nMiktar: ${quantityNum}\nFiyat: ${priceNum}`);
      }
      return;
    }

    console.log('Adding transaction:', {
      type: transactionType,
      symbol: symbol.toUpperCase(),
      quantity: quantityNum,
      price: priceNum,
      date,
      notes,
    });

    try {
      addTransaction({
        type: transactionType,
        symbol: symbol.toUpperCase(),
        quantity: quantityNum,
        price: priceNum,
        date,
        notes,
      });

      // Clear form
      setSymbol('');
      setAssetName('');
      setQuantity('');
      setPrice('');
      setNotes('');
      
      console.log('Transaction added, navigating back');
      
      const successMessage = transactionType === 'buy' ? 'Varlık başarıyla satın alındı!' : 'Varlık başarıyla satıldı!';
      
      if (Platform.OS === 'web') {
        alert(successMessage);
      } else {
        Alert.alert('Başarılı', successMessage, [{ text: 'Tamam' }]);
      }
      
      router.back();
    } catch (error) {
      console.error('Error adding transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'İşlem eklenirken bir hata oluştu';
      
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Hata', errorMessage, [{ text: 'Tamam' }]);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{t("transaction.addNew")}</Text>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: transactionType === "buy" ? colors.success : colors.card },
                ]}
                onPress={() => setTransactionType("buy")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: transactionType === "buy" ? "#FFFFFF" : colors.text },
                  ]}
                >
                  {t("transaction.buy")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: transactionType === "sell" ? colors.error : colors.card },
                ]}
                onPress={() => setTransactionType("sell")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: transactionType === "sell" ? "#FFFFFF" : colors.text },
                  ]}
                >
                  {t("transaction.sell")}
                </Text>
              </TouchableOpacity>
            </View>

            <SymbolSearch
              value={symbol}
              onChangeText={setSymbol}
              onSelectSymbol={handleSymbolSelect}
              placeholder={t("transaction.symbol")}
            />

            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Hash color={colors.textSecondary} size={20} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("transaction.quantity")}
                placeholderTextColor={colors.textSecondary}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
              />
            </View>
            
            {transactionType === 'sell' && currentHolding !== null && currentHolding > 0 && (
              <View style={[styles.holdingInfo, { backgroundColor: colors.card }]}>
                <Text style={[styles.holdingText, { color: colors.textSecondary }]}>
                  Mevcut miktar: {currentHolding}
                </Text>
              </View>
            )}
            
            {transactionType === 'sell' && currentHolding === 0 && symbol && (
              <View style={[styles.holdingInfo, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.holdingText, { color: colors.error }]}>
                  Bu varlığa sahip değilsiniz
                </Text>
              </View>
            )}

            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <DollarSign color={colors.textSecondary} size={20} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("transaction.price")}
                placeholderTextColor={colors.textSecondary}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Calendar color={colors.textSecondary} size={20} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("transaction.date")}
                placeholderTextColor={colors.textSecondary}
                value={date}
                onChangeText={setDate}
              />
            </View>

            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={t("transaction.notes")}
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>{t("common.save")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  notesInput: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  holdingInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  holdingText: {
    fontSize: 14,
    textAlign: "center",
  },
});