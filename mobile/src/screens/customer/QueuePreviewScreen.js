import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Animated,
} from "react-native";
import api from "../../services/api";

export default function QueuePreviewScreen({ route, navigation }) {
    const { service, business } = route.params;
    const [queueStatus, setQueueStatus] = useState(null);
    const [hasActiveToken, setHasActiveToken] = useState(false);
    const [myTokenNumber, setMyTokenNumber] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const tokenScaleAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        fetchData();
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for the live dot
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.4,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, []);

    const fetchData = async () => {
        try {
            const [statusRes, myQueueRes] = await Promise.all([
                api.get(`/queues/services/${service.id}/status/`),
                api.get("/queues/my/current/"),
            ]);
            setQueueStatus(statusRes.data);

            if (myQueueRes.data.active_queue && myQueueRes.data.entry) {
                if (myQueueRes.data.entry.queue === statusRes.data.queue_id) {
                    setHasActiveToken(true);
                    setMyTokenNumber(myQueueRes.data.entry.token_number);
                    Animated.spring(tokenScaleAnim, {
                        toValue: 1,
                        friction: 5,
                        useNativeDriver: true,
                    }).start();
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinQueue = async () => {
        if (hasActiveToken) {
            navigation.navigate("MyQueueTab");
            return;
        }

        setJoining(true);
        try {
            const res = await api.post(`/queues/services/${service.id}/join/`);
            setHasActiveToken(true);
            setMyTokenNumber(res.data.token_number);
            Animated.spring(tokenScaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }).start();
            fetchData();

            Alert.alert(
                "🎉 You're In!",
                `Token #${res.data.token_number} has been assigned. Track your turn in real time!`,
                [
                    {
                        text: "View My Token",
                        onPress: () => navigation.navigate("MyQueueTab"),
                    },
                    { text: "Stay Here" },
                ],
            );
        } catch (err) {
            const msg = err.response?.data?.error || "Failed to join queue";
            Alert.alert("Cannot Join", msg);
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0F766E" />
                <Text style={styles.loadingText}>Loading live queue…</Text>
            </View>
        );
    }

    const estWait =
        (queueStatus?.waiting_count || 0) * (service.average_service_time || 5);
    const waitingCount = queueStatus?.waiting_count || 0;
    const servingToken = queueStatus?.currently_serving_token;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.bgOrb} />

            {/* Back Button */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
                activeOpacity={0.8}
            >
                <Text style={styles.backArrow}>←</Text>
                <Text style={styles.backText}>Back to Services</Text>
            </TouchableOpacity>

            {/* Service Header */}
            <Animated.View
                style={[
                    styles.serviceHeader,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <View style={styles.serviceIconBox}>
                    <Text style={styles.serviceIconText}>🩺</Text>
                </View>
                <Text style={styles.serviceTitle}>{service.name}</Text>
                <Text style={styles.businessName}>{business.name}</Text>
            </Animated.View>

            {/* My Token (if already has one) */}
            {hasActiveToken && (
                <Animated.View
                    style={[
                        styles.myTokenBanner,
                        { transform: [{ scale: tokenScaleAnim }] },
                    ]}
                >
                    <Text style={styles.myTokenLabel}>YOUR TOKEN</Text>
                    <Text style={styles.myTokenNumber}>#{myTokenNumber}</Text>
                    <Text style={styles.myTokenSub}>
                        Tap "View My Token" below to track your position
                    </Text>
                </Animated.View>
            )}

            {/* Live Queue Stats */}
            <Animated.View style={[styles.statsBox, { opacity: fadeAnim }]}>
                <View style={styles.statsHeader}>
                    <Animated.View
                        style={[
                            styles.liveDot,
                            { transform: [{ scale: pulseAnim }] },
                        ]}
                    />
                    <Text style={styles.statsHeaderText}>
                        LIVE QUEUE STATUS
                    </Text>
                </View>

                <View style={styles.statCards}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            {servingToken ? `#${servingToken}` : "—"}
                        </Text>
                        <Text style={styles.statLabel}>Serving Now</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statCard}>
                        <Text
                            style={[
                                styles.statValue,
                                waitingCount > 10 && { color: "#F59E0B" },
                            ]}
                        >
                            {waitingCount}
                        </Text>
                        <Text style={styles.statLabel}>In Queue</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statCard}>
                        <Text
                            style={[
                                styles.statValue,
                                { color: "#34D399", fontSize: 22 },
                            ]}
                        >
                            ~{estWait}m
                        </Text>
                        <Text style={styles.statLabel}>Est. Wait</Text>
                    </View>
                </View>
            </Animated.View>

            {/* Service Info */}
            <Animated.View
                style={[styles.serviceInfoBox, { opacity: fadeAnim }]}
            >
                <Text style={styles.serviceInfoTitle}>SERVICE DETAILS</Text>
                <View style={styles.serviceInfoRow}>
                    <Text style={styles.serviceInfoLabel}>
                        Average Service Time
                    </Text>
                    <Text style={styles.serviceInfoValue}>
                        {service.average_service_time} minutes
                    </Text>
                </View>
                <View style={styles.serviceInfoRow}>
                    <Text style={styles.serviceInfoLabel}>
                        Service Description
                    </Text>
                    <Text style={styles.serviceInfoValue}>
                        {service.description || "N/A"}
                    </Text>
                </View>
            </Animated.View>

            {/* Join Button */}
            <TouchableOpacity
                style={[
                    styles.joinBtn,
                    hasActiveToken && styles.viewTokenBtn,
                    joining && styles.joiningBtn,
                ]}
                onPress={handleJoinQueue}
                disabled={joining}
                activeOpacity={0.85}
            >
                {joining ? (
                    <ActivityIndicator color="#FFF" />
                ) : hasActiveToken ? (
                    <View style={styles.btnInner}>
                        <Text style={styles.viewTokenBtnText}>
                            ✓ Token #{myTokenNumber} — View My Token
                        </Text>
                    </View>
                ) : (
                    <View style={styles.btnInner}>
                        <Text style={styles.joinBtnText}>
                            🎟️ Join Queue Now
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {!hasActiveToken && (
                <Text style={styles.joinDisclaimer}>
                    You'll receive live updates as your turn approaches
                </Text>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F8FC",
    },
    content: {
        padding: 20,
        paddingTop: 54,
        paddingBottom: 40,
    },
    bgOrb: {
        position: "absolute",
        top: -80,
        right: -80,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: "#0EA5A40B",
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: "#F7F8FC",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
    },
    loadingText: {
        color: "#64748B",
        fontSize: 14,
        fontWeight: "600",
    },
    backBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 24,
    },
    backArrow: {
        color: "#0F766E",
        fontSize: 20,
        fontWeight: "800",
    },
    backText: {
        color: "#0F766E",
        fontSize: 15,
        fontWeight: "700",
    },
    serviceHeader: {
        alignItems: "center",
        marginBottom: 28,
    },
    serviceIconBox: {
        width: 64,
        height: 64,
        borderRadius: 22,
        backgroundColor: "#F0FDFA",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 14,
        shadowColor: "#0EA5A4",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    serviceIconText: {
        fontSize: 32,
    },
    serviceTitle: {
        fontSize: 26,
        fontWeight: "900",
        color: "#172033",
        textAlign: "center",
        marginBottom: 6,
    },
    businessName: {
        color: "#64748B",
        fontSize: 15,
        fontWeight: "600",
    },
    myTokenBanner: {
        backgroundColor: "#052E16",
        borderColor: "#05966960",
        borderWidth: 1.5,
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#34D399",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    myTokenLabel: {
        fontSize: 10,
        fontWeight: "900",
        color: "#34D399",
        letterSpacing: 2,
        marginBottom: 4,
    },
    myTokenNumber: {
        fontSize: 52,
        fontWeight: "900",
        color: "#34D399",
        letterSpacing: -1,
        marginBottom: 4,
    },
    myTokenSub: {
        color: "#059669",
        fontSize: 12,
        textAlign: "center",
    },
    statsBox: {
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    statsHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 20,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#34D399",
    },
    statsHeaderText: {
        fontSize: 11,
        fontWeight: "900",
        color: "#64748B",
        letterSpacing: 2,
    },
    statCards: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    statCard: {
        flex: 1,
        alignItems: "center",
    },
    statDivider: {
        width: 1,
        height: 50,
        backgroundColor: "#E2E8F0",
    },
    statValue: {
        fontSize: 26,
        fontWeight: "900",
        color: "#0F766E",
        marginBottom: 6,
    },
    statLabel: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: "700",
        textAlign: "center",
    },
    serviceInfoBox: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 24,
    },
    serviceInfoTitle: {
        fontSize: 10,
        fontWeight: "900",
        color: "#64748B",
        letterSpacing: 2,
        marginBottom: 14,
    },
    serviceInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    serviceInfoLabel: {
        color: "#64748B",
        fontSize: 13,
        flex: 1,
    },
    serviceInfoValue: {
        color: "#CBD5E1",
        fontSize: 13,
        fontWeight: "600",
        flex: 1,
        textAlign: "right",
    },
    joinBtn: {
        backgroundColor: "#0284C7",
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: "center",
        shadowColor: "#0284C7",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 8,
    },
    viewTokenBtn: {
        backgroundColor: "#052E16",
        borderColor: "#059669",
        borderWidth: 1.5,
    },
    joiningBtn: {
        opacity: 0.7,
    },
    btnInner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    joinBtnText: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 17,
        letterSpacing: 0.5,
    },
    viewTokenBtnText: {
        color: "#34D399",
        fontWeight: "900",
        fontSize: 15,
        letterSpacing: 0.3,
    },
    joinDisclaimer: {
        textAlign: "center",
        color: "#64748B",
        fontSize: 12,
        marginTop: 14,
        fontStyle: "italic",
    },
});
