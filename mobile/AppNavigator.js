import React, { useContext } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { AuthContext } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";

import CustomerHomeScreen from "./src/screens/customer/HomeScreen";
import BusinessDetailScreen from "./src/screens/customer/BusinessDetailScreen";
import QueuePreviewScreen from "./src/screens/customer/QueuePreviewScreen";
import MyQueueScreen from "./src/screens/customer/MyQueueScreen";
import QueueHistoryScreen from "./src/screens/customer/QueueHistoryScreen";
import NotificationsScreen from "./src/screens/customer/NotificationsScreen";

import StaffHomeScreen from "./src/screens/staff/StaffHomeScreen";
import AdminDashboardScreen from "./src/screens/admin/AdminDashboardScreen";
import { C } from "./src/theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CustomerHomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="CustomerHomeMain"
                component={CustomerHomeScreen}
            />
            <Stack.Screen
                name="BusinessDetail"
                component={BusinessDetailScreen}
            />
            <Stack.Screen name="QueuePreview" component={QueuePreviewScreen} />
        </Stack.Navigator>
    );
}

function CustomerTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: C.card,
                    borderTopColor: C.border,
                    borderTopWidth: 1,
                    height: 68,
                    paddingBottom: 10,
                    paddingTop: 8,
                    shadowColor: "#64748B",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    elevation: 16,
                },
                tabBarActiveTintColor: C.primary,
                tabBarInactiveTintColor: C.textDim,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 0.3,
                },
                tabBarIcon: ({ color, focused }) => {
                    let icon = "🏠";
                    if (route.name === "HomeTab") icon = "🏥";
                    else if (route.name === "MyQueueTab") icon = "🎟️";
                    else if (route.name === "HistoryTab") icon = "📋";
                    else if (route.name === "NotifTab") icon = "🔔";
                    return (
                        <View
                            style={[
                                {
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 36,
                                    height: 28,
                                    borderRadius: 10,
                                },
                                focused && { backgroundColor: C.primaryGlow },
                            ]}
                        >
                            <Text style={{ fontSize: focused ? 20 : 18 }}>
                                {icon}
                            </Text>
                        </View>
                    );
                },
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={CustomerHomeStack}
                options={{ title: "Clinics" }}
            />
            <Tab.Screen
                name="MyQueueTab"
                component={MyQueueScreen}
                options={{ title: "My Token" }}
            />
            <Tab.Screen
                name="HistoryTab"
                component={QueueHistoryScreen}
                options={{ title: "History" }}
            />
            <Tab.Screen
                name="NotifTab"
                component={NotificationsScreen}
                options={{ title: "Alerts" }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: C.bg,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen
                            name="Register"
                            component={RegisterScreen}
                        />
                    </>
                ) : user.role === "ADMIN" ? (
                    <Stack.Screen
                        name="AdminDashboard"
                        component={AdminDashboardScreen}
                    />
                ) : user.role === "STAFF" ? (
                    <Stack.Screen
                        name="StaffHome"
                        component={StaffHomeScreen}
                    />
                ) : (
                    <Stack.Screen
                        name="CustomerTabs"
                        component={CustomerTabNavigator}
                    />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
