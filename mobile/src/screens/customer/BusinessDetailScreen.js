import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Animated,
} from "react-native";
import api from "../../services/api";

const SERVICE_ICONS = ["🩺", "💉", "🦷", "👁️", "🧬", "💊", "🩻", "🩹"];

export default function BusinessDetailScreen({ route, navigation }) {
    const { business } = route.params;
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        fetchServices();
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
    }, []);

    const fetchServices = async () => {
        try {
            const res = await api.get(`/businesses/${business.id}/services/`);
            setServices(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectService = (service) => {
        navigation.navigate("QueuePreview", { service, business });
    };

    const renderServiceCard = ({ item, index }) => {
        const icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
        return (
            <TouchableOpacity
                style={styles.serviceCard}
                activeOpacity={0.85}
                onPress={() => handleSelectService(item)}
            >
                <View style={styles.serviceLeft}>
                    <View style={styles.serviceIconBox}>
                        <Text style={styles.serviceIconText}>{icon}</Text>
                    </View>
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{item.name}</Text>
                        <Text style={styles.serviceDesc} numberOfLines={1}>
                            {item.description}
                        </Text>
                        <View style={styles.timeChip}>
                            <Text style={styles.timeChipText}>
                                ⏱️ ~{item.average_service_time} min avg
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={styles.viewQueueBtn}>
                    <Text style={styles.viewQueueText}>Queue →</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.bgOrbTop} />

            {/* Header */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    activeOpacity={0.8}
                >
                    <Text style={styles.backArrow}>←</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <View style={styles.businessBanner}>
                    <View style={styles.businessIconBig}>
                        <Text style={styles.businessIconBigText}>🏥</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={styles.businessTitle}>
                            {business.name}
                        </Text>
                        <Text style={styles.businessAddress}>
                            📍 {business.address}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.infoChip}>
                        <Text style={styles.infoChipText}>
                            ⏰ {business.opening_time || "09:00"} –{" "}
                            {business.closing_time || "17:00"}
                        </Text>
                    </View>
                    <View style={[styles.infoChip, styles.openChip]}>
                        <View style={styles.openDot} />
                        <Text style={styles.openText}>OPEN NOW</Text>
                    </View>
                </View>
            </Animated.View>

            {/* Services Section */}
            <Animated.View style={[styles.sectionRow, { opacity: fadeAnim }]}>
                <Text style={styles.sectionTitle}>AVAILABLE SERVICES</Text>
                <Text style={styles.sectionCount}>{services.length} found</Text>
            </Animated.View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#0F766E" />
                    <Text style={styles.loadingText}>Loading services…</Text>
                </View>
            ) : (
                <FlatList
                    data={services}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderServiceCard}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyIcon}>🔍</Text>
                            <Text style={styles.emptyTitle}>
                                No Services Found
                            </Text>
                            <Text style={styles.emptyDesc}>
                                This clinic hasn't set up any services yet.
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
        paddingTop: 54,
    },
    bgOrbTop: {
        position: "absolute",
        top: -60,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "#0EA5A40B",
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    backBtn: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        gap: 6,
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
    businessBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    businessIconBig: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: "#F0FDFA",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#0EA5A430",
    },
    businessIconBigText: {
        fontSize: 28,
    },
    businessTitle: {
        fontSize: 20,
        fontWeight: "900",
        color: "#172033",
        marginBottom: 4,
    },
    businessAddress: {
        color: "#64748B",
        fontSize: 12,
    },
    infoRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
    },
    infoChip: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    infoChipText: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "600",
    },
    openChip: {
        borderColor: "#05966940",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    openDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#34D399",
    },
    openText: {
        color: "#34D399",
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    sectionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 12,
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
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    serviceCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    serviceLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    serviceIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginRight: 14,
    },
    serviceIconText: {
        fontSize: 24,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: "800",
        color: "#172033",
        marginBottom: 3,
    },
    serviceDesc: {
        color: "#64748B",
        fontSize: 12,
        marginBottom: 8,
    },
    timeChip: {
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: "flex-start",
        borderWidth: 1,
        borderColor: "#0EA5A430",
    },
    timeChipText: {
        color: "#0F766E",
        fontSize: 11,
        fontWeight: "600",
    },
    viewQueueBtn: {
        backgroundColor: "#0F766E16",
        borderWidth: 1,
        borderColor: "#0F766E40",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        marginLeft: 10,
    },
    viewQueueText: {
        color: "#0F766E",
        fontWeight: "800",
        fontSize: 13,
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
