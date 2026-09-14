import React, {
    useState,
    useEffect,
    useContext,
    useCallback,
    useRef,
} from "react";
import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
    Animated,
} from "react-native";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

function MetricCard({ value, label, color, icon }) {
    return (
        <View style={[styles.metricCard, { borderTopColor: color }]}>
            <Text style={styles.metricIcon}>{icon}</Text>
            <Text style={[styles.metricValue, { color }]}>{value}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
        </View>
    );
}

function InfoRow({ label, value, accent }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, accent && { color: accent }]}>
                {value}
            </Text>
        </View>
    );
}

export default function AdminDashboardScreen() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user, logout } = useContext(AuthContext);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-20)).current;

    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await api.get("/analytics/dashboard/");
            setAnalytics(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
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
    }, [fetchAnalytics]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loadingText}>Loading analytics…</Text>
            </View>
        );
    }

    const summary = analytics?.summary || {};
    const total = summary.total_tokens || 0;
    const completed = summary.completed || 0;
    const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        fetchAnalytics();
                    }}
                    tintColor="#F59E0B"
                />
            }
        >
            <View style={styles.bgOrbTop} />
            <View style={styles.bgOrbBottom} />

            {/* Top Header */}
            <Animated.View
                style={[
                    styles.topBar,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: headerSlide }],
                    },
                ]}
            >
                <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeIcon}>👑</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.adminTitle}>Admin Console</Text>
                    <Text style={styles.adminSub}>
                        Analytics & System Overview
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={logout}
                    activeOpacity={0.8}
                >
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Status Banner */}
            <Animated.View style={[styles.statusBanner, { opacity: fadeAnim }]}>
                <View style={styles.statusLeft}>
                    <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveDotText}>LIVE</Text>
                    </View>
                    <Text style={styles.statusBannerTitle}>System Status</Text>
                    <Text style={styles.statusBannerSub}>
                        All services operational
                    </Text>
                </View>
                <Text style={styles.statusEmoji}>🟢</Text>
            </Animated.View>

            {/* Main Metrics Grid */}
            <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={styles.sectionTitle}>TODAY'S METRICS</Text>
                <View style={styles.metricsGrid}>
                    <MetricCard
                        value={summary.total_tokens || 0}
                        label="Total Tokens"
                        color="#0F766E"
                        icon="🎟️"
                    />
                    <MetricCard
                        value={summary.completed || 0}
                        label="Completed"
                        color="#34D399"
                        icon="✓"
                    />
                    <MetricCard
                        value={summary.serving || 0}
                        label="Serving Now"
                        color="#F59E0B"
                        icon="🔔"
                    />
                    <MetricCard
                        value={summary.waiting || 0}
                        label="Waiting"
                        color="#A78BFA"
                        icon="⏳"
                    />
                </View>
            </Animated.View>

            {/* Completion Rate */}
            <Animated.View style={[styles.rateCard, { opacity: fadeAnim }]}>
                <View style={styles.rateHeader}>
                    <Text style={styles.rateTitle}>COMPLETION RATE</Text>
                    <Text style={styles.rateValue}>{completionRate}%</Text>
                </View>
                <View style={styles.rateBarBg}>
                    <View
                        style={[
                            styles.rateBarFill,
                            { width: `${completionRate}%` },
                        ]}
                    />
                </View>
                <Text style={styles.rateDesc}>
                    {completed} out of {total} tokens served today
                </Text>
            </Animated.View>

            {/* Timing & Metrics */}
            <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
                <Text style={styles.sectionTitle}>TIMING & PERFORMANCE</Text>

                <InfoRow
                    label="⏱️ Avg. Waiting Time"
                    value={`~${summary.average_waiting_time_mins || 0} mins`}
                    accent="#F59E0B"
                />
                <InfoRow
                    label="⚙️ Avg. Service Time"
                    value={`~${summary.average_service_time_mins || 0} mins`}
                    accent="#0F766E"
                />
                <InfoRow
                    label="📈 Peak Queue Hour"
                    value={summary.peak_hour || "N/A"}
                    accent="#A78BFA"
                />
                <InfoRow
                    label="📋 Cancelled Tokens"
                    value={`${summary.cancelled || 0}`}
                    accent="#F87171"
                />
                <InfoRow
                    label="⏭ Skipped Tokens"
                    value={`${summary.skipped || 0}`}
                    accent="#FBBF24"
                />
            </Animated.View>

            {/* Tip Box */}
            <Animated.View style={[styles.tipBox, { opacity: fadeAnim }]}>
                <Text style={styles.tipIcon}>💡</Text>
                <View style={{ flex: 1 }}>
                    <Text style={styles.tipTitle}>Admin Insight</Text>
                    <Text style={styles.tipText}>
                        {completionRate >= 80
                            ? "Great service efficiency today! Your queues are flowing well."
                            : completionRate >= 50
                              ? "Moderate efficiency. Consider adding more staff at peak hours."
                              : "Low completion rate detected. Review staffing or service times."}
                    </Text>
                </View>
            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F8FC",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 58,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        backgroundColor: "#F7F8FC",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
    },
    bgOrbTop: {
        position: "absolute",
        top: -80,
        right: -80,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: "#F59E0B06",
    },
    bgOrbBottom: {
        position: "absolute",
        bottom: 100,
        left: -100,
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: "#A78BFA06",
    },
    loadingText: {
        color: "#64748B",
        fontSize: 14,
        fontWeight: "600",
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 22,
    },
    adminBadge: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: "#1C1408",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#F59E0B30",
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    adminBadgeIcon: {
        fontSize: 26,
    },
    adminTitle: {
        fontSize: 22,
        fontWeight: "900",
        color: "#172033",
    },
    adminSub: {
        color: "#F59E0B",
        fontSize: 13,
        fontWeight: "700",
    },
    logoutBtn: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    logoutText: {
        color: "#64748B",
        fontWeight: "700",
        fontSize: 13,
    },
    statusBanner: {
        backgroundColor: "#052E16",
        borderColor: "#05966940",
        borderWidth: 1,
        borderRadius: 18,
        padding: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        shadowColor: "#34D399",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    statusLeft: {},
    liveIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 6,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#34D399",
    },
    liveDotText: {
        color: "#34D399",
        fontSize: 10,
        fontWeight: "900",
        letterSpacing: 1.5,
    },
    statusBannerTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: "#172033",
        marginBottom: 2,
    },
    statusBannerSub: {
        color: "#059669",
        fontSize: 12,
    },
    statusEmoji: {
        fontSize: 32,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "900",
        color: "#64748B",
        letterSpacing: 2,
        marginBottom: 14,
    },
    metricsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 10,
    },
    metricCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        width: "48%",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderTopWidth: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    metricIcon: {
        fontSize: 22,
        marginBottom: 8,
    },
    metricValue: {
        fontSize: 34,
        fontWeight: "900",
        marginBottom: 5,
        letterSpacing: -0.5,
    },
    metricLabel: {
        fontSize: 12,
        color: "#64748B",
        fontWeight: "700",
    },
    rateCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 16,
    },
    rateHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    rateTitle: {
        fontSize: 10,
        fontWeight: "900",
        color: "#64748B",
        letterSpacing: 2,
    },
    rateValue: {
        fontSize: 22,
        fontWeight: "900",
        color: "#34D399",
    },
    rateBarBg: {
        height: 8,
        backgroundColor: "#E2E8F0",
        borderRadius: 5,
        marginBottom: 10,
        overflow: "hidden",
    },
    rateBarFill: {
        height: "100%",
        backgroundColor: "#34D399",
        borderRadius: 5,
        minWidth: "2%",
    },
    rateDesc: {
        color: "#64748B",
        fontSize: 12,
        fontWeight: "600",
    },
    infoCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    infoLabel: {
        color: "#64748B",
        fontSize: 13,
        fontWeight: "600",
        flex: 1,
    },
    infoValue: {
        color: "#CBD5E1",
        fontWeight: "800",
        fontSize: 14,
    },
    tipBox: {
        backgroundColor: "#F0FDFA",
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: "#0EA5E920",
        flexDirection: "row",
        gap: 14,
        alignItems: "flex-start",
    },
    tipIcon: {
        fontSize: 24,
    },
    tipTitle: {
        color: "#0F766E",
        fontWeight: "800",
        fontSize: 14,
        marginBottom: 4,
    },
    tipText: {
        color: "#64748B",
        fontSize: 13,
        lineHeight: 20,
    },
});
