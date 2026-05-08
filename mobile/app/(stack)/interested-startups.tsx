import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Startup } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronRight, ChevronLeft, Star, Calendar, Compass } from "lucide-react-native";

interface Connection {
  id: string;
  startup_id: string;
  created_at: string;
}

export default function InterestedStartupsScreen() {
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();
  const router = useRouter();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: conns } = await supabase
        .from("investor_startup_connections")
        .select("id,startup_id,created_at")
        .eq("investor_id", user.id)
        .eq("connection_type", "interested")
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      const connList = (conns || []) as Connection[];
      setConnections(connList);

      if (connList.length > 0) {
        const ids = connList.map((c) => c.startup_id);
        const { data: startupsData } = await supabase
          .from("startups")
          .select("*")
          .in("id", ids);
        setStartups((startupsData as Startup[]) || []);
      } else {
        setStartups([]);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemove = async (connectionId: string, startupId: string) => {
    Alert.alert(
      t("interestedStartups.removeInterest"),
      "Remove your interest in this startup?",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("interestedStartups.removeInterest"),
          style: "destructive",
          onPress: async () => {
            try {
              await supabase
                .from("investor_startup_connections")
                .update({ status: "archived" } as Record<string, unknown>)
                .eq("id", connectionId);
              setConnections((prev) => prev.filter((c) => c.id !== connectionId));
              setStartups((prev) => prev.filter((s) => s.id !== startupId));
            } catch {
              Alert.alert(t("common.error"), t("common.error"));
            }
          },
        },
      ]
    );
  };

  const getConnectionDate = (startupId: string) => {
    const conn = connections.find((c) => c.startup_id === startupId);
    return conn ? new Date(conn.created_at).toLocaleDateString() : "";
  };

  const getConnectionId = (startupId: string) =>
    connections.find((c) => c.startup_id === startupId)?.id || "";

  const thisMonthCount = connections.filter(
    (c) =>
      new Date(c.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
  ).length;

  const uniqueIndustries = new Set(startups.map((s) => s.industry)).size;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-4 pt-2 pb-2 border-b border-slate-100">
        <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
          <TouchableOpacity onPress={() => router.back()} className="mr-3" activeOpacity={0.7}>
            {isRTL ? <ChevronRight size={24} stroke="#000000" strokeWidth={1.5} /> : <ChevronLeft size={24} stroke="#000000" strokeWidth={1.5} />}
          </TouchableOpacity>
          <Text className={`text-lg font-black text-black flex-1 ${isRTL ? "text-right" : "text-left"}`}>
            {t("interestedStartups.title")}
          </Text>
        </View>
      </View>

      <FlatList
        data={startups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
          />
        }
        ListHeaderComponent={
          connections.length > 0 ? (
            <Card className="mb-4">
              <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                {t("interestedStartups.summary")}
              </Text>
              <View className="flex-row">
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-black text-blue-600">{connections.length}</Text>
                  <Text className="text-xs text-slate-500 text-center mt-0.5">{t("interestedStartups.totalInterested")}</Text>
                </View>
                <View className="flex-1 items-center border-x border-slate-100">
                  <Text className="text-2xl font-black text-green-600">{uniqueIndustries}</Text>
                  <Text className="text-xs text-slate-500 text-center mt-0.5">{t("interestedStartups.industries")}</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-black text-purple-600">{thisMonthCount}</Text>
                  <Text className="text-xs text-slate-500 text-center mt-0.5">{t("interestedStartups.thisMonth")}</Text>
                </View>
              </View>
            </Card>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon={Star}
              title={t("interestedStartups.noStartups")}
              description={t("interestedStartups.noStartupsDesc")}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Card className="mb-3">
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: "/(stack)/startup/[id]", params: { id: item.id } })
              }
              activeOpacity={0.8}
            >
              <View className={`flex-row items-center mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Avatar name={item.startup_name || item.name} uri={item.logo} size={44} />
                <View className={`flex-1 ${isRTL ? "mr-3 items-end" : "ml-3"}`}>
                  <Text className="font-bold text-black">{item.startup_name || item.name}</Text>
                  <View className="flex-row gap-1 mt-1">
                    {item.stage && <Badge label={item.stage} variant="info" />}
                    <Badge label={item.industry} variant="default" />
                  </View>
                </View>
                <Star size={18} stroke="#f59e0b" strokeWidth={1.5} />
              </View>

              {item.problem_solving && (
                <Text className={`text-sm text-slate-500 mb-2 leading-5 ${isRTL ? "text-right" : "text-left"}`} numberOfLines={2}>
                  {item.problem_solving}
                </Text>
              )}

              <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                <Calendar size={13} stroke="#94a3b8" strokeWidth={1.5} />
                <Text className="text-xs text-slate-400 ml-1">
                  {t("interestedStartups.interestedOn")} {getConnectionDate(item.id)}
                </Text>
              </View>
            </TouchableOpacity>

            <View className={`flex-row gap-2 mt-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <TouchableOpacity
                className="flex-1 bg-black rounded-xl py-2.5 items-center"
                onPress={() =>
                  router.push({ pathname: "/(stack)/startup/[id]", params: { id: item.id } })
                }
                activeOpacity={0.8}
              >
                <Text className="text-white text-xs font-semibold">View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 border border-red-200 rounded-xl py-2.5 items-center"
                onPress={() => handleRemove(getConnectionId(item.id), item.id)}
                activeOpacity={0.8}
              >
                <Text className="text-red-500 text-xs font-semibold">{t("interestedStartups.removeInterest")}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
