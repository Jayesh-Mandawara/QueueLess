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
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Animated,
} from "react-native";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

export default function StaffHomeScreen() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processing, setProcessing] = useState(false);
    const { user, logout } = useContext(AuthContext);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseDot = useRef(new Animated.Value(1)).current;

    const fetchStaffDashboard = useCallback(async () => {
        try {
            const res = await api.get("/queues/staff/dashboard/");
            setDashboardData(res.data);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to load staff dashboard");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStaffDashboard();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseDot, {
                    toValue: 1.5,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseDot, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, [fetchStaffDashboard]);

    const handleCallNext = async (queueId) => {
        setProcessing(true);
        try {
            await api.post(`/queues/staff/${queueId}/call-next/`);
            fetchStaffDashboard();
        } catch (err) {
            Alert.alert(
                "Cannot Call Next",
                err.response?.data?.error || "Action failed",
            );
        } finally {
            setProcessing(false);
        }
    };

    const handleComplete = async (queueId) => {
        setProcessing(true);
        try {
            await api.post(`/queues/staff/${queueId}/complete/`);
            fetchStaffDashboard();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.error || "Action failed");
        } finally {
            setProcessing(false);
        }
    };

    const handleSkip = async (queueId) => {
        setProcessing(true);
        try {
            await api.post(`/queues/staff/${queueId}/skip/`);
            fetchStaffDashboard();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.error || "Action failed");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0F766E" />
                <Text style={styles.loadingText}>Loading dashboard…</Text>
            </View>
        );
    }

    const totalWaiting = (dashboardData?.queues || []).reduce(
        (sum, q) => sum + q.waiting_entries.length,
        0,
    );
    const totalServed = (dashboardData?.queues || []).reduce(
        (sum, q) => sum + q.completed_count,
        0,
    );

    const renderQueueItem = ({ item }) => {
        const serving = item.current_serving;

        return (
            <View style={styles.queueCard}>
                {/* Top indicator bar */}
                <View
                    style={[
                        styles.cardTopBar,
                        serving && styles.cardTopBarServing,
                    ]}
                />

                <View style={styles.queueCardHeader}>
                    <View>
                        <Text style={styles.serviceName}>
                            {item.service_name}
                        </Text>
                        <Text style={styles.queueSubText}>
                            {item.waiting_entries.length} waiting
                        </Text>
                    </View>
                    <View style={styles.servedBadge}>
                        <Text style={styles.servedBadgeText}>
                            ✓ {item.completed_count} Served
                        </Text>
                    </View>
                </View>

                {/* Counter Section */}
                <View
                    style={[
                        styles.counterBox,
                        serving && styles.counterBoxActive,
                    ]}
                >
                    <Text style={styles.counterLabel}>COUNTER STATUS</Text>

                    {serving ? (
                        <View style={styles.servingLayout}>
                            <View style={styles.tokenCircle}>
                                <Text style={styles.tokenCircleLabel}>
                                    TOKEN
                                </Text>
                                <Text style={styles.servingToken}>
                                    #{serving.token_number}
                                </Text>
                            </View>
                            <View style={styles.customerInfo}>
                                <Text style={styles.customerNameLabel}>
                                    CUSTOMER
                                </Text>
                                <Text style={styles.customerName}>
                                    {serving.customer.name}
                                </Text>
                                <View style={styles.servingIndicator}>
                                    <Animated.View
                                        style={[
                                            styles.servingIndicatorDot,
                                            {
                                                transform: [
                                                    { scale: pulseDot },
                                                ],
                                            },
                                        ]}
                                    />
                                    <Text style={styles.servingIndicatorText}>
                                        Currently serving
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.vacantBox}>
                            <Text style={styles.vacantIcon}>🔴</Text>
                            <Text style={styles.vacantText}>
                                Counter is vacant
                            </Text>
                            <Text style={styles.vacantSub}>
                                {item.waiting_entries.length > 0
                                    ? `${item.waiting_entries.length} customer(s) waiting`
                                    : "No customers in queue"}
                            </Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    {serving ? (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    styles.completeBtn,
                                    processing && styles.actionBtnDisabled,
                                ]}
                                onPress={() => handleComplete(item.queue_id)}
                                disabled={processing}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.actionBtnIcon}>✓</Text>
                                <Text style={styles.actionBtnText}>
                                    COMPLETE
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    styles.skipBtn,
                                    processing && styles.actionBtnDisabled,
                                ]}
                                onPress={() => handleSkip(item.queue_id)}
                                disabled={processing}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.actionBtnIcon}>⏭</Text>
                                <Text style={styles.actionBtnText}>SKIP</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.callNextBtn,
                                processing && styles.actionBtnDisabled,
                            ]}
                            onPress={() => handleCallNext(item.queue_id)}
                            disabled={
                                processing || item.waiting_entries.length === 0
                            }
                            activeOpacity={0.85}
                        >
                            {processing ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <View style={styles.callNextInner}>
                                    <Text style={styles.callNextIcon}>📢</Text>
                                    <Text style={styles.callNextText}>
                                        CALL NEXT CUSTOMER
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Waiting List */}
                <View style={styles.waitingSection}>
                    <Text style={styles.waitingHeader}>
                        WAITING QUEUE ({item.waiting_entries.length})
                    </Text>
                    {item.waiting_entries.length === 0 ? (
                        <Text style={styles.emptyWaitingText}>
                            No customers in line — all clear! 🎉
                        </Text>
                    ) : (
                        item.waiting_entries.slice(0, 5).map((w, idx) => (
                            <View
                                key={w.id}
                                style={[
                                    styles.waitingRow,
                                    idx === 0 && styles.waitingRowFirst,
                                ]}
                            >
                                <Text style={styles.waitingPosition}>
                                    #{idx + 1}
                                </Text>
                                <Text style={styles.waitingToken}>
                                    Token #{w.token_number}
                                </Text>
                                <Text
                                    style={styles.waitingName}
                                    numberOfLines={1}
                                >
                                    {w.customer.name}
                                </Text>
                                <View style={styles.waitingTag}>
                                    <Text style={styles.waitingTagText}>
                                        WAITING
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                    {item.waiting_entries.length > 5 && (
                        <Text style={styles.moreWaiting}>
                            +{item.waiting_entries.length - 5} more in queue
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.bgOrb} />

            {/* Top Bar */}
            <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
                <View>
                    <Text style={styles.businessTitle}>
                        {dashboardData?.business_name}
                    </Text>
                    <Text style={styles.staffSubTitle}>
                        Staff Control Console 👨‍⚕️
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

            {/* Quick Stats */}
            <Animated.View style={[styles.quickStats, { opacity: fadeAnim }]}>
                <View style={styles.quickStat}>
                    <Text style={[styles.quickStatNum, { color: "#FBBF24" }]}>
                        {totalWaiting}
                    </Text>
                    <Text style={styles.quickStatLabel}>Waiting</Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                    <Text style={[styles.quickStatNum, { color: "#34D399" }]}>
                        {totalServed}
                    </Text>
                    <Text style={styles.quickStatLabel}>Served Today</Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                    <Text style={[styles.quickStatNum, { color: "#0F766E" }]}>
                        {dashboardData?.queues?.length || 0}
                    </Text>
                    <Text style={styles.quickStatLabel}>Queues</Text>
                </View>
            </Animated.View>

            <FlatList
                data={dashboardData?.queues || []}
                keyExtractor={(item) => item.queue_id.toString()}
                renderItem={renderQueueItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchStaffDashboard();
                        }}
                        tintColor="#0F766E"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyIcon}>🗃️</Text>
                        <Text style={styles.emptyTitle}>
                            No Queues Assigned
                        </Text>
                        <Text style={styles.emptyDesc}>
                            Contact your admin to get assigned to a service
                            queue.
                        </Text>
                    </View>
                }
            />
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
    center: {
        flex: 1,
        backgroundColor: "#F7F8FC",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
    },
    bgOrb: {
        position: "absolute",
        top: -80,
        right: -80,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: "#34D39907",
    },
    loadingText: {
        color: "#64748B",
        fontSize: 14,
        fontWeight: "600",
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
    },
    businessTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: "#172033",
        marginBottom: 3,
    },
    staffSubTitle: {
        color: "#0F766E",
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
    quickStats: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    quickStat: {
        flex: 1,
        alignItems: "center",
    },
    quickStatNum: {
        fontSize: 26,
        fontWeight: "900",
        marginBottom: 3,
    },
    quickStatLabel: {
        color: "#64748B",
        fontSize: 11,
        fontWeight: "700",
    },
    quickStatDivider: {
        width: 1,
        height: 36,
        backgroundColor: "#E2E8F0",
    },
    listContainer: {
        paddingBottom: 40,
    },
    queueCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 20,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        overflow: "hidden",
    },
    cardTopBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: "#E2E8F0",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    cardTopBarServing: {
        backgroundColor: "#34D399",
    },
    queueCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
        marginTop: 4,
    },
    serviceName: {
        fontSize: 20,
        fontWeight: "900",
        color: "#172033",
        marginBottom: 3,
    },
    queueSubText: {
        color: "#64748B",
        fontSize: 13,
        fontWeight: "600",
    },
    servedBadge: {
        backgroundColor: "#052E16",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#05966940",
    },
    servedBadgeText: {
        color: "#34D399",
        fontSize: 12,
        fontWeight: "800",
    },
    counterBox: {
        backgroundColor: "#F8FAFC",
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 18,
    },
    counterBoxActive: {
        borderColor: "#34D39940",
        backgroundColor: "#052E1608",
    },
    counterLabel: {
        fontSize: 10,
        fontWeight: "900",
        color: "#64748B",
        letterSpacing: 2,
        marginBottom: 16,
    },
    servingLayout: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginBottom: 18,
    },
    tokenCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#052E16",
        borderWidth: 2,
        borderColor: "#05966960",
        alignItems: "center",
        justifyContent: "center",
    },
    tokenCircleLabel: {
        fontSize: 8,
        fontWeight: "900",
        color: "#059669",
        letterSpacing: 1,
        marginBottom: 2,
    },
    servingToken: {
        fontSize: 22,
        fontWeight: "900",
        color: "#34D399",
        letterSpacing: -0.5,
    },
    customerInfo: {
        flex: 1,
    },
    customerNameLabel: {
        fontSize: 10,
        fontWeight: "900",
        color: "#64748B",
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    customerName: {
        fontSize: 18,
        fontWeight: "800",
        color: "#172033",
        marginBottom: 8,
    },
    servingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    servingIndicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#34D399",
    },
    servingIndicatorText: {
        color: "#059669",
        fontSize: 12,
        fontWeight: "700",
    },
    vacantBox: {
        alignItems: "center",
        paddingVertical: 12,
        marginBottom: 16,
    },
    vacantIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    vacantText: {
        color: "#64748B",
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 4,
    },
    vacantSub: {
        color: "#94A3B8",
        fontSize: 12,
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
    },
    actionBtnDisabled: {
        opacity: 0.5,
    },
    completeBtn: {
        backgroundColor: "#059669",
        shadowColor: "#059669",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    skipBtn: {
        backgroundColor: "#D97706",
        shadowColor: "#D97706",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    actionBtnIcon: {
        fontSize: 14,
        color: "#FFFFFF",
    },
    actionBtnText: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 13,
        letterSpacing: 0.5,
    },
    callNextBtn: {
        backgroundColor: "#0284C7",
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
        shadowColor: "#0284C7",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    callNextInner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    callNextIcon: {
        fontSize: 16,
    },
    callNextText: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 14,
        letterSpacing: 0.5,
    },
    waitingSection: {
        marginTop: 4,
    },
    waitingHeader: {
        fontSize: 10,
        fontWeight: "900",
        color: "#64748B",
        letterSpacing: 2,
        marginBottom: 12,
    },
    waitingRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        padding: 12,
        borderRadius: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        gap: 10,
    },
    waitingRowFirst: {
        borderColor: "#0284C730",
        backgroundColor: "#F0FDFA",
    },
    waitingPosition: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "900",
        width: 20,
    },
    waitingToken: {
        color: "#0F766E",
        fontWeight: "900",
        fontSize: 14,
        width: 80,
    },
    waitingName: {
        color: "#172033",
        fontWeight: "600",
        fontSize: 13,
        flex: 1,
    },
    waitingTag: {
        backgroundColor: "#E2E8F0",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    waitingTagText: {
        color: "#64748B",
        fontSize: 9,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    emptyWaitingText: {
        color: "#94A3B8",
        fontSize: 13,
        fontStyle: "italic",
    },
    moreWaiting: {
        color: "#0F766E",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 6,
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
