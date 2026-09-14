import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Animated,
} from "react-native";
import api from "../../services/api";

const STATUS_CONFIG = {
    COMPLETED: {
        bg: "#052E16",
        color: "#34D399",
        border: "#05966940",
        icon: "✓",
        label: "Completed",
    },
    CANCELLED: {
        bg: "#450A0A",
        color: "#F87171",
        border: "#7F1D1D40",
        icon: "✕",
        label: "Cancelled",
    },
    SKIPPED: {
        bg: "#451A03",
        color: "#FBBF24",
        border: "#92400E40",
        icon: "⏭",
        label: "Skipped",
    },
    SERVING: {
        bg: "#F0FDFA",
        color: "#0F766E",
        border: "#0F766E40",
        icon: "🔔",
        label: "Serving",
    },
    WAITING: {
        bg: "#1A0A28",
        color: "#A78BFA",
        border: "#6D28D940",
        icon: "⏳",
        label: "Waiting",
    },
};

export default function QueueHistoryScreen() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchHistory = async () => {
        try {
            const res = await api.get("/queues/my/history/");
            setHistory(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const getStatusConfig = (status) =>
        STATUS_CONFIG[status] || STATUS_CONFIG.WAITING;

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderHistoryCard = ({ item, index }) => {
        const cfg = getStatusConfig(item.status);
        const dateStr = formatDate(item.joined_at);
        const timeStr = formatTime(item.joined_at);

        return (
            <View style={styles.card}>
                {/* Left accent stripe */}
                <View
                    style={[styles.cardStripe, { backgroundColor: cfg.color }]}
                />

                <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.businessName}>
                                {item.business_name}
                            </Text>
                            <Text style={styles.serviceName}>
                                {item.service_name}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor: cfg.bg,
                                    borderColor: cfg.border,
                                },
                            ]}
                        >
                            <Text style={styles.statusIcon}>{cfg.icon}</Text>
                            <Text
                                style={[
                                    styles.statusText,
                                    { color: cfg.color },
                                ]}
                            >
                                {cfg.label}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.cardBottom}>
                        <View style={styles.tokenChip}>
                            <Text style={styles.tokenChipText}>
                                Token #{item.token_number}
                            </Text>
                        </View>
                        <View style={styles.dateChip}>
                            <Text style={styles.dateText}>{dateStr}</Text>
                            <Text style={styles.timeText}>· {timeStr}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const completedCount = history.filter(
        (h) => h.status === "COMPLETED",
    ).length;
    const cancelledCount = history.filter(
        (h) => h.status === "CANCELLED",
    ).length;

    return (
        <View style={styles.container}>
            <View style={styles.bgOrb} />

            <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={styles.headerTitle}>Queue History</Text>
                <Text style={styles.headerSub}>
                    {history.length} total visits
                </Text>

                {/* Stats Row */}
                {history.length > 0 && (
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text
                                style={[styles.statNum, { color: "#34D399" }]}
                            >
                                {completedCount}
                            </Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text
                                style={[styles.statNum, { color: "#F87171" }]}
                            >
                                {cancelledCount}
                            </Text>
                            <Text style={styles.statLabel}>Cancelled</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text
                                style={[styles.statNum, { color: "#0F766E" }]}
                            >
                                {history.length -
                                    completedCount -
                                    cancelledCount}
                            </Text>
                            <Text style={styles.statLabel}>Other</Text>
                        </View>
                    </View>
                )}
            </Animated.View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#0F766E" />
                    <Text style={styles.loadingText}>Fetching history…</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderHistoryCard}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchHistory();
                            }}
                            tintColor="#0F766E"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyIcon}>📋</Text>
                            <Text style={styles.emptyTitle}>
                                No History Yet
                            </Text>
                            <Text style={styles.emptyDesc}>
                                Your past queue visits will appear here once you
                                start using services.
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
        top: -60,
        left: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "#0F766E0B",
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: "900",
        color: "#172033",
        marginBottom: 4,
    },
    headerSub: {
        color: "#64748B",
        fontSize: 13,
        marginBottom: 20,
        fontWeight: "500",
    },
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 22,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    statNum: {
        fontSize: 22,
        fontWeight: "900",
        marginBottom: 2,
    },
    statLabel: {
        color: "#64748B",
        fontSize: 11,
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
        borderRadius: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        flexDirection: "row",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    cardStripe: {
        width: 4,
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
        opacity: 0.8,
    },
    cardBody: {
        flex: 1,
        padding: 16,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    businessName: {
        fontSize: 12,
        fontWeight: "800",
        color: "#0F766E",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    serviceName: {
        fontSize: 17,
        fontWeight: "800",
        color: "#172033",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        gap: 5,
        marginLeft: 10,
    },
    statusIcon: {
        fontSize: 11,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "800",
    },
    cardDivider: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginBottom: 12,
    },
    cardBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    tokenChip: {
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    tokenChipText: {
        color: "#CBD5E1",
        fontSize: 12,
        fontWeight: "700",
    },
    dateChip: {
        flexDirection: "row",
        alignItems: "center",
    },
    dateText: {
        color: "#64748B",
        fontSize: 12,
        fontWeight: "600",
    },
    timeText: {
        color: "#94A3B8",
        fontSize: 11,
        marginLeft: 2,
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
        lineHeight: 22,
        maxWidth: 280,
    },
});
