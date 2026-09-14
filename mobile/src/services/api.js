import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace with your machine's local IP or localhost (10.0.2.2 for Android emulator)
export const BASE_URL = "https://queueless-hz3s.onrender.com/api";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

export default api;
