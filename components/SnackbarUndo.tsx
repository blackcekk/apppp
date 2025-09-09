import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Undo2 } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';

interface SnackbarUndoProps {
  visible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export default function SnackbarUndo({ 
  visible, 
  message, 
  onUndo, 
  onDismiss, 
  duration = 5000 
}: SnackbarUndoProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (visible) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else {
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, translateY, handleDismiss]);

  const handleUndo = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onUndo();
    onDismiss();
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          bottom: insets.bottom + 16,
          transform: [{ translateY }],
        }
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity 
          style={[styles.undoButton, { backgroundColor: colors.primary }]} 
          onPress={handleUndo}
          activeOpacity={0.8}
        >
          <Undo2 color={colors.background} size={16} />
          <Text style={[styles.undoText, { color: colors.background }]}>Geri Al</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  undoText: {
    fontSize: 14,
    fontWeight: '600',
  },
});