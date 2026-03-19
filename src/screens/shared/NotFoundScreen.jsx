import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ôi!</Text>
      <Text style={styles.message}>Trang này chưa sẵn sàng.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffeaa7",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#d63031",
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: "#2d3436",
  },
});
