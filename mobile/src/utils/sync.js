import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import api from "../services/api";

const QUEUE_KEY = "offline_queue";

// Offline bo'lganda navbatga qo'shish
export async function queueItem(type, data) {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  queue.push({ type, data, timestamp: Date.now() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Navbat hajmini qaytarish
export async function getQueueCount() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  return queue.length;
}

// Internet kelganda yuborish
export async function syncQueue(onProgress) {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { synced: 0, failed: 0 };

  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  const failed = [];

  for (const item of queue) {
    try {
      if (item.type === "production") {
        await api.post("/api/production", item.data);
      } else if (item.type === "sales") {
        await api.post("/api/sales", item.data);
      }
      synced++;
      if (onProgress) onProgress(synced, queue.length);
    } catch {
      failed.push(item);
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
  return { synced, failed: failed.length };
}

// Internetni kuzatib, avtomatik sync
export function watchAndSync(callback) {
  return NetInfo.addEventListener(async (state) => {
    if (state.isConnected) {
      const result = await syncQueue();
      if (result.synced > 0 && callback) callback(result);
    }
  });
}
