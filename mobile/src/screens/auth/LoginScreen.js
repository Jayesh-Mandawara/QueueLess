import React, { useState, useContext, useEffect, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Animated,
    Dimensions,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { C } from "../../theme";

const { width } = Dimensions.get("window");

// ─── Design Tokens ────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const { login } = useContext(AuthContext);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const logoScale = useRef(new Animated.Value(0.7)).current;
    const logoFloat = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Gentle floating animation for logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoFloat, {
                    toValue: -8,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(logoFloat, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(
                "Missing Fields",
                "Please enter your email and password.",
            );
            return;
        }
        setSubmitting(true);
        try {
            await login(email.trim().toLowerCase(), password);
        } catch (err) {
            const msg =
                err.response?.data?.detail ||
                err.response?.data?.non_field_errors?.[0] ||
                "Invalid email or password.";
            Alert.alert("Login Failed", msg);
        } finally {
            setSubmitting(false);
        }
    };

    const fillQuickAcc = (e, p) => {
        setEmail(e);
        setPassword(p);
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Background blobs */}
            <View style={styles.blob1} />
            <View style={styles.blob2} />
            <View style={styles.blob3} />

            {/* Brand */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <Animated.View
                    style={[
                        styles.logoBadge,
                        {
                            transform: [
                                { scale: logoScale },
                                { translateY: logoFloat },
                            ],
                        },
                    ]}
                >
                    <Text style={styles.logoIcon}>⚡</Text>
                    <View style={styles.logoGlow} />
                </Animated.View>
                <Text style={styles.title}>QueueLess</Text>
                <Text style={styles.subtitle}>
                    SMART VIRTUAL QUEUE MANAGEMENT
                </Text>
                <View style={styles.titlePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.titlePillText}>Live & Active</Text>
                </View>
            </Animated.View>

            {/* Main Card */}
            <Animated.View
                style={[
                    styles.card,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <Text style={styles.cardTitle}>Welcome Back 👋</Text>
                <Text style={styles.cardDesc}>
                    Sign in to manage your tokens & track live queues
                </Text>
                <View style={styles.divider} />

                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View
                    style={[
                        styles.inputWrap,
                        focusedField === "email" && styles.inputWrapFocused,
                    ]}
                >
                    <Text style={styles.inputIcon}>📧</Text>
                    <TextInput
                        style={styles.inputField}
                        placeholder="name@example.com"
                        placeholderTextColor={C.textDim}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                    />
                </View>

                <Text style={styles.label}>PASSWORD</Text>
                <View
                    style={[
                        styles.inputWrap,
                        focusedField === "pass" && styles.inputWrapFocused,
                    ]}
                >
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                        style={[styles.inputField, { flex: 1 }]}
                        placeholder="••••••••"
                        placeholderTextColor={C.textDim}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        onFocus={() => setFocusedField("pass")}
                        onBlur={() => setFocusedField(null)}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                    >
                        <Text style={styles.eyeText}>
                            {showPassword ? "👁️" : "🙈"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.btn, submitting && { opacity: 0.7 }]}
                    onPress={handleLogin}
                    disabled={submitting}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <View style={styles.btnInner}>
                            <Text style={styles.btnText}>Sign In</Text>
                            <Text style={styles.btnArrow}>→</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate("Register")}
                    style={styles.linkRow}
                >
                    <Text style={styles.linkText}>
                        New to QueueLess?{" "}
                        <Text style={styles.linkBold}>Create Account</Text>
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Demo Section */}
            <Animated.View style={[styles.demoBox, { opacity: fadeAnim }]}>
                <View style={styles.demoTitleRow}>
                    <View style={styles.demoLine} />
                    <Text style={styles.demoTitle}>🚀 QUICK DEMO ACCESS</Text>
                    <View style={styles.demoLine} />
                </View>

                {[
                    {
                        role: "👤 Customer",
                        email: "rahul@example.com",
                        pass: "customer123",
                        color: C.cyan,
                    },
                    {
                        role: "👨‍⚕️ Staff Counter",
                        email: "staff@abcclinic.com",
                        pass: "staff123",
                        color: C.success,
                    },
                    {
                        role: "👑 Admin Console",
                        email: "admin@queueless.com",
                        pass: "admin123",
                        color: "#F59E0B",
                    },
                ].map((acc, i) => (
                    <TouchableOpacity
                        key={i}
                        style={styles.demoPill}
                        onPress={() => fillQuickAcc(acc.email, acc.pass)}
                        activeOpacity={0.75}
                    >
                        <View
                            style={[
                                styles.demoDot,
                                { backgroundColor: acc.color },
                            ]}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.demoRole}>{acc.role}</Text>
                            <Text style={styles.demoEmail}>{acc.email}</Text>
                        </View>
                        <Text style={[styles.demoFill, { color: acc.color }]}>
                            Fill →
                        </Text>
                    </TouchableOpacity>
                ))}
            </Animated.View>

            <Text style={styles.footer}>© 2025 QueueLess</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { padding: 24, paddingTop: 60, paddingBottom: 40 },

    blob1: {
        position: "absolute",
        top: -100,
        right: -80,
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: "#6366F10C",
    },
    blob2: {
        position: "absolute",
        top: 200,
        left: -120,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: "#22D3EE07",
    },
    blob3: {
        position: "absolute",
        bottom: 100,
        right: -60,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: "#10B98107",
    },

    header: { alignItems: "center", marginBottom: 36 },
    logoBadge: {
        width: 80,
        height: 80,
        borderRadius: 26,
        backgroundColor: "#6366F118",
        borderWidth: 1.5,
        borderColor: "#6366F140",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 14,
    },
    logoGlow: {
        position: "absolute",
        width: 80,
        height: 80,
        borderRadius: 26,
        backgroundColor: "#6366F108",
    },
    logoIcon: { fontSize: 38, zIndex: 1 },
    title: {
        fontSize: 42,
        fontWeight: "900",
        color: C.white,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 11,
        color: C.primaryLight,
        marginTop: 6,
        fontWeight: "700",
        letterSpacing: 1.5,
    },
    titlePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 12,
        backgroundColor: "#10B98112",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "#10B98130",
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: C.success,
    },
    titlePillText: { color: C.success, fontSize: 12, fontWeight: "700" },

    card: {
        backgroundColor: C.card,
        borderRadius: 28,
        padding: 28,
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 20,
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: C.white,
        marginBottom: 6,
    },
    cardDesc: { fontSize: 13, color: C.textMuted, lineHeight: 20 },
    divider: { height: 1, backgroundColor: C.border, marginVertical: 20 },

    label: {
        fontSize: 10,
        fontWeight: "800",
        color: C.primaryLight,
        letterSpacing: 1.8,
        marginBottom: 8,
        marginTop: 12,
    },
    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.cardDeep,
        borderColor: C.border,
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 14,
    },
    inputWrapFocused: {
        borderColor: C.primary,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    inputIcon: { fontSize: 16, marginRight: 10 },
    inputField: { flex: 1, paddingVertical: 16, color: C.white, fontSize: 15 },
    eyeBtn: { paddingLeft: 10, paddingVertical: 10 },
    eyeText: { fontSize: 18 },

    btn: {
        backgroundColor: C.primary,
        paddingVertical: 17,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 28,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 10,
    },
    btnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
    btnText: {
        color: "#FFFFFF",
        fontWeight: "800",
        fontSize: 16,
        letterSpacing: 0.5,
    },
    btnArrow: { color: "#FFFFFF", fontWeight: "900", fontSize: 18 },

    linkRow: { alignItems: "center", marginTop: 20 },
    linkText: { color: C.textMuted, fontSize: 14 },
    linkBold: { color: C.primaryLight, fontWeight: "700" },

    demoBox: {
        backgroundColor: C.cardDeep,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 24,
    },
    demoTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 10,
    },
    demoLine: { flex: 1, height: 1, backgroundColor: C.border },
    demoTitle: {
        fontSize: 10,
        fontWeight: "800",
        color: C.textMuted,
        textTransform: "uppercase",
        letterSpacing: 1.5,
    },
    demoPill: {
        backgroundColor: C.card,
        padding: 14,
        borderRadius: 14,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: C.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    demoDot: { width: 10, height: 10, borderRadius: 5 },
    demoRole: { color: C.text, fontSize: 14, fontWeight: "700" },
    demoEmail: { color: C.textDim, fontSize: 11, marginTop: 2 },
    demoFill: { fontWeight: "700", fontSize: 12 },

    footer: { textAlign: "center", color: C.border, fontSize: 11 },
});
