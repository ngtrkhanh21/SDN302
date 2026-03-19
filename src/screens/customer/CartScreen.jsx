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
import { setOrderAmount } from "../../utils/order-amount-cache";
import { formatVnd, getLineItemPricing } from "../../utils/pricing";

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
      Alert.alert("Lỗi", "Không thể tải giỏ hàng.");
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
      Alert.alert("Lỗi", "Không xác định được mã mục trong giỏ hàng.");
      return;
    }

    try {
      await cartService.removeCartItem(cartItemId);
      loadCart();
    } catch (error) {
      console.warn("Failed to remove cart item", error);
      Alert.alert("Lỗi", "Không thể xóa mục khỏi giỏ hàng.");
    }
  };

  const handleClear = async () => {
    Alert.alert("Xóa giỏ hàng", "Xóa tất cả khóa học khỏi giỏ hàng?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await cartService.clearCart();
            loadCart();
          } catch (error) {
            console.warn("Failed to clear cart", error);
            Alert.alert("Lỗi", "Không thể xóa giỏ hàng.");
          }
        },
      },
    ]);
  };

  const handleCheckout = async () => {
    if (!cart.length) {
      Alert.alert("Giỏ hàng trống", "Vui lòng thêm khóa học trước.");
      return;
    }

    const selectedCartItemIds = cart
      .map((item) => item._id || item.id || item.cartItemId || item.item_id)
      .filter(Boolean);

    if (!selectedCartItemIds.length) {
      Alert.alert("Lỗi", "Không xác định được mã mục để thanh toán.");
      return;
    }
    try {
      const data = await orderService.createOrderFromCart(selectedCartItemIds);
      const order = data?.data || data || null;
      const orderId = order?._id || order?.id;

      // Refresh cart right after checkout request so UI reflects server state.
      await loadCart();

      if (orderId) {
        const checkoutTotal = Number(total) || 0;
        if (checkoutTotal > 0) {
          setOrderAmount(orderId, checkoutTotal);
        }

        Alert.alert("Đã tạo đơn hàng", "Chuyển đến thanh toán?", [
          {
            text: "Có",
            onPress: () =>
              navigation.navigate("Payment", {
                orderId,
                fallbackTotal: checkoutTotal,
              }),
          },
          { text: "Để sau", style: "cancel" },
        ]);
      } else {
        Alert.alert(
          "Đã tạo đơn hàng",
          "Vui lòng kiểm tra đơn hàng để thanh toán.",
        );
        loadCart();
      }
    } catch (error) {
      console.warn("Failed to create order", error);
      Alert.alert("Lỗi", "Không thể tạo đơn hàng từ giỏ hàng.");
    }
  };

  const renderItem = ({ item }) => {
    const course =
      item.course || item.course_id || item.courseId || item.courseInfo || item;
    const itemTitle =
      course?.name || item.course_name || item.name || item.title || "Khóa học";
    const { originalPrice, discountPercent, finalPrice } =
      getLineItemPricing(item);
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
          {originalPrice <= 0 ? (
            <Text style={styles.itemPrice}>Miễn phí</Text>
          ) : discountPercent > 0 ? (
            <View style={styles.priceWrap}>
              <View style={styles.priceTopRow}>
                <Text style={styles.itemOldPrice}>
                  {formatVnd(originalPrice)}
                </Text>
                <Text style={styles.itemDiscount}>-{discountPercent}%</Text>
              </View>
              <Text style={styles.itemFinalPrice}>{formatVnd(finalPrice)}</Text>
            </View>
          ) : (
            <Text style={styles.itemPrice}>{formatVnd(finalPrice)}</Text>
          )}
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

  const computedTotal = cart.reduce((sum, item) => {
    const { finalPrice } = getLineItemPricing(item);
    return sum + finalPrice;
  }, 0);

  const total =
    computedTotal > 0 || cart.length > 0
      ? computedTotal
      : Number(totalFromApi || 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giỏ khóa học của bạn</Text>

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
              <Text style={styles.empty}>Giỏ hàng của bạn đang trống.</Text>
            }
          />

          {cart.length > 0 && (
            <View style={styles.footer}>
              <Text style={styles.totalText}>Tổng: {formatVnd(total)}</Text>
              <View style={styles.footerButtons}>
                <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                  <Text style={styles.clearText}>Xóa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={handleCheckout}
                >
                  <Text style={styles.checkoutText}>Thanh toán</Text>
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
  priceWrap: {
    marginTop: 3,
    gap: 2,
  },
  priceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemOldPrice: {
    fontSize: 12,
    color: "#95a5a6",
    textDecorationLine: "line-through",
  },
  itemDiscount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d63031",
  },
  itemFinalPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#d63031",
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
