import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function Button({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false,
  variant = 'primary',
  style 
}) {
  const buttonStyles = [
    styles.button,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'danger' && styles.buttonDanger,
    disabled && styles.buttonDisabled,
    style
  ];

  const textStyles = [
    styles.text,
    variant === 'secondary' && styles.textSecondary,
    variant === 'danger' && styles.textDanger,
    disabled && styles.textDisabled
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1a73e8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonSecondary: {
    backgroundColor: '#e8e8e8'
  },
  buttonDanger: {
    backgroundColor: '#dc3545'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  textSecondary: {
    color: '#333'
  },
  textDanger: {
    color: '#fff'
  },
  textDisabled: {
    color: '#fff'
  }
});
