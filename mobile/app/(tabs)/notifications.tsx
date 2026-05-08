import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useState, useEffect, useContext, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Notification } from "@/types/database";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Ionicons } from "@expo/vector-icons";

const PRIORITY_COLORS = {
  low: "#94a3b8",
  normal: "#64748b",
  high: "#f59e0b",
  urgent: "#ef4444",
};

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  connection_request: "people-outline",
  match_suggestion: "git-merge-outline",
  investment_interest: "trending-up-outline",
  admin_action: "shield-outline",
  system_update: "settings-outline",
  newsletter: "mail-outline",
  profile_update: "person-outline",
  meeting_request: "calendar-outline",
  reminder: "alarm-outline",
  other: "notifications-outline",
  message: "chatbubble-outline",
};

function NotificationItem({
  item,
  onPress,
  isRTL,
  t,
}: {
  item: Notification;
  onPress: (id: string) => void;
  isRTL: boolean;
  t: (k: string) => string;
}) {
  const icon = TYPE_ICONS[item.type] || "notifications-outline";
  const priorityColor = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.normal;

  return (
    <TouchableOpacity
      onPress={() => !item.is_read && onPress(item.id)}
      activeOpacity={item.is_read ? 1 : 0.8}
      className={`flex-row px-4 py-4 border-b border-slate-50 ${item.is_read ? "bg-white" : "bg-blue-50/30"} ${isRTL ? "flex-row-reverse" : ""}`}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${priorityColor}15` }}
      >
        <Ionicons name={icon} size={20} color={priorityColor} />
      </View>

      <View className={`flex-1 ${isRTL ? "mr-3 ml-0" : ""}`}>
        <View className={`flex-row items-start justify-between mb-0.5 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Text
            className={`font-semibold text-slate-900 flex-1 ${isRTL ? "text-right" : "text-left"}`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!item.is_read && (
            <View className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 ml-2" />
          )}
        </View>
        <Text
          className={`text-sm text-slate-500 leading-4 ${isRTL ? "text-right" : "text-left"}`}
          numberOfLines={2}
        >
          {item.content}
        </Text>
        <Text className={`text-xs text-slate-400 mt-1.5 ${isRTL ? "text-right" : "text-left"}`}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      const notifs = (data as Notification[]) || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.is_read).length);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className={`px-4 pt-14 pb-4 border-b border-slate-100 flex-row items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
        <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
          <Text className={`text-2xl font-black text-slate-900 ${isRTL ? "mr-0 ml-2" : "mr-2"}`}>
            {t("notifications.title")}
          </Text>
          {unreadCount > 0 && (
            <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text className="text-sm text-blue-600 font-medium">{t("notifications.markAllRead")}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="notifications-outline"
              title={t("notifications.noNotifications")}
              description={t("notifications.noNotificationsDesc")}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <NotificationItem
            item={item}
            onPress={markAsRead}
            isRTL={isRTL}
            t={t}
          />
        )}
      />
    </SafeAreaView>
  );
}
