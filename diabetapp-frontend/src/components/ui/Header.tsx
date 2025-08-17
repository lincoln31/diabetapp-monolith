import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS, APP_CONFIG } from '../../constants/config';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Header: React.FC<HeaderProps> = ({
  title = APP_CONFIG.name,
  subtitle = APP_CONFIG.description,
  showLogo = true,
  size = 'medium'
}) => {
  return (
    <View style={styles.header}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <Icon 
            name="heart" 
            size={32} 
            color={COLORS.white}
          />
        </View>
      )}
      
      <Text style={[styles.title, styles[`${size}Title`]]}>
        {title}
      </Text>
      
      {subtitle && (
        <Text style={[styles.subtitle, styles[`${size}Subtitle`]]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.primary,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  smallTitle: {
    fontSize: 20,
  },
  mediumTitle: {
    fontSize: 28,
  },
  largeTitle: {
    fontSize: 32,
  },
  subtitle: {
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  smallSubtitle: {
    fontSize: 14,
  },
  mediumSubtitle: {
    fontSize: 16,
  },
  largeSubtitle: {
    fontSize: 18,
  },
});

export default Header;
