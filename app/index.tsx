import { Redirect } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/portfolio" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});