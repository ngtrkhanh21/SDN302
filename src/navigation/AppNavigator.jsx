import React, { useEffect } from 'react';
import AuthStack from './AuthStack';
import CustomerStack from './CustomerStack';
import InstructorStack from './InstructorStack';
import StaffStack from './StaffStack';
import AdminStack from './AdminStack';
import NotFoundScreen from '../screens/shared/NotFoundScreen';
import useAuthStore from '../store/auth-store';
import { ROLES } from '../constants/roles';

function RoleBasedNavigator() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <AuthStack />;
  }

  const role = user.role;

  if (role === ROLES.INSTRUCTOR) {
    return <InstructorStack />;
  }

  if (role === ROLES.STAFF) {
    return <StaffStack />;
  }

  if (role === ROLES.ADMIN) {
    return <AdminStack />;
  }

  return <CustomerStack />;
}

export default function AppNavigator() {
  const { isInitializing, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isInitializing) {
    return <NotFoundScreen />;
  }

  return <RoleBasedNavigator />;
}

