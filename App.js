import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import './src/firebase.js'; 
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddOperationScreen from './src/screens/AddOperationScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditScreen from './src/screens/EditScreen.js';
import { ThemeProvider, useTheme } from './src/operacoes/ThemeContext.js';
import { AuthProvider, useAuth } from './src/operacoes/AuthContext.js';
import { View, Text } from 'react-native';
import { auth } from './src/firebase'; 

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Lembretes') {
            iconName = focused ? 'bell' : 'bell-outline';
          } else if (route.name === 'Operações') {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          } else if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Ajustes') {
            iconName = focused ? 'cog' : 'cog-outline';
          } else if (route.name === 'Movimentações') {
            iconName = focused ? 'cash-multiple' : 'cash-multiple';
          }
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6A0DAD',
        tabBarInactiveTintColor: theme.text,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.text,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Lembretes" component={RemindersScreen} />
      <Tab.Screen name="Movimentações" component={RecipesScreen} />
      <Tab.Screen name="Operações" component={AddOperationScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Ajustes" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Carregando.........</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName="Login">
      {user ? (
        <>
          <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Edit" component={EditScreen} options={{ title: 'Editar Operação' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setFirebaseInitialized(true);
      unsubscribe();
    });

    return () => unsubscribe();
  }, []);

  if (!firebaseInitialized) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Inicializando Firebase...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}

