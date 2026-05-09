import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useState, useEffect, useContext, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Notification } from "@/types/database";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  Users, GitMerge, TrendingUp, Shield, Settings,
  Mail, User, Calendar, Bell, MessageSquare, LucideIcon,
} from "lucide-react-native";

const PRIORITY_COLORS = {
  low: "#94a3b8",
  normal: "#64748b",
  high: "#f59e0b",
  urgent: "#ef4444",
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  connection_request: Users,
  match_suggestion: GitMerge,
  investment_interest: TrendingUp,
  admin_action: Shield,
  system_update: Settings,
  newsletter: Mail,
  profile_update: User,
  meeting_request: Calendar,
  reminder: Bell,
  other: Bell,
  message: MessageSquare,
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
  const IconComponent = TYPE_ICONS[item.type] || Bell;
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
        <IconComponent size={20} color={priorityColor} strokeWidth={1.5} />
      </View>

      <View className={`flex-1 ${isRTL ? "mr-3 ml-0" : ""}`}>
        <View className={`flex-row items-start justify-between mb-0.5 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Text
            className={`font-semibold text-black flex-1 ${isRTL ? "text-right" : "text-left"}`}
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
      <View className={`px-4 pt-3 pb-3 border-b border-slate-100 flex-row items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
        <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
          <Text className={`text-xl font-black text-black ${isRTL ? "mr-0 ml-2" : "mr-2"}`}>
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

      {loading ? (
        <View className="p-4">
          {[1, 2, 3, 4].map((k) => <SkeletonCard key={k} />)}
        </View>
      ) : (
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
            <EmptyState
              icon={Bell}
              title={t("notifications.noNotifications")}
              description={t("notifications.noNotificationsDesc")}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
              <NotificationItem
                item={item}
                onPress={markAsRead}
                isRTL={isRTL}
                t={t}
              />
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
