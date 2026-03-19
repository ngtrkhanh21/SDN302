import { StyleSheet, Text, View } from "react-native";

export default function PostManageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý bài viết</Text>
      <Text style={styles.subtitle}>
        Kiểm duyệt bài đăng cộng đồng trước khi hiển thị.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#55efc4",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#00b894",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#2d3436",
    textAlign: "center",
  },
});
