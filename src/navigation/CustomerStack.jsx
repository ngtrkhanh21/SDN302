import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import CartScreen from "../screens/customer/CartScreen";
import CourseDetailScreen from "../screens/customer/CourseDetailScreen";
import CoursePlayerScreen from "../screens/customer/CoursePlayerScreen";
import FeedbackScreen from "../screens/customer/FeedbackScreen";
import HomeScreen from "../screens/customer/HomeScreen";
import MyCoursesScreen from "../screens/customer/MyCoursesScreen";
import OrderHistoryScreen from "../screens/customer/OrderHistoryScreen";
import PaymentHistoryScreen from "../screens/customer/PaymentHistoryScreen";
import PaymentScreen from "../screens/customer/PaymentScreen";
import ProfileEditScreen from "../screens/customer/ProfileEditScreen";
import SearchScreen from "../screens/customer/SearchScreen";
import VNPayReturnScreen from "../screens/customer/VNPayReturnScreen";
import ProfileScreen from "../screens/shared/ProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#ff6b81",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 70,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = "home";
          if (route.name === "Home") iconName = "color-palette";
          else if (route.name === "Search") iconName = "school";
          else if (route.name === "Cart") iconName = "cart";
          else if (route.name === "Orders") iconName = "receipt";
          else if (route.name === "MyCourses") iconName = "play-circle";
          else if (route.name === "Profile") iconName = "person-circle";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: "Become Instructor" }}
      />
      <Tab.Screen
        name="MyCourses"
        component={MyCoursesScreen}
        options={{ tabBarLabel: "My Courses" }}
      />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Orders" component={OrderHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function CustomerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={CustomerTabs} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="CoursePlayer" component={CoursePlayerScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="VNPayReturn" component={VNPayReturnScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
    </Stack.Navigator>
  );
}
