import React, { useState, useEffect, useContext, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Animated,
} from "react-native";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const CATEGORY_ICONS = {
    clinic: "🏥",
    hospital: "🏨",
    pharmacy: "💊",
    bank: "🏦",
    office: "🏢",
    salon: "✂️",
    restaurant: "🍽️",
    default: "🏢",
};

function getCategoryIcon(name) {
    const lower = (name || "").toLowerCase();
    for (const k in CATEGORY_ICONS) {
        if (lower.includes(k)) return CATEGORY_ICONS[k];
    }
    return CATEGORY_ICONS.default;
}

export default function CustomerHomeScreen({ navigation }) {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user, logout } = useContext(AuthContext);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-20)).current;

    const fetchBusinesses = async () => {
        try {
            const res = await api.get("/businesses/");
            setBusinesses(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBusinesses();
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(headerSlide, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBusinesses();
    };

    const renderBusinessCard = ({ item, index }) => {
        const icon = getCategoryIcon(item.name);
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                    navigation.navigate("BusinessDetail", { business: item })
                }
            >
                {/* Decorative corner accent */}
                <View style={styles.cardAccent} />

                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>{icon}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.businessName} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={styles.address} numberOfLines={1}>
                            📍 {item.address}
                        </Text>
                    </View>
                    <View style={styles.badge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.badgeText}>OPEN</Text>
                    </View>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.cardFooter}>
                    <View style={styles.statChip}>
                        <Text style={styles.statChipText}>
                            ⚡ {item.services?.length || 0} Services
                        </Text>
                    </View>
                    <View style={styles.hoursChip}>
                        <Text style={styles.hoursChipText}>
                            ⏰ {item.opening_time || "9AM"} –{" "}
                            {item.closing_time || "5PM"}
                        </Text>
                    </View>
                    <Text style={styles.viewText}>View →</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const firstName = user?.name?.split(" ")[0] || "User";
    const hour = new Date().getHours();
    const greeting =
        hour < 12
            ? "🌅 Good Morning"
            : hour < 17
              ? "☀️ Good Afternoon"
              : "🌙 Good Evening";

    return (
        <View style={styles.container}>
            {/* Background orb */}
            <View style={styles.bgOrb} />

            {/* Header */}
            <Animated.View
                style={[
                    styles.headerBanner,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: headerSlide }],
                    },
                ]}
            >
                <View>
                    <Text style={styles.greeting}>{greeting}</Text>
                    <Text style={styles.userName}>{firstName} 👋</Text>
                </View>
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={logout}
                    activeOpacity={0.8}
                >
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Hero banner */}
            <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}>
                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>Skip the Wait ⏱️</Text>
                    <Text style={styles.heroDesc}>
                        Book your virtual token instantly and arrive just in
                        time.
                    </Text>
                </View>
                <Text style={styles.heroEmoji}>🎟️</Text>
            </Animated.View>

            {/* Section Label */}
            <Animated.View style={[styles.sectionRow, { opacity: fadeAnim }]}>
                <Text style={styles.sectionTitle}>AVAILABLE CLINICS</Text>
                <Text style={styles.sectionCount}>
                    {businesses.length} places
                </Text>
            </Animated.View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#0F766E" />
                    <Text style={styles.loadingText}>Fetching clinics…</Text>
                </View>
            ) : (
                <FlatList
                    data={businesses}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderBusinessCard}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#0F766E"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyIcon}>🏙️</Text>
                            <Text style={styles.emptyTitle}>
                                No Clinics Yet
                            </Text>
                            <Text style={styles.emptyDesc}>
                                Pull down to refresh and check again.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F8FC",
        paddingHorizontal: 20,
        paddingTop: 58,
    },
    bgOrb: {
        position: "absolute",
        top: -100,
        right: -100,
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: "#0EA5A40B",
    },
    headerBanner: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 22,
    },
    greeting: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    userName: {
        fontSize: 26,
        fontWeight: "900",
        color: "#172033",
        letterSpacing: 0.2,
    },
    logoutBtn: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    logoutText: {
        color: "#64748B",
        fontWeight: "700",
        fontSize: 13,
    },
    heroCard: {
        backgroundColor: "#F0FDFA",
        borderColor: "#0EA5A430",
        borderWidth: 1,
        borderRadius: 22,
        padding: 20,
        marginBottom: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#0EA5A4",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
    },
    heroContent: {
        flex: 1,
    },
    heroTitle: {
        fontSize: 17,
        fontWeight: "900",
        color: "#0F766E",
        marginBottom: 4,
    },
    heroDesc: {
        fontSize: 12,
        color: "#64748B",
        lineHeight: 18,
    },
    heroEmoji: {
        fontSize: 40,
        marginLeft: 12,
    },
    sectionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "900",
        color: "#64748B",
        letterSpacing: 2,
    },
    sectionCount: {
        fontSize: 12,
        color: "#0F766E",
        fontWeight: "700",
    },
    loadingWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: {
        color: "#64748B",
        fontSize: 14,
        fontWeight: "600",
    },
    listContainer: {
        paddingBottom: 30,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 20,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
        overflow: "hidden",
    },
    cardAccent: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: "#0EA5E930",
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: "#F0FDFA",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    iconText: {
        fontSize: 24,
    },
    businessName: {
        fontSize: 18,
        fontWeight: "800",
        color: "#172033",
        marginBottom: 3,
    },
    address: {
        color: "#64748B",
        fontSize: 12,
    },
    badge: {
        backgroundColor: "#052E1620",
        borderColor: "#05966940",
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#34D399",
    },
    badgeText: {
        color: "#34D399",
        fontSize: 10,
        fontWeight: "900",
        letterSpacing: 0.5,
    },
    description: {
        color: "#64748B",
        fontSize: 13,
        marginBottom: 16,
        lineHeight: 19,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        paddingTop: 14,
    },
    statChip: {
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    statChipText: {
        color: "#0F766E",
        fontSize: 11,
        fontWeight: "700",
    },
    hoursChip: {
        backgroundColor: "#080D18",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    hoursChipText: {
        color: "#94A3B8",
        fontSize: 11,
        fontWeight: "600",
    },
    viewText: {
        marginLeft: "auto",
        color: "#172033",
        fontWeight: "900",
        fontSize: 14,
    },
    emptyWrap: {
        alignItems: "center",
        paddingTop: 60,
        gap: 10,
    },
    emptyIcon: {
        fontSize: 52,
    },
    emptyTitle: {
        color: "#172033",
        fontSize: 20,
        fontWeight: "800",
    },
    emptyDesc: {
        color: "#64748B",
        fontSize: 14,
        textAlign: "center",
    },
});
