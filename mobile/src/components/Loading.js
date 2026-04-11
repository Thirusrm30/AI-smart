import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function Loading({ message = 'Loading...' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1a73e8" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  text: {
    marginTop: 10,
    color: '#666',
    fontSize: 16
  }
});
