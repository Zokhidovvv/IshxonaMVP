import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import api from "../services/api";
import { queueItem, syncQueue } from "../utils/sync";

export default function ProductionFormScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadData();
    NetInfo.addEventListener(s => setIsOnline(s.isConnected));
  }, []);

  const loadData = async () => {
    try {
      const [w, f] = await Promise.all([
        api.get("/api/workers"),
        api.get("/api/fields?module=production"),
      ]);
      setWorkers(w.data);
      setFields(f.data);
    } catch {
      Alert.alert("Ogohlantrish", "Ma'lumotlar yuklanmadi. Offline rejimda ishlayapsiz.");
    }
  };

  const handleSave = async () => {
    if (!selectedWorker || !quantity) {
      Alert.alert("Xato", "Ishchi va miqdorni tanlang");
      return;
    }
    setSaving(true);
    const data = { worker_id: selectedWorker.id, quantity: parseInt(quantity), notes };

    try {
      if (isOnline) {
        await api.post("/api/production", data);
        Alert.alert("✅ Saqlandi", "Ma'lumot serverga yuborildi");
      } else {
        await queueItem("production", data);
        Alert.alert("📴 Offline saqlandi", "Internet kelganda avtomatik yuboriladi");
      }
      setSelectedWorker(null);
      setQuantity("");
      setNotes("");
    } catch {
      // Server xato — offline navbatga qo'shish
      await queueItem("production", data);
      Alert.alert("⚠️ Xato", "Server bilan ulanishda xato. Navbatga qo'shildi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={s.page} keyboardShouldPersistTaps="handled">
      {/* Holat */}
      <View style={[s.statusBar, { backgroundColor: isOnline ? "#dcfce7" : "#fef3c7" }]}>
        <Text style={{ color: isOnline ? "#166534" : "#92400e", fontWeight: "600" }}>
          {isOnline ? "🟢 Online" : "🟡 Offline — ma'lumotlar saqlandi"}
        </Text>
      </View>

      <View style={s.form}>
        {/* Ishchi tanlash */}
        <Text style={s.label}>Ishchi *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {workers.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={[s.chip, selectedWorker?.id === w.id && s.chipActive]}
              onPress={() => setSelectedWorker(w)}
            >
              <Text style={[s.chipText, selectedWorker?.id === w.id && s.chipTextActive]}>
                {w.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Miqdor */}
        <Text style={s.label}>Mahsulot miqdori *</Text>
        <TextInput
          style={s.input}
          placeholder="Nechta dona?"
          keyboardType="number-pad"
          value={quantity}
          onChangeText={setQuantity}
        />

        {/* Izoh */}
        <Text style={s.label}>Izoh (ixtiyoriy)</Text>
        <TextInput
          style={[s.input, { height: 80 }]}
          placeholder="Qo'shimcha ma'lumot..."
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        {/* Saqlash */}
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnText}>💾 Saqlash</Text>
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
  chipScroll: { marginBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#e2e8f0", marginRight: 8 },
  chipActive: { backgroundColor: "#3b82f6" },
  chipText: { color: "#475569", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  saveBtn: { backgroundColor: "#3b82f6", padding: 18, borderRadius: 14, alignItems: "center", marginTop: 28 },
  saveBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
