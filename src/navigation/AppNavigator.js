import React, { useMemo } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import CreateLecturerScreen from '../screens/CreateLecturerScreen';
import CreateStudentScreen from '../screens/CreateStudentScreen';
import PendingStudentsScreen from '../screens/PendingStudentsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { isStudent, isLecturer, isFaculty, isAdmin } = useAuth();
  const { colors: COLORS } = useTheme();
  const isManagement = isFaculty || isAdmin;

  const ICONS = {
    HomeTab:    'home',
    AdminTab:   'grid',
    ProfileTab: 'person',
  };

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: COLORS.bg,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
        height: 68,
        paddingBottom: 8,
        paddingTop: 6,
      },
      tabBarActiveTintColor: COLORS.accent,
      tabBarInactiveTintColor: COLORS.t3,
      tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
      tabBarIcon: ({ focused, color }) => {
        const base = ICONS[route.name] || 'ellipse';
        return <Ionicons name={focused ? base : base + '-outline'} size={22} color={color} />;
      },
    })}>
      <Tab.Screen name="HomeTab"    component={HomeScreen}           options={{ tabBarLabel: 'Home' }} />
      {isManagement && (
        <Tab.Screen name="AdminTab" component={AdminDashboardScreen} options={{ tabBarLabel: 'Admin' }} />
      )}
      <Tab.Screen name="ProfileTab" component={ProfileScreen}        options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoggedIn } = useAuth();
  const { colors: COLORS } = useTheme();

  const navTheme = useMemo(() => ({
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: COLORS.bg,
      card: COLORS.bg,
      text: COLORS.t1,
      border: COLORS.border,
      primary: COLORS.accent,
    },
  }), [COLORS]);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login"          component={LoginScreen} />
            <Stack.Screen name="Register"       component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main"            component={MainTabs} />
            <Stack.Screen name="Notifications"   component={NotificationsScreen} />
            <Stack.Screen name="EditProfile"     component={EditProfileScreen} />
            <Stack.Screen name="Settings"        component={SettingsScreen} />
            <Stack.Screen name="HelpSupport"     component={HelpSupportScreen} />
            <Stack.Screen name="AdminDashboard"  component={AdminDashboardScreen} />
            <Stack.Screen name="UserManagement"  component={UserManagementScreen} />
            <Stack.Screen name="UserDetail"      component={UserDetailScreen} />
            <Stack.Screen name="CreateLecturer"  component={CreateLecturerScreen} />
            <Stack.Screen name="CreateStudent"   component={CreateStudentScreen} />
            <Stack.Screen name="PendingStudents" component={PendingStudentsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
