import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Startup, Investor, Matchmaking, InvestorStartupConnection } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Ionicons } from "@expo/vector-icons";

interface DashboardStats {
  connections: number;
  matchmakings: number;
  profile: Startup | Investor | null;
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <Card className="flex-1 mx-1">
      <View className="items-center">
        <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mb-2">
          <Ionicons name={icon} size={20} color="#0f172a" />
        </View>
        <Text className="text-xl font-black text-slate-900">{value}</Text>
        <Text className="text-xs text-slate-500 text-center mt-0.5">{label}</Text>
      </View>
    </Card>
  );
}

function QuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-1 mx-1 bg-slate-50 rounded-xl p-3 items-center"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={22} color="#0f172a" />
      <Text className="text-xs font-medium text-slate-700 text-center mt-1.5">{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({ connections: 0, matchmakings: 0, profile: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [profileRes, connectionsRes, matchmakingsRes] = await Promise.all([
        user.accountType === "startup"
          ? supabase.from("startups").select("*").eq("id", user.id).single()
          : supabase.from("investors").select("*").eq("id", user.id).single(),
        supabase
          .from("investor_startup_connections")
          .select("id", { count: "exact" })
          .or(
            user.accountType === "startup"
              ? `startup_id.eq.${user.id}`
              : `investor_id.eq.${user.id}`
          )
          .eq("status", "active"),
        supabase
          .from("matchmakings")
          .select("id", { count: "exact" })
          .or(
            user.accountType === "startup"
              ? `startup_id.eq.${user.id}`
              : `investor_id.eq.${user.id}`
          )
          .eq("is_archived", false),
      ]);

      setStats({
        profile: (profileRes.data as Startup | Investor | null) || null,
        connections: connectionsRes.count || 0,
        matchmakings: matchmakingsRes.count || 0,
      });
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) return <LoadingScreen />;

  const isStartup = user?.accountType === "startup";
  const profile = stats.profile;

  const startupProfile = isStartup ? (profile as Startup) : null;
  const investorProfile = !isStartup ? (profile as Investor) : null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="bg-slate-900 px-6 pt-14 pb-8">
          <View className={`flex-row items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
            <View>
              <Text className="text-slate-400 text-sm">{t("dashboard.greeting")},</Text>
              <Text className="text-white text-2xl font-black mt-0.5">{user?.name}</Text>
            </View>
            <Avatar name={user?.name || "?"} size={44} />
          </View>

          <View className={`mt-2 flex-row ${isRTL ? "justify-end" : "justify-start"}`}>
            <Badge
              label={isStartup ? t("auth.startup") : t("auth.investor")}
              variant="info"
            />
          </View>
        </View>

        <View className="px-4 -mt-4">
          {/* Stats row */}
          <View className="flex-row mb-4">
            <StatCard
              label={t("dashboard.connections")}
              value={stats.connections}
              icon="people"
            />
            <StatCard
              label={t("dashboard.matchmakings")}
              value={stats.matchmakings}
              icon="git-merge"
            />
            {isStartup && startupProfile && (
              <StatCard
                label={t("dashboard.stage")}
                value={startupProfile.stage || "—"}
                icon="bar-chart"
              />
            )}
            {!isStartup && investorProfile && (
              <StatCard
                label={t("dashboard.numberOfInvestments")}
                value={investorProfile.number_of_investments ?? "—"}
                icon="trending-up"
              />
            )}
          </View>

          {/* Quick actions */}
          <Card className="mb-4">
            <Text className={`text-sm font-semibold text-slate-500 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              Quick Actions
            </Text>
            <View className="flex-row">
              <QuickAction
                label={t("dashboard.viewProfile")}
                icon="person-circle-outline"
                onPress={() => router.push("/(stack)/profile")}
              />
              <QuickAction
                label={t("dashboard.viewConnections")}
                icon="people-outline"
                onPress={() => router.push("/(stack)/connections")}
              />
              {isStartup && (
                <QuickAction
                  label={t("dashboard.viewPitchDeck")}
                  icon="document-text-outline"
                  onPress={() => router.push("/(stack)/pitchdeck")}
                />
              )}
              <QuickAction
                label={t("nav.settings")}
                icon="settings-outline"
                onPress={() => router.push("/(stack)/settings")}
              />
            </View>
          </Card>

          {/* Profile summary */}
          {isStartup && startupProfile && (
            <Card className="mb-4">
              <Text className={`font-bold text-slate-900 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                {startupProfile.startup_name || startupProfile.name}
              </Text>
              <View className="space-y-2">
                {startupProfile.industry && (
                  <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Ionicons name="business-outline" size={15} color="#64748b" />
                    <Text className="text-slate-600 text-sm ml-2">{startupProfile.industry}</Text>
                  </View>
                )}
                {startupProfile.capital_seeking && (
                  <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Ionicons name="cash-outline" size={15} color="#64748b" />
                    <Text className="text-slate-600 text-sm ml-2">
                      {t("dashboard.capitalSeeking")}: {startupProfile.capital_seeking.toLocaleString()} SAR
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {!isStartup && investorProfile && (
            <Card className="mb-4">
              <Text className={`font-bold text-slate-900 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                {investorProfile.name}
              </Text>
              <View className="space-y-2">
                {investorProfile.company && (
                  <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Ionicons name="business-outline" size={15} color="#64748b" />
                    <Text className="text-slate-600 text-sm ml-2">{investorProfile.company}</Text>
                  </View>
                )}
                {investorProfile.average_ticket_size && (
                  <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Ionicons name="cash-outline" size={15} color="#64748b" />
                    <Text className="text-slate-600 text-sm ml-2">
                      {t("dashboard.averageTicket")}: {investorProfile.average_ticket_size}
                    </Text>
                  </View>
                )}
                {investorProfile.preferred_industries && (
                  <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Ionicons name="layers-outline" size={15} color="#64748b" />
                    <Text className="text-slate-600 text-sm ml-2" numberOfLines={1}>
                      {investorProfile.preferred_industries}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
