import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import api from "../services/api";
import { queueItem } from "../utils/sync";

export default function SalesFormScreen() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(s => setIsOnline(s.isConnected));
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!amount) {
      Alert.alert("Xato", "Summa kiritish shart");
      return;
    }
    setSaving(true);
    const data = { amount: parseFloat(amount), description };
    try {
      if (isOnline) {
        await api.post("/api/sales", data);
        Alert.alert("✅ Saqlandi", "Sotuv ma'lumoti yuborildi");
      } else {
        await queueItem("sales", data);
        Alert.alert("📴 Offline saqlandi", "Internet kelganda yuboriladi");
      }
      setAmount("");
      setDescription("");
    } catch {
      await queueItem("sales", data);
      Alert.alert("⚠️ Xato", "Navbatga qo'shildi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={s.page} keyboardShouldPersistTaps="handled">
      <View style={[s.statusBar, { backgroundColor: isOnline ? "#dcfce7" : "#fef3c7" }]}>
        <Text style={{ color: isOnline ? "#166534" : "#92400e", fontWeight: "600" }}>
          {isOnline ? "🟢 Online" : "🟡 Offline rejim"}
        </Text>
      </View>

      <View style={s.form}>
        <Text style={s.label}>Sotuv summasi (so'm) *</Text>
        <TextInput
          style={s.input}
          placeholder="Masalan: 250000"
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={s.label}>Tavsif (ixtiyoriy)</Text>
        <TextInput
          style={[s.input, { height: 100 }]}
          placeholder="Nima sotildi, kimga..."
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnText}>💰 Saqlash</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },
  statusBar: { padding: 12, paddingHorizontal: 16 },
  form: { padding: 20 },
  label: { fontSize: 15, fontWeight: "700", color: "#1e293b", marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  saveBtn: { backgroundColor: "#10b981", padding: 18, borderRadius: 14, alignItems: "center", marginTop: 28 },
  saveBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
