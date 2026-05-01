import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./src/store/AuthContext";
import { ActivityIndicator, View } from "react-native";

import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ProductionFormScreen from "./src/screens/ProductionFormScreen";
import SalesFormScreen from "./src/screens/SalesFormScreen";

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" }}>
      <ActivityIndicator color="#3b82f6" size="large" />
    </View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#1e293b" }, headerTintColor: "#fff", headerTitleStyle: { fontWeight: "700" } }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: "🏭 Bosh menyu", headerLeft: () => null }} />
            <Stack.Screen name="ProductionForm" component={ProductionFormScreen} options={{ title: "📦 Mahsulot kiritish" }} />
            <Stack.Screen name="SalesForm" component={SalesFormScreen} options={{ title: "💰 Sotuv kiritish" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
