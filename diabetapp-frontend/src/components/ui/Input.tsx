import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  TextInputProps 
} from 'react-native';
import Icon from './Icon';
import { COLORS } from '../../constants/config';

interface InputProps extends TextInputProps {
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  error?: string;
  containerStyle?: any;
}

const Input: React.FC<InputProps> = ({
  icon,
  rightIcon,
  onRightIconPress,
  error,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[
        styles.inputWrapper, 
        isFocused && styles.inputFocused,
        error && styles.inputError
      ]}>
        {icon && (
          <Icon 
            name={icon} 
            size={18} 
            color={isFocused ? COLORS.primary : COLORS.gray[400]}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[styles.textInput, style]}
          placeholderTextColor={COLORS.gray[400]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity 
            onPress={onRightIconPress}
            style={styles.rightIcon}
            disabled={!onRightIconPress}
          >
            <Icon 
              name={rightIcon} 
              size={18} 
              color={COLORS.gray[400]}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  leftIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[800],
    marginRight: 8,
  },
  rightIcon: {
    padding: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;
