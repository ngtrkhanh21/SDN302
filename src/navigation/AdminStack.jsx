import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import AdminAddBlogScreen from "../screens/admin/AdminAddBlogScreen";
import AdminBlogDetailScreen from "../screens/admin/AdminBlogDetailScreen";
import AdminCourseDetailScreen from "../screens/admin/AdminCourseDetailScreen";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import CourseApproveScreen from "../screens/admin/CourseApproveScreen";
import GlobalAccountManageScreen from "../screens/admin/GlobalAccountManageScreen";
import AdminPostManageScreen from "../screens/admin/PostManageScreen";
import ProfileEditScreen from "../screens/customer/ProfileEditScreen";
import ProfileScreen from "../screens/shared/ProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#d63031",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 70,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = "grid";
          if (route.name === "AdminHome") iconName = "speedometer";
          else if (route.name === "ManageAccounts") iconName = "people-circle";
          else if (route.name === "ApproveCourses")
            iconName = "checkmark-done-circle";
          else if (route.name === "AdminPosts") iconName = "newspaper";
          else if (route.name === "Profile") iconName = "person-circle";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="AdminHome"
        component={AdminDashboardScreen}
        options={{ title: "Bảng điều khiển" }}
      />
      <Tab.Screen
        name="ManageAccounts"
        component={GlobalAccountManageScreen}
        options={{ title: "Tài khoản" }}
      />
      <Tab.Screen
        name="ApproveCourses"
        component={CourseApproveScreen}
        options={{ title: "Khóa học" }}
      />
      <Tab.Screen
        name="AdminPosts"
        component={AdminPostManageScreen}
        options={{ title: "Bài viết" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Tài khoản" }}
      />
    </Tab.Navigator>
  );
}

export default function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen
        name="AdminCourseDetail"
        component={AdminCourseDetailScreen}
      />
      <Stack.Screen name="AdminBlogDetail" component={AdminBlogDetailScreen} />
      <Stack.Screen name="AdminAddBlog" component={AdminAddBlogScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </Stack.Navigator>
  );
}
