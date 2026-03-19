const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/user/login",
  AUTH_REGISTER: "/user/register",
  AUTH_LOGOUT: "/user/logout",
  AUTH_VERIFY_EMAIL: "/user/verify-email",
  AUTH_CHANGE_PASSWORD: "/user/change-password",

  // Users
  USER_ME: "/user/get-me",
  USER_UPDATE_ME: "/user/update-me",
  USER_ALL: "/user/all",
  USER_DETAIL: (id) => `/user/${id}`,

  // Course
  COURSE_LIST: "/api/course",
  COURSE_MY_COURSES: "/api/course/myCourses",
  COURSE_DETAIL: (courseId) => `/api/course/${courseId}`,
  COURSE_CREATE: "/api/course/create",
  COURSE_UPDATE: (courseId) => `/api/course/${courseId}`,
  COURSE_DELETE: (courseId) => `/api/course/${courseId}`,

  // Category
  CATEGORY_LIST: "/api/category",
  CATEGORY_DETAIL: (categoryId) => `/api/category/${categoryId}`,

  // Cart
  CART_ADD: "/api/cart/addCourse",
  CART_GET_MY_CART: "/api/cart/myCart",
  CART_REMOVE_ITEM: (cartItemId) => `/api/cart/remove/${cartItemId}`,
  CART_CLEAR: "/api/cart/clear",

  // Order
  ORDER_CREATE_FROM_CART: "/api/order/createOrderFromCart",
  ORDER_MY_ORDERS: "/api/order/myOrders",
  ORDER_ALL: "/api/order/all",
  ORDER_DETAIL: (orderId) => `/api/order/${orderId}`,
  ORDER_UPDATE_STATUS: (orderId, newStatus) =>
    `/api/order/status/${orderId}/${newStatus}`,

  // Payment
  PAYMENT_CREATE_FROM_ORDER: "/api/payment/createPaymentFromOrder",
  PAYMENT_HISTORY_BY_USER: (userId) => `/api/payment/history/${userId}`,
  PAYMENT_DETAIL: (paymentId) => `/api/payment/${paymentId}`,
  PAYMENT_UPDATE_STATUS: (paymentId) => `/api/payment/${paymentId}/status`,

  // Review
  REVIEW_LIST: "/api/review",
  REVIEW_CREATE_FOR_COURSE: "/api/review/course",
  REVIEW_CREATE_FOR_APPOINTMENT: "/api/review/appointment",
  REVIEW_BY_COURSE: (courseId) => `/api/review/course/${courseId}`,
  REVIEW_BY_USER: (userId) => `/api/review/user/${userId}`,

  // Session
  SESSION_CREATE: "/api/session",
  SESSION_ALL: "/api/session/all",
  SESSION_BY_COURSE: (courseId) => `/api/session/course/${courseId}`,
  SESSION_DETAIL: (id) => `/api/session/${id}`,
  SESSION_UPDATE: (id) => `/api/session/${id}`,
  SESSION_DELETE: (id) => `/api/session/${id}`,

  // Lesson
  LESSON_CREATE: "/api/lesson",
  LESSON_PAGED: "/api/lesson/paged",
  LESSON_BY_SESSION: (sessionId) => `/api/lesson/session/${sessionId}`,
  LESSON_DETAIL: (lessonId) => `/api/lesson/${lessonId}`,
  LESSON_UPDATE: (lessonId) => `/api/lesson/${lessonId}`,
  LESSON_DELETE: (lessonId) => `/api/lesson/${lessonId}`,

  // Instructor
  INSTRUCTOR_LIST: "/api/instructor",
  INSTRUCTOR_ORDER_HISTORY: "/api/instructor/order-history",
  INSTRUCTOR_SALES_SUMMARY: "/api/instructor/course-sales-summary",
  INSTRUCTOR_REQUEST_LIST: "/api/instructor/request",
  INSTRUCTOR_DETAIL: (id) => `/api/instructor/${id}`,
  INSTRUCTOR_UPDATE: (id) => `/api/instructor/${id}`,
  INSTRUCTOR_DELETE: (id) => `/api/instructor/${id}`,
  INSTRUCTOR_REQUEST_REVIEW: (id) => `/api/instructor/request/${id}/review`,
  USER_BECOME_INSTRUCTOR: "/user/become-instructor",

  // Blog / Posts
  BLOG_LIST: "/api/blog",
  BLOG_BY_USER: (userId) => `/api/blog/user/${userId}`,
  BLOG_DETAIL: (id) => `/api/blog/${id}`,
  BLOG_CREATE: "/api/blog/create",
  BLOG_UPDATE: (id) => `/api/blog/${id}`,
  BLOG_DELETE: (id) => `/api/blog/${id}`,

  // VNPay
  VNPAY_CREATE_URL: "/api/vnpay/create-payment-url",
  VNPAY_RETURN: "/api/vnpay/return",
  VNPAY_IPN: "/api/vnpay/ipn",
};

export default ENDPOINTS;
