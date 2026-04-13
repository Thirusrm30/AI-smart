import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';

import Login from '../screens/Login';
import Register from '../screens/Register';
import ForgotPassword from '../screens/ForgotPassword';
import Home from '../screens/Home';
import ReportForm from '../screens/ReportForm';
import ReportList from '../screens/ReportList';
import ReportDetail from '../screens/ReportDetail';
import Profile from '../screens/Profile';
import AuthorityDashboard from '../screens/AuthorityDashboard';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }) {
  const icons = {
    Home: '🏠',
    Dashboard: '📊',
    Report: '📝',
    Reports: '📋',
    Profile: '👤'
  };
  return (
    <Text style={{ fontSize: focused ? 28 : 24, opacity: focused ? 1 : 0.5 }}>
      {icons[name]}
    </Text>
  );
}

function CitizenTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#1a73e8' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      })}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Report" component={ReportForm} options={{ title: 'Report Issue' }} />
      <Tab.Screen name="Reports" component={ReportList} options={{ title: 'My Reports' }} />
      <Tab.Screen name="Profile" component={Profile} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AuthorityTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#dc3545',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#dc3545' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AuthorityDashboard} 
        options={{ title: 'Dashboard', headerShown: false }} 
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportList} 
        options={{ title: 'All Reports', headerStyle: { backgroundColor: '#dc3545' } }} 
      />
      <Tab.Screen name="Profile" component={Profile} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    </Stack.Navigator>
  );
}

function CitizenStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CitizenTabs" 
        component={CitizenTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ReportDetail" 
        component={ReportDetail} 
        options={{ 
          title: 'Report Details',
          headerStyle: { backgroundColor: '#1a73e8' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPassword} 
        options={{ 
          title: 'Change Password',
          headerStyle: { backgroundColor: '#1a73e8' },
          headerTintColor: '#fff'
        }} 
      />
    </Stack.Navigator>
  );
}

function AuthorityStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AuthorityTabs" 
        component={AuthorityTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ReportDetail" 
        component={ReportDetail} 
        options={{ 
          title: 'Report Details',
          headerStyle: { backgroundColor: '#dc3545' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPassword} 
        options={{ 
          title: 'Change Password',
          headerStyle: { backgroundColor: '#dc3545' },
          headerTintColor: '#fff'
        }} 
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        user.role === 'authority' ? <AuthorityStack /> : <CitizenStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
