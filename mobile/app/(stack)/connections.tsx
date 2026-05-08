import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { InvestorStartupConnection } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Badge, statusToBadgeVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ChevronRight, Users } from "lucide-react-native";

function ConnectionCard({
  item,
  userId,
  isRTL,
  t,
  onViewProfile,
}: {
  item: InvestorStartupConnection;
  userId: string;
  isRTL: boolean;
  t: (k: string) => string;
  onViewProfile: () => void;
}) {
  const isInvestor = item.investor_id === userId;
  const otherName = isInvestor ? item.startup_name : item.investor_name;
  const otherEmail = isInvestor ? item.startup_email : item.investor_email;

  return (
    <TouchableOpacity onPress={onViewProfile} activeOpacity={0.8}>
      <Card className="mb-3">
        <View className={`flex-row items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
          <View className={`flex-row items-center flex-1 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Avatar name={otherName} size={44} />
            <View className={`flex-1 ${isRTL ? "mr-3" : "ml-3"}`}>
              <Text className={`font-bold text-slate-900 ${isRTL ? "text-right" : "text-left"}`}>
                {otherName}
              </Text>
              <Text className={`text-xs text-slate-500 ${isRTL ? "text-right" : "text-left"}`}>
                {otherEmail}
              </Text>
            </View>
          </View>
          <ChevronRight size={16} stroke="#94a3b8" strokeWidth={1.5} />
        </View>

        <View className={`flex-row items-center justify-between mt-3 pt-3 border-t border-slate-50 ${isRTL ? "flex-row-reverse" : ""}`}>
          <View className={`flex-row gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Badge
              label={t(`connections.${item.connection_type}`)}
              variant={item.connection_type === "interested" ? "success" : "info"}
            />
            <Badge
              label={t(`connections.${item.status}`)}
              variant={statusToBadgeVariant(item.status)}
            />
          </View>
          <Text className="text-xs text-slate-400">
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function ConnectionsScreen() {
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();
  const router = useRouter();

  const [connections, setConnections] = useState<InvestorStartupConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("investor_startup_connections")
        .select("*")
        .or(`investor_id.eq.${user.id},startup_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      setConnections((data as InvestorStartupConnection[]) || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleViewProfile = (item: InvestorStartupConnection) => {
    if (!user) return;
    const isInvestorUser = item.investor_id === user.id;
    if (isInvestorUser) {
      router.push({ pathname: "/(stack)/startup/[id]", params: { id: item.startup_id } });
    } else {
      router.push({ pathname: "/(stack)/investor/[id]", params: { id: item.investor_id } });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {loading ? (
        <View className="p-4">
          {[1, 2, 3].map((k) => <SkeletonCard key={k} />)}
        </View>
      ) : (
        <FlatList
          data={connections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchConnections(); }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Users}
              title={t("connections.noConnections")}
              description={t("connections.noConnectionsDesc")}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
              <ConnectionCard
                item={item}
                userId={user?.id || ""}
                isRTL={isRTL}
                t={t}
                onViewProfile={() => handleViewProfile(item)}
              />
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
