import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert
} from "react-native";
import { useAuth } from "../store/AuthContext";
import { watchAndSync, getQueueCount } from "../utils/sync";

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    // Navbat sonini ko'rsatish
    getQueueCount().then(setQueueCount);

    // Avtomatik sync kuzatuv
    const unsubscribe = watchAndSync((result) => {
      Alert.alert("✅ Sync", `${result.synced} ta yozuv serverga yuborildi`);
      getQueueCount().then(setQueueCount);
    });
    return () => unsubscribe();
  }, []);

  const menuItems = [
    { icon: "📦", title: "Ishlab chiqarish", subtitle: "Mahsulot miqdori kiritish", screen: "ProductionForm", roles: ["admin"] },
    { icon: "💰", title: "Sotuv", subtitle: "Sotuv ma'lumoti kiritish", screen: "SalesForm", roles: ["admin", "sales"] },
    { icon: "👷", title: "Ishchilar", subtitle: "Ishchi ro'yxatini ko'rish", screen: "Workers", roles: ["admin"] },
  ];

  const allowedItems = menuItems.filter(m => m.roles.includes(user?.role));

  return (
    <ScrollView style={s.page}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Salom, {user?.username} 👋</Text>
          <Text style={s.role}>{user?.role?.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      {/* Offline queue badge */}
      {queueCount > 0 && (
        <View style={s.queueBanner}>
          <Text style={s.queueText}>⏳ {queueCount} ta yozuv navbatda (offline)</Text>
        </View>
      )}

      {/* Menu */}
      <Text style={s.sectionLabel}>Tezkor amallar</Text>
      {allowedItems.map((item) => (
        <TouchableOpacity
          key={item.screen}
          style={s.menuCard}
          onPress={() => navigation.navigate(item.screen)}
        >
          <Text style={s.menuIcon}>{item.icon}</Text>
          <View style={s.menuText}>
            <Text style={s.menuTitle}>{item.title}</Text>
            <Text style={s.menuSub}>{item.subtitle}</Text>
          </View>
          <Text style={s.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },
  header: { backgroundColor: "#1e293b", padding: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { color: "#fff", fontSize: 22, fontWeight: "700" },
  role: { color: "#64748b", fontSize: 13, marginTop: 2 },
  logoutBtn: { backgroundColor: "#dc2626", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: "#fff", fontWeight: "600" },
  queueBanner: { backgroundColor: "#fef3c7", margin: 16, padding: 14, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: "#f59e0b" },
  queueText: { color: "#92400e", fontWeight: "600" },
  sectionLabel: { color: "#64748b", fontWeight: "700", fontSize: 13, marginLeft: 16, marginTop: 24, marginBottom: 8, letterSpacing: 1 },
  menuCard: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 12, padding: 20, borderRadius: 14, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  menuIcon: { fontSize: 36, marginRight: 16 },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  menuSub: { color: "#64748b", marginTop: 2 },
  arrow: { fontSize: 24, color: "#94a3b8" },
});
