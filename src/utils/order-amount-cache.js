const orderAmountMap = new Map();

function normalizeOrderId(orderId) {
  return String(orderId || "").trim();
}

export function setOrderAmount(orderId, amount) {
  const key = normalizeOrderId(orderId);
  const numeric = Number(amount);

  if (!key || !Number.isFinite(numeric) || numeric <= 0) {
    return;
  }

  orderAmountMap.set(key, Math.round(numeric));
}

export function getOrderAmount(orderId) {
  const key = normalizeOrderId(orderId);
  if (!key) {
    return 0;
  }

  return Number(orderAmountMap.get(key) || 0);
}
