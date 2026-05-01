import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from "react-native";
import { useAuth } from "../store/AuthContext";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Xato", "Login va parolni kiriting");
      return;
    }
    setLoading(true);
    try {
      const role = await login(username, password);
      if (role === "boss") {
        navigation.replace("BossDashboard");
      } else {
        navigation.replace("Home");
      }
    } catch {
      Alert.alert("Xato", "Login yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.card}>
        <Text style={s.emoji}>🏭</Text>
        <Text style={s.title}>Zavod Tizimi</Text>
        <Text style={s.subtitle}>Hisobingizga kiring</Text>

        <TextInput
          style={s.input}
          placeholder="Login"
          placeholderTextColor="#94a3b8"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={s.input}
          placeholder="Parol"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Kirish</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", padding: 24 },
  card: { backgroundColor: "#1e293b", borderRadius: 20, padding: 32 },
  emoji: { fontSize: 48, textAlign: "center", marginBottom: 12 },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", textAlign: "center" },
  subtitle: { color: "#64748b", textAlign: "center", marginBottom: 28, marginTop: 4 },
  input: {
    backgroundColor: "#0f172a", color: "#fff", padding: 16,
    borderRadius: 12, marginBottom: 14, fontSize: 16,
    borderWidth: 1, borderColor: "#334155"
  },
  btn: { backgroundColor: "#3b82f6", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 17 },
});
