function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampDiscount(discount) {
  const normalized = toNumber(discount);
  if (normalized < 0) return 0;
  if (normalized > 100) return 100;
  return normalized;
}

function extractCourseLike(source) {
  const base = source || {};

  if (
    base.course &&
    typeof base.course === "object" &&
    !Array.isArray(base.course)
  ) {
    return base.course;
  }

  if (
    base.course_id &&
    typeof base.course_id === "object" &&
    !Array.isArray(base.course_id)
  ) {
    return base.course_id;
  }

  if (
    base.courseId &&
    typeof base.courseId === "object" &&
    !Array.isArray(base.courseId)
  ) {
    return base.courseId;
  }

  return base;
}

export function getCoursePricing(courseLike) {
  const parent = courseLike || {};
  const source = extractCourseLike(parent);
  const originalPrice = Math.max(
    0,
    toNumber(
      source.price ??
        parent.price ??
        source.originalPrice ??
        parent.originalPrice ??
        source.basePrice ??
        parent.basePrice,
    ),
  );
  const discountPercent = clampDiscount(
    source.discount ??
      parent.discount ??
      source.discountPercent ??
      parent.discountPercent ??
      source.salePercent ??
      parent.salePercent,
  );
  const discountAmount = (originalPrice * discountPercent) / 100;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return {
    originalPrice,
    discountPercent,
    discountAmount,
    finalPrice,
  };
}

export function getLineItemPricing(lineItem) {
  const item = lineItem || {};
  const course = extractCourseLike(item);

  const originalPrice = Math.max(
    0,
    toNumber(
      item.originalPrice ??
        course.price ??
        course.originalPrice ??
        item.price ??
        item.unitPrice ??
        item.amount,
    ),
  );

  const discountPercent = clampDiscount(
    item.discount ??
      item.discountPercent ??
      course.discount ??
      course.discountPercent,
  );

  const hasExplicitFinalPrice =
    item.finalPrice != null ||
    item.discountedPrice != null ||
    item.salePrice != null ||
    item.subtotal != null;

  const explicitFinalPrice = Math.max(
    0,
    toNumber(
      item.finalPrice ??
        item.discountedPrice ??
        item.salePrice ??
        item.subtotal,
    ),
  );

  const discountAmount = (originalPrice * discountPercent) / 100;
  const computedFinalPrice = Math.max(0, originalPrice - discountAmount);
  const finalPrice = hasExplicitFinalPrice
    ? explicitFinalPrice
    : computedFinalPrice;

  return {
    originalPrice,
    discountPercent,
    discountAmount,
    finalPrice,
  };
}

export function formatVnd(value) {
  const amount = Math.round(toNumber(value));
  return `${amount.toLocaleString("vi-VN")} đ`;
}
