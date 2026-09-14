import React, { useState, useEffect, useRef } from "react";
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

const NOTIF_ICONS = {
    token: "🎟️",
    queue: "📋",
    serving: "🔔",
    cancelled: "✕",
    completed: "✓",
    default: "💬",
};

function getNotifIcon(title = "") {
    const lower = title.toLowerCase();
    for (const k in NOTIF_ICONS) {
        if (lower.includes(k)) return NOTIF_ICONS[k];
    }
    return NOTIF_ICONS.default;
}

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/notifications/");
            setNotifications(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read/`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
            );
        } catch (e) {
            console.error(e);
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const renderNotifCard = ({ item }) => {
        const icon = getNotifIcon(item.title);
        const timeStr = new Date(item.created_at).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
        const dateStr = new Date(item.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        });

        return (
            <TouchableOpacity
                style={[styles.card, !item.is_read && styles.unreadCard]}
                onPress={() => handleMarkRead(item.id)}
                activeOpacity={0.85}
            >
                {/* Unread glow line */}
                {!item.is_read && <View style={styles.unreadLine} />}

                <View style={styles.cardMain}>
                    <View
                        style={[
                            styles.iconBox,
                            !item.is_read && styles.iconBoxUnread,
                        ]}
                    >
                        <Text style={styles.iconBoxText}>{icon}</Text>
                    </View>

                    <View style={styles.cardContent}>
                        <View style={styles.cardTop}>
                            <Text style={styles.title} numberOfLines={1}>
                                {item.title}
                            </Text>
                            {!item.is_read && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.message} numberOfLines={2}>
                            {item.message}
                        </Text>
                        <View style={styles.timeRow}>
                            <Text style={styles.timeText}>
                                {dateStr} · {timeStr}
                            </Text>
                            {!item.is_read && (
                                <Text style={styles.tapToRead}>
                                    Tap to mark read
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.bgOrb} />

            <Animated.View style={{ opacity: fadeAnim }}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        <Text style={styles.headerSub}>
                            {notifications.length} total messages
                        </Text>
                    </View>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>
                                {unreadCount} new
                            </Text>
                        </View>
                    )}
                </View>
            </Animated.View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#0F766E" />
                    <Text style={styles.loadingText}>
                        Loading notifications…
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderNotifCard}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchNotifications();
                            }}
                            tintColor="#0F766E"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <View style={styles.emptyCircle}>
                                <Text style={styles.emptyIcon}>🔔</Text>
                            </View>
                            <Text style={styles.emptyTitle}>
                                All Caught Up!
                            </Text>
                            <Text style={styles.emptyDesc}>
                                No notifications yet. You'll receive updates
                                when your queue status changes.
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
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "#F59E0B07",
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 22,
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
        fontWeight: "500",
    },
    unreadBadge: {
        backgroundColor: "#0284C7",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: "#0284C7",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    unreadBadgeText: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "800",
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
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    unreadCard: {
        borderColor: "#0284C730",
        backgroundColor: "#F0FDFA",
    },
    unreadLine: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: "#0284C7",
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
    },
    cardMain: {
        flexDirection: "row",
        padding: 16,
        paddingLeft: 20,
        gap: 14,
        alignItems: "flex-start",
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        flexShrink: 0,
    },
    iconBoxUnread: {
        backgroundColor: "#F0FDFA",
        borderColor: "#0284C730",
    },
    iconBoxText: {
        fontSize: 20,
    },
    cardContent: {
        flex: 1,
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 5,
    },
    title: {
        fontSize: 15,
        fontWeight: "800",
        color: "#172033",
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#0F766E",
        marginLeft: 8,
        flexShrink: 0,
    },
    message: {
        color: "#64748B",
        fontSize: 13,
        marginBottom: 8,
        lineHeight: 20,
    },
    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    timeText: {
        color: "#94A3B8",
        fontSize: 11,
        fontWeight: "600",
    },
    tapToRead: {
        color: "#0F766E",
        fontSize: 11,
        fontWeight: "700",
    },
    emptyWrap: {
        alignItems: "center",
        paddingTop: 60,
        gap: 14,
    },
    emptyCircle: {
        width: 90,
        height: 90,
        borderRadius: 28,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    emptyIcon: {
        fontSize: 44,
    },
    emptyTitle: {
        color: "#172033",
        fontSize: 22,
        fontWeight: "900",
    },
    emptyDesc: {
        color: "#64748B",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 22,
        maxWidth: 280,
    },
});
