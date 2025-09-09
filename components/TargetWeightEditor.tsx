import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit3, Check, X } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { Asset } from '@/types/portfolio';

interface TargetWeightEditorProps {
  asset: Asset;
  onSave: (assetId: string, targetWeight: number) => void;
}

export default function TargetWeightEditor({ asset, onSave }: TargetWeightEditorProps) {
  const { colors } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState((asset.targetWeight || 0).toString());

  const handleSave = () => {
    const weight = parseFloat(value) || 0;
    if (weight >= 0 && weight <= 100) {
      onSave(asset.id, weight);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setValue((asset.targetWeight || 0).toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={value}
          onChangeText={setValue}
          keyboardType="numeric"
          placeholder="0-100"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          allowFontScaling
          accessibilityLabel="Hedef ağırlık yüzdesi"
        />
        <Text style={[styles.percentSymbol, { color: colors.textSecondary }]}>%</Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          onPress={handleSave}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Kaydet"
          accessibilityRole="button"
        >
          <Check color={colors.background} size={16} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          onPress={handleCancel}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="İptal"
          accessibilityRole="button"
        >
          <X color={colors.background} size={16} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.displayContainer}
      onPress={() => setIsEditing(true)}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityLabel={`Hedef ağırlık: ${asset.targetWeight || 0}%. Düzenlemek için dokunun`}
      accessibilityRole="button"
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>Hedef:</Text>
      <Text style={[styles.value, { color: colors.text }]}>
        {asset.targetWeight || 0}%
      </Text>
      <Edit3 color={colors.textSecondary} size={14} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    minWidth: 50,
    textAlign: 'center',
  },
  percentSymbol: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    padding: 6,
    borderRadius: 4,
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    minHeight: 32,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
});