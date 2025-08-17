import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/config';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: ReactNode;
  labelStyle?: any;
  containerStyle?: any;
  size?: 'small' | 'medium' | 'large';
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  label,
  labelStyle,
  containerStyle,
  size = 'medium'
}) => {
  const getCheckboxSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  const getCheckmarkSize = () => {
    switch (size) {
      case 'small': return 10;
      case 'large': return 16;
      default: return 12;
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity 
        style={[
          styles.checkbox,
          { 
            width: getCheckboxSize(),
            height: getCheckboxSize(),
            borderColor: checked ? COLORS.primary : COLORS.gray[300],
            backgroundColor: checked ? COLORS.primary : COLORS.white,
          }
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {checked && (
          <Text style={[
            styles.checkmark,
            { fontSize: getCheckmarkSize() }
          ]}>
            ✓
          </Text>
        )}
      </TouchableOpacity>
      
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[500],
    lineHeight: 20,
  },
});

export default Checkbox;
