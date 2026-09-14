import React, { useState, useContext, useRef, useEffect } from "react";
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
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { C } from "../../theme";

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [focused, setFocused] = useState(null);
    const { register, login } = useContext(AuthContext);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert("Missing Fields", "Please fill in all fields.");
            return;
        }
        if (password.length < 6) {
            Alert.alert(
                "Weak Password",
                "Password must be at least 6 characters.",
            );
            return;
        }
        setSubmitting(true);
        try {
            const cleanEmail = email.trim().toLowerCase();
            await register(name.trim(), cleanEmail, password);
            await login(cleanEmail, password);
        } catch (err) {
            const errors = err.response?.data;
            let msg = "Registration failed";
            if (errors?.email) msg = `Email: ${errors.email.join(", ")}`;
            else if (errors?.password)
                msg = `Password: ${errors.password.join(", ")}`;
            else if (errors?.name) msg = `Name: ${errors.name.join(", ")}`;
            else if (typeof errors === "string") msg = errors;
            Alert.alert("Registration Error", msg);
        } finally {
            setSubmitting(false);
        }
    };

    const strengthLevel =
        password.length === 0
            ? 0
            : password.length < 4
              ? 1
              : password.length < 8
                ? 2
                : 3;
    const strengthColors = ["#1D3A6B", "#F43F5E", "#F59E0B", "#10B981"];
    const strengthLabels = ["", "Weak", "Good", "Strong"];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.blob1} />
            <View style={styles.blob2} />

            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <View style={styles.iconBadge}>
                    <Text style={styles.iconText}>✨</Text>
                </View>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                    Join QueueLess — skip the wait
                </Text>
            </Animated.View>

            <Animated.View
                style={[
                    styles.card,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                {/* Steps indicator */}
                <View style={styles.stepsRow}>
                    {["Info", "Password", "Done"].map((s, i) => (
                        <View key={i} style={styles.stepItem}>
                            <View
                                style={[
                                    styles.stepCircle,
                                    i < 2 && styles.stepCircleActive,
                                ]}
                            >
                                <Text style={styles.stepNum}>{i + 1}</Text>
                            </View>
                            <Text style={styles.stepLabel}>{s}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.divider} />

                {/* Name */}
                <Text style={styles.label}>FULL NAME</Text>
                <View
                    style={[
                        styles.inputWrap,
                        focused === "name" && styles.inputFocused,
                    ]}
                >
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                        style={styles.inputField}
                        placeholder="John Doe"
                        placeholderTextColor={C.textDim}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        onFocus={() => setFocused("name")}
                        onBlur={() => setFocused(null)}
                    />
                </View>

                {/* Email */}
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View
                    style={[
                        styles.inputWrap,
                        focused === "email" && styles.inputFocused,
                    ]}
                >
                    <Text style={styles.inputIcon}>📧</Text>
                    <TextInput
                        style={styles.inputField}
                        placeholder="your@email.com"
                        placeholderTextColor={C.textDim}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onFocus={() => setFocused("email")}
                        onBlur={() => setFocused(null)}
                    />
                </View>

                {/* Password */}
                <Text style={styles.label}>PASSWORD</Text>
                <View
                    style={[
                        styles.inputWrap,
                        focused === "pass" && styles.inputFocused,
                    ]}
                >
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                        style={[styles.inputField, { flex: 1 }]}
                        placeholder="min. 6 characters"
                        placeholderTextColor={C.textDim}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        onFocus={() => setFocused("pass")}
                        onBlur={() => setFocused(null)}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                    >
                        <Text>{showPassword ? "👁️" : "🙈"}</Text>
                    </TouchableOpacity>
                </View>

                {password.length > 0 && (
                    <View style={styles.strengthRow}>
                        {[1, 2, 3].map((i) => (
                            <View
                                key={i}
                                style={[
                                    styles.strengthBar,
                                    i <= strengthLevel && {
                                        backgroundColor:
                                            strengthColors[strengthLevel],
                                    },
                                ]}
                            />
                        ))}
                        <Text
                            style={[
                                styles.strengthLabel,
                                { color: strengthColors[strengthLevel] },
                            ]}
                        >
                            {strengthLabels[strengthLevel]}
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.btn,
                        { backgroundColor: C.primary },
                        submitting && { opacity: 0.7 },
                    ]}
                    onPress={handleRegister}
                    disabled={submitting}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <View
                            style={{
                                flexDirection: "row",
                                gap: 10,
                                alignItems: "center",
                            }}
                        >
                            <Text style={styles.btnText}>Create Account</Text>
                            <Text style={{ color: "#FFF", fontSize: 16 }}>
                                ✓
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate("Login")}
                    style={styles.linkRow}
                >
                    <Text style={styles.linkText}>
                        Already registered?{" "}
                        <Text style={styles.linkBold}>Sign In</Text>
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            <Text style={styles.footer}>
                By registering, you agree to our Terms of Service
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
    blob1: {
        position: "absolute",
        top: -80,
        left: -80,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: "#6366F10A",
    },
    blob2: {
        position: "absolute",
        bottom: 50,
        right: -80,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: "#22D3EE07",
    },

    header: { alignItems: "center", marginBottom: 28 },
    iconBadge: {
        width: 76,
        height: 76,
        borderRadius: 24,
        backgroundColor: "#6366F118",
        borderWidth: 1.5,
        borderColor: "#6366F140",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    iconText: { fontSize: 36 },
    title: { fontSize: 36, fontWeight: "900", color: C.white },
    subtitle: { fontSize: 13, color: C.textMuted, marginTop: 6 },

    card: {
        backgroundColor: C.card,
        borderRadius: 28,
        padding: 28,
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.35,
        shadowRadius: 22,
        elevation: 18,
        marginBottom: 20,
    },
    stepsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    stepItem: { alignItems: "center", flex: 1 },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: C.cardDeep,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
        borderWidth: 1,
        borderColor: C.border,
    },
    stepCircleActive: { backgroundColor: "#6366F120", borderColor: C.primary },
    stepNum: { color: C.primaryLight, fontSize: 12, fontWeight: "800" },
    stepLabel: { color: C.textDim, fontSize: 10, fontWeight: "600" },
    divider: { height: 1, backgroundColor: C.border, marginVertical: 20 },

    label: {
        fontSize: 10,
        fontWeight: "800",
        color: C.primaryLight,
        letterSpacing: 1.8,
        marginBottom: 8,
        marginTop: 14,
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
    inputFocused: {
        borderColor: C.primary,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    inputIcon: { fontSize: 16, marginRight: 10 },
    inputField: { flex: 1, paddingVertical: 16, color: C.white, fontSize: 15 },
    eyeBtn: { paddingLeft: 10, paddingVertical: 10 },

    strengthRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        gap: 6,
    },
    strengthBar: {
        flex: 1,
        height: 3,
        backgroundColor: C.border,
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 11,
        fontWeight: "700",
        width: 46,
        textAlign: "right",
    },

    btn: {
        paddingVertical: 17,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 28,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 10,
    },
    btnText: {
        color: "#FFFFFF",
        fontWeight: "800",
        fontSize: 16,
        letterSpacing: 0.5,
    },

    linkRow: { alignItems: "center", marginTop: 20 },
    linkText: { color: C.textMuted, fontSize: 14 },
    linkBold: { color: C.primaryLight, fontWeight: "700" },

    footer: {
        textAlign: "center",
        color: C.textDim,
        fontSize: 11,
        marginTop: 4,
    },
});
