import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import ProfileEditScreen from "../screens/customer/ProfileEditScreen";
import ProfileScreen from "../screens/shared/ProfileScreen";
import InstructorDetailScreen from "../screens/staff/InstructorDetailScreen";
import InstructorEditScreen from "../screens/staff/InstructorEditScreen";
import InstructorProfilesScreen from "../screens/staff/InstructorProfilesScreen";
import StaffInstructorApprovalScreen from "../screens/staff/StaffInstructorApprovalScreen";
import StaffContentStack from "./StaffContentStack";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function StaffTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#3498db",
        tabBarInactiveTintColor: "#95a5a6",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 70,
          paddingBottom: 8,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = "book-multiple";

          if (route.name === "Content") {
            iconName = "file-document-multiple";
          } else if (route.name === "InstructorApproval") {
            iconName = "clipboard-check";
          } else if (route.name === "Instructors") {
            iconName = "school";
          } else if (route.name === "Profile") {
            iconName = "account-circle";
          }

          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen
        name="Content"
        component={StaffContentStack}
        options={{ title: "Bài viết" }}
      />
      <Tab.Screen
        name="InstructorApproval"
        component={StaffInstructorApprovalScreen}
        options={{ title: "Duyệt GV" }}
      />
      <Tab.Screen
        name="Instructors"
        component={InstructorProfilesScreen}
        options={{ title: "Giảng viên" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Tài khoản" }}
      />
    </Tab.Navigator>
  );
}

export default function StaffStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StaffTabs" component={StaffTabs} />
      <Stack.Screen
        name="InstructorDetail"
        component={InstructorDetailScreen}
      />
      <Stack.Screen name="InstructorEdit" component={InstructorEditScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </Stack.Navigator>
  );
}
