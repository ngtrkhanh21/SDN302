import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import InstructorProfilesScreen from '../screens/staff/InstructorProfilesScreen';
import AccountManageScreen from '../screens/staff/AccountManageScreen';
import PostManageScreen from '../screens/staff/PostManageScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function StaffStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#00cec9',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 70,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'people';

          if (route.name === 'Instructors') {
            iconName = 'school';
          } else if (route.name === 'Accounts') {
            iconName = 'people-circle';
          } else if (route.name === 'Posts') {
            iconName = 'newspaper';
          } else if (route.name === 'Profile') {
            iconName = 'person-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Instructors"
        component={InstructorProfilesScreen}
        options={{ title: 'Instructors' }}
      />
      <Tab.Screen
        name="Accounts"
        component={AccountManageScreen}
        options={{ title: 'Accounts' }}
      />
      <Tab.Screen
        name="Posts"
        component={PostManageScreen}
        options={{ title: 'Posts' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

