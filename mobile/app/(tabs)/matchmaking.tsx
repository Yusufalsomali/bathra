import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Matchmaking } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Clock, GitMerge } from "lucide-react-native";

function MatchCard({
  item,
  userId,
  onToggleInterest,
  onOpenDetail,
  isRTL,
  t,
}: {
  item: Matchmaking;
  userId: string;
  onToggleInterest: (id: string, current: boolean) => void;
  onOpenDetail: () => void;
  isRTL: boolean;
  t: (k: string) => string;
}) {
  const isExpired = new Date(item.expiry_date) < new Date();
  const matchedName =
    item.investor_id === userId ? item.startup_name : item.investor_name;
  const matchedEmail =
    item.investor_id === userId ? item.startup_email : item.investor_email;

  return (
    <Card className={`mb-3 ${isExpired ? "opacity-60" : ""}`}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onOpenDetail}
        disabled={isExpired}
        className={`flex-row items-start justify-between mb-3 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <View className={`flex-row items-center flex-1 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Avatar name={matchedName} size={44} />
          <View className={`flex-1 ${isRTL ? "mr-3" : "ml-3"}`}>
            <Text className={`font-bold text-black ${isRTL ? "text-right" : "text-left"}`}>
              {matchedName}
            </Text>
            <Text className={`text-xs text-slate-500 ${isRTL ? "text-right" : "text-left"}`}>
              {matchedEmail}
            </Text>
          </View>
        </View>
        <Badge
          label={item.is_interested ? "Interested" : "Pending"}
          variant={item.is_interested ? "success" : "warning"}
        />
      </TouchableOpacity>

      {item.comment && (
        <View className="bg-slate-50 rounded-xl p-3 mb-3">
          <Text className={`text-xs text-slate-500 mb-1 ${isRTL ? "text-right" : "text-left"}`}>
            {t("matchmaking.matchComment")}
          </Text>
          <Text className={`text-sm text-slate-700 ${isRTL ? "text-right" : "text-left"}`}>
            {item.comment}
          </Text>
        </View>
      )}

      <View className={`flex-row items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
        <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
          <Clock size={14} stroke={isExpired ? "#ef4444" : "#94a3b8"} strokeWidth={1.5} />
          <Text className={`text-xs ml-1 ${isExpired ? "text-red-500" : "text-slate-400"}`}>
            {t("matchmaking.expiresOn")} {new Date(item.expiry_date).toLocaleDateString()}
          </Text>
        </View>

        {!isExpired && !item.is_archived && (
          <TouchableOpacity
            className={`px-3 py-1.5 rounded-lg ${item.is_interested ? "bg-red-50" : "bg-green-50"}`}
            onPress={() => onToggleInterest(item.id, item.is_interested)}
          >
            <Text
              className={`text-xs font-semibold ${item.is_interested ? "text-red-600" : "text-green-600"}`}
            >
              {item.is_interested ? t("matchmaking.notInterested") : t("matchmaking.interested")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

export default function MatchmakingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const openMatchDetail = (item: Matchmaking) => {
    if (!user) return;
    if (user.accountType === "investor") {
      router.push({ pathname: "/(stack)/startup/[id]", params: { id: item.startup_id } });
    } else {
      router.push({ pathname: "/(stack)/investor/[id]", params: { id: item.investor_id } });
    }
  };

  const [matches, setMatches] = useState<Matchmaking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("matchmakings")
        .select("*")
        .or(`investor_id.eq.${user.id},startup_id.eq.${user.id}`)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      setMatches((data as Matchmaking[]) || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleToggleInterest = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from("matchmakings")
        .update({ is_interested: !current } as Record<string, unknown>)
        .eq("id", id);
      if (error) throw error;
      setMatches((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_interested: !current } : m))
      );
    } catch {
      Alert.alert(t("common.error"), t("common.error"));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-100">
        <Text className={`text-xl font-black text-black ${isRTL ? "text-right" : "text-left"}`}>
          {t("matchmaking.title")}
        </Text>
      </View>

      {loading ? (
        <View className="p-4">
          {[1, 2, 3].map((k) => <SkeletonCard key={k} />)}
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchMatches(); }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={GitMerge}
              title={t("matchmaking.noMatches")}
              description={t("matchmaking.noMatchesDesc")}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
              <MatchCard
                item={item}
                userId={user?.id || ""}
                onToggleInterest={handleToggleInterest}
                onOpenDetail={() => openMatchDetail(item)}
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
