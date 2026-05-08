import React from "react";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter, Href } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Startup, Investor } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import {
  Heart, BarChart2, TrendingUp, Clock, GitMerge,
  User, FileText, Settings, Building2, Banknote,
  Users, Briefcase, Star, Layers, ChevronRight,
  ChevronLeft, PlusCircle,
} from "lucide-react-native";

function StatCard({
  label,
  value,
  icon: IconComponent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
}) {
  return (
    <Card className="flex-1 mx-1">
      <View className="items-center">
        <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mb-2">
          <IconComponent size={20} color="#0f172a" strokeWidth={1.5} />
        </View>
        <Text className="text-xl font-black text-slate-900">{value}</Text>
        <Text className="text-xs text-slate-500 text-center mt-0.5">{label}</Text>
      </View>
    </Card>
  );
}

function QuickAction({
  label,
  icon: IconComponent,
  onPress,
}: {
  label: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-1 mx-1 bg-slate-50 rounded-xl p-3 items-center"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconComponent size={22} color="#0f172a" strokeWidth={1.5} />
      <Text className="text-xs font-medium text-slate-700 text-center mt-1.5">{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Startup Dashboard ───────────────────────────────────────────────────────

interface StartupData {
  profile: Startup | null;
  interestedCount: number;
  daysSinceRegistration: number;
  pendingOffers: number;
}

function StartupDashboard({ isRTL }: { isRTL: boolean }) {
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const router = useRouter();
  const [data, setData] = useState<StartupData>({
    profile: null,
    interestedCount: 0,
    daysSinceRegistration: 0,
    pendingOffers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [profileRes, interestedRes, offersRes] = await Promise.all([
        supabase.from("startups").select("*").eq("id", user.id).single(),
        supabase
          .from("investor_startup_connections")
          .select("id", { count: "exact" })
          .eq("startup_id", user.id)
          .eq("connection_type", "interested")
          .eq("status", "active"),
        supabase
          .from("paper_investment_offers")
          .select("id", { count: "exact" })
          .eq("startup_id", user.id)
          .in("status", ["pending", "accepted"]),
      ]);

      const profile = profileRes.data as Startup | null;
      const days = profile
        ? Math.floor(
            (Date.now() - new Date(profile.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      setData({
        profile,
        interestedCount: interestedRes.count || 0,
        daysSinceRegistration: days,
        pendingOffers: offersRes.count || 0,
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

  if (loading) return <LoadingScreen />;

  const { profile, interestedCount, daysSinceRegistration, pendingOffers } = data;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
          />
        }
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
            <Badge label={t("auth.startup")} variant="info" />
            {profile && (
              <View className="ml-2">
                <Badge
                  label={profile.status === "approved" ? "Approved" : "Pending"}
                  variant={profile.status === "approved" ? "success" : "warning"}
                />
              </View>
            )}
          </View>
        </View>

        <View className="px-4 -mt-4">
          {/* Stats */}
          <View className="flex-row mb-4">
            <StatCard
              label={t("dashboard.interestedInvestors")}
              value={interestedCount}
              icon={Heart}
            />
            <StatCard
              label={t("dashboard.stage")}
              value={profile?.stage || "—"}
              icon={BarChart2}
            />
            {pendingOffers > 0 && (
              <StatCard
                label="Offers"
                value={pendingOffers}
                icon={TrendingUp}
              />
            )}
          </View>

          {/* Status card */}
          <Card className="mb-4">
            <View className={`flex-row items-center mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Text className={`font-bold text-slate-900 flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                {profile?.startup_name || profile?.name || user?.name}
              </Text>
            </View>
            <Text className={`text-sm text-slate-500 ${isRTL ? "text-right" : "text-left"}`}>
              {profile?.status === "approved"
                ? t("dashboard.profileApproved")
                : t("dashboard.profilePending")}
            </Text>
          </Card>

          {/* Matchmaking section */}
          <Card className="mb-4">
            {interestedCount > 0 ? (
              <View className="items-center py-2">
                <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center mb-3">
                  <Heart size={22} stroke="white" strokeWidth={1.5} />
                </View>
                <Text className="text-xl font-black text-slate-900 mb-1">
                  {t("dashboard.greatNews")}
                </Text>
                <Text className="text-slate-500 text-sm text-center mb-4">
                  {interestedCount} {t("dashboard.interestedInvestorsCount")}
                </Text>
                <TouchableOpacity
                  className="bg-slate-900 rounded-xl px-5 py-3 flex-row items-center"
                  onPress={() => router.push("/(stack)/interested-investors" as Href)}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-semibold text-sm mr-2">
                    {t("dashboard.viewInterestedInvestors")}
                  </Text>
                  {isRTL ? <ChevronLeft size={16} stroke="white" strokeWidth={2} /> : <ChevronRight size={16} stroke="white" strokeWidth={2} />}
                </TouchableOpacity>
              </View>
            ) : daysSinceRegistration >= 7 ? (
              <View className="items-center py-2">
                <View className="w-12 h-12 bg-amber-500 rounded-full items-center justify-center mb-3">
                  <Clock size={22} stroke="white" strokeWidth={1.5} />
                </View>
                <Text className="font-bold text-slate-900 mb-1 text-center">
                  {t("dashboard.noMatchFound")}
                </Text>
                <Text className="text-slate-500 text-sm text-center mb-4">
                  {t("dashboard.noMatchDesc")}
                </Text>
                <TouchableOpacity
                  className="border border-slate-200 rounded-xl px-5 py-3"
                  onPress={() => router.push("/(stack)/profile")}
                  activeOpacity={0.8}
                >
                  <Text className="text-slate-700 font-semibold text-sm">
                    {t("dashboard.updateProfile")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center py-2">
                <View className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center mb-3">
                  <GitMerge size={22} stroke="#0f172a" strokeWidth={1.5} />
                </View>
                <Text className="font-bold text-slate-900 mb-1">{t("matchmaking.title")}</Text>
                <Text className="text-slate-500 text-sm text-center">
                  {t("matchmaking.noMatchesDesc")}
                </Text>
              </View>
            )}
          </Card>

          {/* Quick actions */}
          <Card className="mb-4">
            <Text className={`text-sm font-semibold text-slate-500 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              Quick Actions
            </Text>
            <View className="flex-row">
              <QuickAction
                label={t("dashboard.viewProfile")}
                icon={User}
                onPress={() => router.push("/(stack)/profile")}
              />
              <QuickAction
                label={t("dashboard.interestedInvestors")}
                icon={Heart}
                onPress={() => router.push("/(stack)/interested-investors" as Href)}
              />
              <QuickAction
                label={t("dashboard.viewPitchDeck")}
                icon={FileText}
                onPress={() => router.push("/(stack)/pitchdeck")}
              />
              <QuickAction
                label={t("nav.settings")}
                icon={Settings}
                onPress={() => router.push("/(stack)/settings")}
              />
            </View>
          </Card>

          {/* Profile summary */}
          {profile && (
            <Card className="mb-4">
              <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                {t("profile.companyInfo")}
              </Text>
              <View className="space-y-2">
                {profile.industry && (
                  <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Building2 size={15} stroke="#64748b" strokeWidth={1.5} />
                    <Text className="text-slate-600 text-sm ml-2">{profile.industry}</Text>
                  </View>
                )}
                {profile.capital_seeking && (
                  <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Banknote size={15} stroke="#64748b" strokeWidth={1.5} />
                    <Text className="text-slate-600 text-sm ml-2">
                      {t("dashboard.capitalSeeking")}: {profile.capital_seeking.toLocaleString()} SAR
                    </Text>
                  </View>
                )}
                {profile.team_size && (
                  <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Users size={15} stroke="#64748b" strokeWidth={1.5} />
                    <Text className="text-slate-600 text-sm ml-2">
                      {t("dashboard.teamSize")}: {profile.team_size}
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

// ─── Investor Dashboard ───────────────────────────────────────────────────────

interface InvestorData {
  profile: Investor | null;
  wallet: { available_balance: number; reserved_balance: number; invested_balance: number } | null;
  availableStartups: number;
  recentStartups: Array<{ id: string; startup_name?: string; name: string; industry: string; stage: string }>;
}

function InvestorDashboard({ isRTL }: { isRTL: boolean }) {
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const router = useRouter();
  const [data, setData] = useState<InvestorData>({
    profile: null,
    wallet: null,
    availableStartups: 0,
    recentStartups: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [profileRes, walletRes, startupsRes, recentRes] = await Promise.all([
        supabase.from("investors").select("*").eq("id", user.id).single(),
        supabase.from("paper_wallets").select("available_balance,reserved_balance,invested_balance").eq("investor_id", user.id).maybeSingle(),
        supabase.from("startups").select("id", { count: "exact" }).eq("status", "approved"),
        supabase.from("startups").select("id,startup_name,name,industry,stage").eq("status", "approved").order("created_at", { ascending: false }).limit(3),
      ]);

      setData({
        profile: profileRes.data as Investor | null,
        wallet: walletRes.data as InvestorData["wallet"],
        availableStartups: startupsRes.count || 0,
        recentStartups: (recentRes.data || []) as InvestorData["recentStartups"],
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

  if (loading) return <LoadingScreen />;

  const { profile, wallet, availableStartups, recentStartups } = data;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
          />
        }
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
            <Badge label={t("auth.investor")} variant="info" />
          </View>
        </View>

        <View className="px-4 -mt-4">
          {/* Portfolio wallet card */}
          <Card className="mb-4">
            <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              {t("dashboard.portfolioBalance")}
            </Text>
            <View className="flex-row mb-4">
              <View className="flex-1 items-center">
                <Text className="text-lg font-black text-slate-900">
                  {wallet ? wallet.available_balance.toLocaleString() : "0"}
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">{t("portfolio.availableBalance")}</Text>
              </View>
              <View className="flex-1 items-center border-x border-slate-100">
                <Text className="text-lg font-black text-amber-600">
                  {wallet ? wallet.reserved_balance.toLocaleString() : "0"}
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">{t("portfolio.reservedBalance")}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-lg font-black text-green-600">
                  {wallet ? wallet.invested_balance.toLocaleString() : "0"}
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">{t("portfolio.investedBalance")}</Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-slate-900 rounded-xl py-3 items-center"
              onPress={() => router.push("/(stack)/portfolio" as Href)}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-sm">{t("dashboard.viewPortfolio")}</Text>
            </TouchableOpacity>
          </Card>

          {/* Stats row */}
          <View className="flex-row mb-4">
            <StatCard
              label={t("dashboard.availableStartups")}
              value={availableStartups}
              icon={Building2}
            />
            <StatCard
              label={t("dashboard.numberOfInvestments")}
              value={profile?.number_of_investments ?? "—"}
              icon={TrendingUp}
            />
          </View>

          {/* Startup discovery */}
          <Card className="mb-4">
            <View className={`flex-row items-center justify-between mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Text className={`font-bold text-slate-900 ${isRTL ? "text-right" : "text-left"}`}>
                {availableStartups > 0
                  ? `${availableStartups} ${t("dashboard.availableStartups")}`
                  : "Startup Discovery"}
              </Text>
            </View>

            {recentStartups.length > 0 ? (
              <>
                {recentStartups.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    className={`flex-row items-center py-3 border-b border-slate-50 ${isRTL ? "flex-row-reverse" : ""}`}
                    onPress={() => router.push({ pathname: "/(stack)/startup/[id]", params: { id: s.id } })}
                    activeOpacity={0.7}
                  >
                    <Avatar name={s.startup_name || s.name} size={36} />
                    <View className={`flex-1 ${isRTL ? "mr-3 items-end" : "ml-3"}`}>
                      <Text className="font-semibold text-slate-900 text-sm">{s.startup_name || s.name}</Text>
                      <Text className="text-xs text-slate-500">{s.industry}</Text>
                    </View>
                    <Badge label={s.stage} variant="info" />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  className="mt-3 border border-slate-200 rounded-xl py-3 items-center"
                  onPress={() => router.push("/(tabs)/explore")}
                  activeOpacity={0.8}
                >
                  <Text className="text-slate-700 font-semibold text-sm">{t("dashboard.browseStartups")}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="items-center py-4">
                <Building2 size={32} stroke="#94a3b8" strokeWidth={1.5} />
                <Text className="text-slate-500 text-sm text-center mt-2">
                  No approved startups yet. Check back soon.
                </Text>
              </View>
            )}
          </Card>

          {/* Quick actions */}
          <Card className="mb-4">
            <Text className={`text-sm font-semibold text-slate-500 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              Quick Actions
            </Text>
            <View className="flex-row">
              <QuickAction
                label={t("dashboard.viewProfile")}
                icon={User}
                onPress={() => router.push("/(stack)/profile")}
              />
              <QuickAction
                label={t("dashboard.viewPortfolio")}
                icon={Briefcase}
                onPress={() => router.push("/(stack)/portfolio" as Href)}
              />
              <QuickAction
                label={t("dashboard.viewInterestedStartups")}
                icon={Star}
                onPress={() => router.push("/(stack)/interested-startups" as Href)}
              />
              <QuickAction
                label={t("nav.settings")}
                icon={Settings}
                onPress={() => router.push("/(stack)/settings")}
              />
            </View>
          </Card>

          {/* Investor profile summary */}
          {profile && (
            <Card className="mb-4">
              <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                {t("profile.investmentPrefs")}
              </Text>
              <View className="space-y-2">
                {profile.company && (
                  <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Building2 size={15} stroke="#64748b" strokeWidth={1.5} />
                    <Text className="text-slate-600 text-sm ml-2">{profile.company}</Text>
                  </View>
                )}
                {profile.average_ticket_size && (
                  <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Banknote size={15} stroke="#64748b" strokeWidth={1.5} />
                    <Text className="text-slate-600 text-sm ml-2">
                      {t("dashboard.averageTicket")}: {profile.average_ticket_size}
                    </Text>
                  </View>
                )}
                {profile.preferred_industries && (
                  <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Layers size={15} stroke="#64748b" strokeWidth={1.5} />
                    <Text className="text-slate-600 text-sm ml-2 flex-1" numberOfLines={1}>
                      {profile.preferred_industries}
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

// ─── Root export ─────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user } = useAuth();
  const { isRTL } = useRTL();

  if (!user) return null;

  if (user.accountType === "startup") return <StartupDashboard isRTL={isRTL} />;
  return <InvestorDashboard isRTL={isRTL} />;
}
