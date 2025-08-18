import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/config';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Iconos simulados con emojis (temporal hasta instalar react-native-vector-icons)
const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color = COLORS.gray[600],
  style 
}) => {
  const getIconEmoji = (iconName: string): string => {
    const iconMap: { [key: string]: string } = {
      'heart': '💙',
      'user': '👤',
      'email': '📧',
      'lock': '🔒',
      'phone': '📱',
      'calendar': '📅',
      'eye': '👁️',
      'eye-off': '🙈',
      'home': '🏠',
      'chart': '📊',
      'settings': '⚙️',
      'logout': '🚪',
      'plus': '➕',
      'minus': '➖',
      'check': '✅',
      'close': '❌',
      'arrow-right': '➡️',
      'arrow-left': '⬅️',
      'arrow-up': '⬆️',
      'arrow-down': '⬇️',
    };
    
    return iconMap[iconName] || '❓';
  };

  return (
    <Text style={[
      styles.icon, 
      { 
        fontSize: size, 
        color,
      },
      style
    ]}>
      {getIconEmoji(name)}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});

export default Icon;
