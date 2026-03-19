import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import cartService from "../../services/cart-service";
import orderService from "../../services/order-service";

export default function CartScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartMeta, setCartMeta] = useState({});

  const extractCartItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data?.cartItems)) return payload.data.cartItems;
    if (Array.isArray(payload?.data?.courses)) return payload.data.courses;
    if (Array.isArray(payload?.data?.cart?.items))
      return payload.data.cart.items;
    return [];
  };

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await cartService.getMyCart();
      const list = extractCartItems(data);
      setCart(Array.isArray(list) ? list : []);
      setCartMeta(
        data?.data && !Array.isArray(data.data) ? data.data : data || {},
      );
    } catch (error) {
      console.warn("Failed to load cart", error);
      Alert.alert("Error", "Cannot load cart.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", loadCart);
    return unsub;
  }, [navigation, loadCart]);

  const handleRemove = async (item) => {
    const cartItemId = item._id || item.id || item.cartItemId || item.item_id;
    if (!cartItemId) {
      Alert.alert("Error", "Cannot determine cart item id.");
      return;
    }

    try {
      await cartService.removeCartItem(cartItemId);
      loadCart();
    } catch (error) {
      console.warn("Failed to remove cart item", error);
      Alert.alert("Error", "Cannot remove item from cart.");
    }
  };

  const handleClear = async () => {
    Alert.alert("Clear cart", "Remove all items from cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await cartService.clearCart();
            loadCart();
          } catch (error) {
            console.warn("Failed to clear cart", error);
            Alert.alert("Error", "Cannot clear cart.");
          }
        },
      },
    ]);
  };

  const handleCheckout = async () => {
    if (!cart.length) {
      Alert.alert("Empty cart", "Please add some courses first.");
      return;
    }

    const selectedCartItemIds = cart
      .map((item) => item._id || item.id || item.cartItemId || item.item_id)
      .filter(Boolean);

    if (!selectedCartItemIds.length) {
      Alert.alert("Error", "Cannot determine cart item ids for checkout.");
      return;
    }
    try {
      const data = await orderService.createOrderFromCart(selectedCartItemIds);
      const order = data?.data || data || null;
      const orderId = order?._id || order?.id;

      // Refresh cart right after checkout request so UI reflects server state.
      await loadCart();

      if (orderId) {
        Alert.alert("Order created", "Proceed to payment?", [
          {
            text: "Yes",
            onPress: () => navigation.navigate("Payment", { orderId }),
          },
          { text: "Later", style: "cancel" },
        ]);
      } else {
        Alert.alert("Order created", "Check your orders for payment.");
        loadCart();
      }
    } catch (error) {
      console.warn("Failed to create order", error);
      Alert.alert("Error", "Cannot create order from cart.");
    }
  };

  const renderItem = ({ item }) => {
    const course =
      item.course || item.course_id || item.courseId || item.courseInfo || item;
    const itemTitle =
      course?.name || item.course_name || item.name || item.title || "Course";
    const itemPrice = item.price ?? course?.price ?? 0;
    const canRemove = !!(
      item._id ||
      item.id ||
      item.cartItemId ||
      item.item_id
    );

    return (
      <View style={styles.itemRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{itemTitle}</Text>
          <Text style={styles.itemPrice}>
            {itemPrice
              ? `${Number(itemPrice).toLocaleString("vi-VN")} VND`
              : "Free"}
          </Text>
        </View>
        {canRemove ? (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemove(item)}
          >
            <Text style={styles.removeText}>X</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const totalFromApi =
    cartMeta.totalPrice ??
    cartMeta.total ??
    cartMeta.finalPrice ??
    cartMeta.subtotal;

  const total =
    typeof totalFromApi === "number"
      ? totalFromApi
      : cart.reduce((sum, item) => {
          const course =
            item.course ||
            item.course_id ||
            item.courseId ||
            item.courseInfo ||
            item;
          const itemPrice = item.price ?? course?.price ?? 0;
          return sum + (Number(itemPrice) || 0);
        }, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your art basket</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#00cec9" />
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item, index) =>
              String(item._id || item.id || item.course_id?._id || index)
            }
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 16 }}
            ListEmptyComponent={
              <Text style={styles.empty}>Your basket is empty.</Text>
            }
          />

          {cart.length > 0 && (
            <View style={styles.footer}>
              <Text style={styles.totalText}>Total: {total} VND</Text>
              <View style={styles.footerButtons}>
                <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={handleCheckout}
                >
                  <Text style={styles.checkoutText}>Checkout</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#81ecec",
    padding: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#00cec9",
  },
  itemRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    alignItems: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
  },
  itemPrice: {
    fontSize: 14,
    color: "#636e72",
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#d63031",
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: {
    color: "#fff",
    fontWeight: "800",
  },
  empty: {
    textAlign: "center",
    color: "#2d3436",
    marginTop: 24,
  },
  footer: {
    marginTop: 12,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d3436",
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  clearBtn: {
    flex: 1,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d63031",
    alignItems: "center",
    paddingVertical: 10,
  },
  clearText: {
    color: "#d63031",
    fontWeight: "700",
  },
  checkoutBtn: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 16,
    backgroundColor: "#fd79a8",
    alignItems: "center",
    paddingVertical: 10,
  },
  checkoutText: {
    color: "#fff",
    fontWeight: "700",
  },
});
