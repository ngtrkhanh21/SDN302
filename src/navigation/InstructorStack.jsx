import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/instructor/DashboardScreen';
import UploadCourseScreen from '../screens/instructor/UploadCourseScreen';
import ManageCoursesScreen from '../screens/instructor/ManageCoursesScreen';
import OrderReportsScreen from '../screens/instructor/OrderReportsScreen';
import RevenueScreen from '../screens/instructor/RevenueScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function InstructorStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#6c5ce7',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 70,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'stats-chart';

          if (route.name === 'InstructorHome') {
            iconName = 'easel';
          } else if (route.name === 'Upload') {
            iconName = 'cloud-upload';
          } else if (route.name === 'MyCourses') {
            iconName = 'albums';
          } else if (route.name === 'Reports') {
            iconName = 'bar-chart';
          } else if (route.name === 'Revenue') {
            iconName = 'cash';
          } else if (route.name === 'Profile') {
            iconName = 'person-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="InstructorHome"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Upload"
        component={UploadCourseScreen}
        options={{ title: 'Upload' }}
      />
      <Tab.Screen
        name="MyCourses"
        component={ManageCoursesScreen}
        options={{ title: 'Courses' }}
      />
      <Tab.Screen
        name="Reports"
        component={OrderReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Tab.Screen
        name="Revenue"
        component={RevenueScreen}
        options={{ title: 'Revenue' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

