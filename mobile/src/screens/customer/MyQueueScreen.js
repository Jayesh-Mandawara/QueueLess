import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    RefreshControl,
    Animated,
} from "react-native";
import api from "../../services/api";

export default function MyQueueScreen() {
    const [activeQueue, setActiveQueue] = useState(false);
    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const tokenPulse = useRef(new Animated.Value(1)).current;
    const servingGlow = useRef(new Animated.Value(0)).current;

    const fetchMyQueue = useCallback(async () => {
        try {
            const res = await api.get("/queues/my/current/");
            setActiveQueue(res.data.active_queue);
            setEntry(res.data.entry || null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchMyQueue();
        const interval = setInterval(fetchMyQueue, 10000);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        // Pulse the token number softly
        Animated.loop(
            Animated.sequence([
                Animated.timing(tokenPulse, {
                    toValue: 1.04,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(tokenPulse, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        // Glow animation for serving state
        Animated.loop(
            Animated.sequence([
                Animated.timing(servingGlow, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: false,
                }),
                Animated.timing(servingGlow, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: false,
                }),
            ]),
        ).start();

        return () => clearInterval(interval);
    }, [fetchMyQueue]);

    const handleCancel = async () => {
        if (!entry) return;
        Alert.alert(
            "Cancel Token",
            "Are you sure you want to leave the queue? You'll lose your current position.",
            [
                { text: "Keep My Spot", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        setCancelling(true);
                        try {
                            await api.post(
                                `/queues/entries/${entry.id}/cancel/`,
                            );
                            fetchMyQueue();
                        } catch (err) {
                            Alert.alert(
                                "Error",
                                err.response?.data?.error ||
                                    "Failed to cancel token",
                            );
                        } finally {
                            setCancelling(false);
                        }
                    },
                },
            ],
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0F766E" />
                <Text style={styles.loadingText}>Loading your token…</Text>
            </View>
        );
    }

    if (!activeQueue || !entry) {
        return (
            <ScrollView
                contentContainerStyle={styles.center}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchMyQueue();
                        }}
                        tintColor="#0F766E"
                    />
                }
            >
                <View style={styles.emptyCircle}>
                    <Text style={styles.emptyCircleIcon}>🎟️</Text>
                </View>
                <Text style={styles.emptyTitle}>No Active Token</Text>
                <Text style={styles.emptyDesc}>
                    Head to the Clinics tab to browse services and join a queue.
                    Your live turn will appear here.
                </Text>
                <View style={styles.emptyHint}>
                    <Text style={styles.emptyHintText}>
                        Pull down to refresh
                    </Text>
                </View>
            </ScrollView>
        );
    }

    const isServing = entry.status === "SERVING";
    const peopleAhead = entry.people_ahead || 0;
    const estWait = entry.estimated_wait_minutes || 0;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        fetchMyQueue();
                    }}
                    tintColor="#0F766E"
                />
            }
        >
            <View style={styles.bgOrb} />

            <Animated.View style={{ opacity: fadeAnim }}>
                {/* Screen Title */}
                <Text style={styles.screenHeader}>My Live Token</Text>
                <Text style={styles.screenSubHeader}>
                    Auto-refreshes every 10 seconds
                </Text>

                {/* Main Token Card */}
                <Animated.View
                    style={[styles.tokenCard, isServing && styles.servingCard]}
                >
                    {/* Top bar decoration */}
                    <View
                        style={[
                            styles.tokenCardBar,
                            isServing && styles.servingBar,
                        ]}
                    />

                    {/* Business & Service */}
                    <Text style={styles.businessBadge}>
                        {entry.business_name}
                    </Text>
                    <Text style={styles.serviceName}>{entry.service_name}</Text>

                    {/* Token Number */}
                    <Animated.View
                        style={[
                            styles.tokenDisplay,
                            { transform: [{ scale: tokenPulse }] },
                        ]}
                    >
                        <Text style={styles.tokenLabel}>YOUR TOKEN</Text>
                        <Text
                            style={[
                                styles.tokenNumber,
                                isServing && styles.tokenNumberServing,
                            ]}
                        >
                            #{entry.token_number}
                        </Text>
                    </Animated.View>

                    {/* Status Pill */}
                    <View
                        style={[
                            styles.statusPill,
                            isServing && styles.servingPill,
                        ]}
                    >
                        <View
                            style={[
                                styles.statusDot,
                                isServing && styles.servingDot,
                            ]}
                        />
                        <Text
                            style={[
                                styles.statusPillText,
                                isServing && styles.servingPillText,
                            ]}
                        >
                            {isServing
                                ? "🔔 YOUR TURN HAS ARRIVED!"
                                : "⏳ WAITING IN QUEUE"}
                        </Text>
                    </View>

                    {/* Metrics (shown when waiting) */}
                    {!isServing && (
                        <View style={styles.metricsGrid}>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricValue}>
                                    {peopleAhead}
                                </Text>
                                <Text style={styles.metricLabel}>
                                    AHEAD OF YOU
                                </Text>
                                <View
                                    style={[
                                        styles.metricBar,
                                        {
                                            width: `${Math.max(10, 100 - (peopleAhead / 20) * 100)}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <View style={styles.metricSpacer} />
                            <View style={styles.metricBox}>
                                <Text
                                    style={[
                                        styles.metricValue,
                                        { color: "#F59E0B" },
                                    ]}
                                >
                                    ~{estWait}m
                                </Text>
                                <Text style={styles.metricLabel}>
                                    EST. WAIT
                                </Text>
                                <View
                                    style={[
                                        styles.metricBar,
                                        {
                                            backgroundColor: "#F59E0B",
                                            width: "60%",
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    )}

                    {/* Serving Banner */}
                    {isServing && (
                        <View style={styles.servingBanner}>
                            <Text style={styles.servingBannerEmoji}>📢</Text>
                            <View>
                                <Text style={styles.servingBannerTitle}>
                                    Please proceed to the counter!
                                </Text>
                                <Text style={styles.servingBannerSub}>
                                    Show your token number at the desk
                                </Text>
                            </View>
                        </View>
                    )}
                </Animated.View>

                {/* Progress Visual */}
                {!isServing && (
                    <View style={styles.progressCard}>
                        <Text style={styles.progressLabel}>QUEUE PROGRESS</Text>
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width:
                                            peopleAhead === 0
                                                ? "95%"
                                                : `${Math.max(5, 100 - (peopleAhead / (peopleAhead + 1)) * 100)}%`,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {peopleAhead === 0
                                ? "You're next! Almost there..."
                                : `${peopleAhead} people ahead of you`}
                        </Text>
                    </View>
                )}

                {/* Cancel Button */}
                {!isServing && (
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={handleCancel}
                        disabled={cancelling}
                        activeOpacity={0.8}
                    >
                        {cancelling ? (
                            <ActivityIndicator color="#EF4444" size="small" />
                        ) : (
                            <Text style={styles.cancelBtnText}>
                                ✕ Cancel Token
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F8FC",
        paddingHorizontal: 20,
        paddingTop: 58,
    },
    center: {
        flex: 1,
        backgroundColor: "#F7F8FC",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        minHeight: 600,
    },
    bgOrb: {
        position: "absolute",
        top: -60,
        right: -80,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: "#0EA5A40B",
    },
    loadingText: {
        color: "#64748B",
        fontSize: 14,
        fontWeight: "600",
        marginTop: 12,
    },
    emptyCircle: {
        width: 100,
        height: 100,
        borderRadius: 32,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    emptyCircleIcon: {
        fontSize: 48,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "900",
        color: "#172033",
        marginBottom: 10,
    },
    emptyDesc: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 22,
        maxWidth: 280,
        marginBottom: 20,
    },
    emptyHint: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    emptyHintText: {
        color: "#64748B",
        fontSize: 12,
        fontWeight: "600",
    },
    screenHeader: {
        fontSize: 30,
        fontWeight: "900",
        color: "#172033",
        marginBottom: 4,
    },
    screenSubHeader: {
        color: "#64748B",
        fontSize: 12,
        marginBottom: 24,
        fontWeight: "500",
    },
    tokenCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 28,
        padding: 28,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 16,
        marginBottom: 16,
        overflow: "hidden",
    },
    servingCard: {
        borderColor: "#34D399",
        backgroundColor: "#052E1610",
    },
    tokenCardBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: "#0284C740",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    servingBar: {
        backgroundColor: "#34D399",
    },
    businessBadge: {
        color: "#0F766E",
        fontSize: 11,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 2,
        marginBottom: 6,
    },
    serviceName: {
        fontSize: 20,
        fontWeight: "800",
        color: "#172033",
        marginBottom: 28,
        textAlign: "center",
    },
    tokenDisplay: {
        alignItems: "center",
        marginBottom: 24,
    },
    tokenLabel: {
        fontSize: 10,
        fontWeight: "900",
        color: "#64748B",
        letterSpacing: 3,
        marginBottom: 6,
    },
    tokenNumber: {
        fontSize: 76,
        fontWeight: "900",
        color: "#0F766E",
        letterSpacing: -2,
        lineHeight: 80,
    },
    tokenNumberServing: {
        color: "#34D399",
    },
    statusPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 28,
        gap: 8,
    },
    servingPill: {
        backgroundColor: "#052E16",
        borderColor: "#059669",
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#0F766E",
    },
    servingDot: {
        backgroundColor: "#34D399",
    },
    statusPillText: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 0.8,
    },
    servingPillText: {
        color: "#34D399",
    },
    metricsGrid: {
        flexDirection: "row",
        width: "100%",
        marginBottom: 24,
    },
    metricBox: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        borderRadius: 18,
        padding: 18,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        gap: 4,
        overflow: "hidden",
    },
    metricSpacer: {
        width: 10,
    },
    metricValue: {
        fontSize: 28,
        fontWeight: "900",
        color: "#172033",
    },
    metricLabel: {
        fontSize: 10,
        color: "#64748B",
        fontWeight: "800",
        letterSpacing: 1,
    },
    metricBar: {
        height: 3,
        backgroundColor: "#0F766E",
        borderRadius: 2,
        marginTop: 6,
        alignSelf: "flex-start",
    },
    servingBanner: {
        backgroundColor: "#052E16",
        borderColor: "#05966960",
        borderWidth: 1,
        padding: 18,
        borderRadius: 18,
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    servingBannerEmoji: {
        fontSize: 28,
    },
    servingBannerTitle: {
        color: "#34D399",
        fontWeight: "800",
        fontSize: 15,
        marginBottom: 3,
    },
    servingBannerSub: {
        color: "#059669",
        fontSize: 12,
    },
    progressCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 16,
    },
    progressLabel: {
        fontSize: 10,
        fontWeight: "900",
        color: "#64748B",
        letterSpacing: 2,
        marginBottom: 12,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: "#E2E8F0",
        borderRadius: 4,
        marginBottom: 10,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#0F766E",
        borderRadius: 4,
    },
    progressText: {
        color: "#64748B",
        fontSize: 12,
        fontWeight: "600",
    },
    cancelBtn: {
        backgroundColor: "#1A0A0A",
        borderWidth: 1,
        borderColor: "#7F1D1D40",
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
        alignItems: "center",
    },
    cancelBtnText: {
        color: "#EF4444",
        fontWeight: "700",
        fontSize: 15,
    },
});
