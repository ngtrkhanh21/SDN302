import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import StaffBlogDetailScreen from "../screens/staff/StaffBlogDetailScreen";
import StaffBlogFormScreen from "../screens/staff/StaffBlogFormScreen";
import StaffContentManagementScreen from "../screens/staff/StaffContentManagementScreen";

const Stack = createStackNavigator();

export default function StaffContentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="StaffContentList"
        component={StaffContentManagementScreen}
      />
      <Stack.Screen name="StaffBlogDetail" component={StaffBlogDetailScreen} />
      <Stack.Screen name="StaffBlogForm" component={StaffBlogFormScreen} />
    </Stack.Navigator>
  );
}
