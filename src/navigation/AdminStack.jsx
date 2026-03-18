import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import GlobalAccountManageScreen from '../screens/admin/GlobalAccountManageScreen';
import CourseApproveScreen from '../screens/admin/CourseApproveScreen';
import AdminCourseDetailScreen from '../screens/admin/AdminCourseDetailScreen';
import AdminPostManageScreen from '../screens/admin/PostManageScreen';
import AdminBlogDetailScreen from '../screens/admin/AdminBlogDetailScreen';
import AdminAddBlogScreen from '../screens/admin/AdminAddBlogScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#d63031',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 70,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'grid';
          if (route.name === 'AdminHome') iconName = 'speedometer';
          else if (route.name === 'ManageAccounts') iconName = 'people-circle';
          else if (route.name === 'ApproveCourses') iconName = 'checkmark-done-circle';
          else if (route.name === 'AdminPosts') iconName = 'newspaper';
          else if (route.name === 'Profile') iconName = 'person-circle';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="AdminHome" component={AdminDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="ManageAccounts" component={GlobalAccountManageScreen} options={{ title: 'Accounts' }} />
      <Tab.Screen name="ApproveCourses" component={CourseApproveScreen} options={{ title: 'Courses' }} />
      <Tab.Screen name="AdminPosts" component={AdminPostManageScreen} options={{ title: 'Posts' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AdminCourseDetail" component={AdminCourseDetailScreen} />
      <Stack.Screen name="AdminBlogDetail" component={AdminBlogDetailScreen} />
      <Stack.Screen name="AdminAddBlog" component={AdminAddBlogScreen} />
    </Stack.Navigator>
  );
}
