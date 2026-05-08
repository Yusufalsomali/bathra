import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Startup, Investor } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Search, XCircle, SlidersHorizontal, X, Banknote,
  ChevronRight, Calendar, Star, ArrowRight, Landmark,
  Building2, Compass, Layers,
} from "lucide-react-native";

const SAMPLE_CHECK = 50000;

const BANNER_PALETTES: [string, string, string][] = [
  ["#0ea5e9", "#06b6d4", "#10b981"],
  ["#6366f1", "#8b5cf6", "#d946ef"],
  ["#f59e0b", "#f97316", "#ef4444"],
  ["#10b981", "#14b8a6", "#0ea5e9"],
  ["#334155", "#1e293b", "#065f46"],
];

function getBannerPalette(seed: string): [string, string, string] {
  const idx = seed.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % BANNER_PALETTES.length;
  return BANNER_PALETTES[idx];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

const formatCurrency = (v?: number) =>
  v ? `SAR ${v.toLocaleString()}` : "Undisclosed";

function calcCompatibilityScore(
  startup: Startup,
  investorPrefs: { preferred_industries?: string; preferred_company_stage?: string } | null
): number {
  if (!investorPrefs) return 0;
  let score = 20;
  const prefIndustries = (investorPrefs.preferred_industries ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (
    prefIndustries.length === 0 ||
    prefIndustries.some((ind) => startup.industry?.toLowerCase().includes(ind))
  ) {
    score += 40;
  }
  if (
    !investorPrefs.preferred_company_stage ||
    investorPrefs.preferred_company_stage === startup.stage
  ) {
    score += 40;
  }
  return score;
}

function StartupCard({
  item,
  onPress,
  onConnect,
  isRTL,
  t,
  compatibilityScore,
  fundingProgress,
}: {
  item: Startup;
  onPress: () => void;
  onConnect: (type: "interested" | "info_request") => void;
  isRTL: boolean;
  t: (k: string) => string;
  compatibilityScore?: number;
  fundingProgress?: { raised: number; goal: number } | null;
}) {
  const palette = getBannerPalette(item.startup_name || item.name);
  const pct = fundingProgress && fundingProgress.goal > 0
    ? Math.min(Math.round((fundingProgress.raised / fundingProgress.goal) * 100), 100)
    : null;
  const scoreColor =
    compatibilityScore !== undefined
      ? compatibilityScore >= 80
        ? "#15803d"
        : compatibilityScore >= 60
        ? "#b45309"
        : "#64748b"
      : "#64748b";

  return (
    <View className="mb-4 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Gradient banner */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <LinearGradient
          colors={palette}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 140, position: "relative" }}
        >
          {/* Dark overlay at bottom */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.65)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80 }}
          />

          {/* Top row badges */}
          <View className={`absolute top-3 left-3 right-3 flex-row justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
            <View className="bg-white/20 rounded-full px-2.5 py-1">
              <Text className="text-white text-xs font-semibold">
                {item.verified ? "Active Opportunity" : "New"}
              </Text>
            </View>
            {compatibilityScore !== undefined && (
              <View className="bg-white/90 rounded-full px-2.5 py-1">
                <Text className="text-xs font-bold" style={{ color: scoreColor }}>
                  {compatibilityScore}% match
                </Text>
              </View>
            )}
          </View>

          {/* Bottom: name + initials */}
          <View className={`absolute bottom-3 left-3 right-3 flex-row items-end justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
            <View className="flex-1 mr-3">
              <Text className="text-white/70 text-[10px] uppercase tracking-widest">{item.industry}</Text>
              <Text className="text-white text-lg font-bold mt-0.5" numberOfLines={1}>
                {item.startup_name || item.name}
              </Text>
            </View>
            <View className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 items-center justify-center">
              <Text className="text-white font-bold text-base">
                {getInitials(item.startup_name || item.name)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View className="p-4">
        {/* Badges row */}
        <View className={`flex-row flex-wrap gap-1.5 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          {!!item.stage && <Badge label={item.stage} variant="outline" />}
          <Badge label={item.industry} variant="secondary" />
        </View>

        {/* Stats grid */}
        <View className="flex-row rounded-xl bg-slate-50 border border-slate-100 mb-3">
          <View className="flex-1 items-center py-2.5 border-r border-slate-100">
            <Text className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Valuation</Text>
            <Text className="text-xs font-semibold text-slate-800 text-center" numberOfLines={1}>
              {formatCurrency(item.pre_money_valuation)}
            </Text>
          </View>
          <View className="flex-1 items-center py-2.5 border-r border-slate-100">
            <Text className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Stage</Text>
            <Text className="text-xs font-semibold text-slate-800">{item.stage || "—"}</Text>
          </View>
          <View className="flex-1 items-center py-2.5">
            <Text className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Sector</Text>
            <Text className="text-xs font-semibold text-slate-800 text-center" numberOfLines={1}>{item.industry}</Text>
          </View>
        </View>

        {/* Funding progress */}
        {pct !== null && (
          <View className="mb-3">
            <View className={`flex-row justify-between mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Text className="text-xs text-slate-400">Paper funding</Text>
              <Text className="text-xs text-slate-400">{pct}% filled</Text>
            </View>
            <View className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-slate-900" : "bg-slate-400"}`}
                style={{ width: `${pct}%` }}
              />
            </View>
          </View>
        )}

        {/* Investment insight */}
        {item.pre_money_valuation && item.pre_money_valuation > 0 && (
          <View className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-3 flex-row items-start">
            <Landmark size={14} stroke="#0f172a" strokeWidth={1.5} />
            <Text className="text-xs text-slate-600 ml-2 flex-1">
              <Text className="font-medium">Investment insight: </Text>
              SAR {SAMPLE_CHECK.toLocaleString()} →{" "}
              {((SAMPLE_CHECK / item.pre_money_valuation) * 100).toFixed(2)}% equity
            </Text>
          </View>
        )}

        {/* CTA buttons */}
        <TouchableOpacity
          className="bg-slate-900 rounded-xl py-3 items-center mb-2 flex-row justify-center"
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text className="text-white text-sm font-semibold mr-2">Review & Invest</Text>
          <ArrowRight size={14} stroke="white" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          className="border border-slate-200 rounded-xl py-2.5 items-center"
          onPress={() => onConnect("interested")}
          activeOpacity={0.8}
        >
          <Text className="text-slate-700 text-xs font-medium">{t("explore.expressInterest")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InvestorCard({
  item,
  onPress,
  isRTL,
  t,
}: {
  item: Investor;
  onPress: () => void;
  isRTL: boolean;
  t: (k: string) => string;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card className="mb-3">
        <View className={`flex-row items-center mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Avatar name={item.name} size={44} />
          <View className={`flex-1 ${isRTL ? "mr-3" : "ml-3"}`}>
            <Text className={`font-bold text-slate-900 ${isRTL ? "text-right" : "text-left"}`}>
              {item.name}
            </Text>
            <Text className={`text-xs text-slate-500 ${isRTL ? "text-right" : "text-left"}`}>
              {item.company || item.role}
            </Text>
          </View>
          <Badge label={`${item.number_of_investments ?? 0} inv.`} variant="default" />
        </View>

        {item.preferred_industries && (
          <View className={`flex-row items-center mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Layers size={14} stroke="#64748b" strokeWidth={1.5} />
            <Text className="text-xs text-slate-500 ml-1 flex-1" numberOfLines={1}>
              {item.preferred_industries}
            </Text>
          </View>
        )}

        {item.average_ticket_size && (
          <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
            <Banknote size={14} stroke="#64748b" strokeWidth={1.5} />
            <Text className="text-xs text-slate-500 ml-1">{item.average_ticket_size}</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();
  const router = useRouter();

  const isStartup = user?.accountType === "startup";

  const [items, setItems] = useState<Startup[] | Investor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Investor-only: filters, compatibility, funding progress
  const [industries, setIndustries] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [investorPrefs, setInvestorPrefs] = useState<{
    preferred_industries?: string;
    preferred_company_stage?: string;
  } | null>(null);
  const [fundingProgressMap, setFundingProgressMap] = useState<Map<string, number>>(new Map());

  const fetchItems = useCallback(async () => {
    try {
      if (isStartup) {
        const { data } = await supabase
          .from("investors")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false });
        setItems((data as Investor[]) || []);
      } else {
        let query = supabase
          .from("startups")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (selectedIndustry) query = query.eq("industry", selectedIndustry);
        if (selectedStage) query = query.eq("stage", selectedStage);

        const { data } = await query;
        const list = (data as Startup[]) || [];
        setItems(list);

        // Fetch funding progress for each startup
        if (list.length > 0) {
          const ids = list.map((s) => s.id);
          const { data: offerData } = await supabase
            .from("paper_investment_offers")
            .select("startup_id,offered_amount")
            .in("startup_id", ids)
            .eq("status", "accepted");

          const map = new Map<string, number>();
          (offerData || []).forEach((o: { startup_id: string; offered_amount: number }) => {
            map.set(o.startup_id, (map.get(o.startup_id) || 0) + o.offered_amount);
          });
          setFundingProgressMap(map);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isStartup, selectedIndustry, selectedStage]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Fetch filter options + investor prefs (investor only)
  useEffect(() => {
    if (isStartup || !user?.id) return;

    const fetchFilters = async () => {
      const [indRes, stRes, prefRes] = await Promise.all([
        supabase.from("startups").select("industry").eq("status", "approved"),
        supabase.from("startups").select("stage").eq("status", "approved"),
        supabase
          .from("investors")
          .select("preferred_industries,preferred_company_stage")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      const uniqueIndustries = [
        ...new Set((indRes.data || []).map((r: { industry: string }) => r.industry).filter(Boolean)),
      ] as string[];
      const uniqueStages = [
        ...new Set((stRes.data || []).map((r: { stage: string }) => r.stage).filter(Boolean)),
      ] as string[];
      setIndustries(uniqueIndustries);
      setStages(uniqueStages);
      setInvestorPrefs(prefRes.data);
    };
    fetchFilters();
  }, [isStartup, user?.id]);

  const handleConnect = async (startup: Startup, type: "interested" | "info_request") => {
    if (!user) return;
    try {
      const { error } = await supabase.from("investor_startup_connections").insert([{
        investor_id: user.id,
        startup_id: startup.id,
        connection_type: type,
        investor_name: user.name,
        investor_email: user.email,
        startup_name: startup.startup_name || startup.name,
        startup_email: startup.email,
        status: "active",
      }] as unknown[]);
      if (error) throw error;
      Alert.alert(
        t("common.success"),
        type === "interested" ? t("explore.interestedSent") : t("explore.infoRequestSent")
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      Alert.alert(t("common.error"), msg);
    }
  };

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    if (isStartup) {
      const inv = item as Investor;
      return inv.name.toLowerCase().includes(q) || (inv.company || "").toLowerCase().includes(q);
    } else {
      const st = item as Startup;
      return (
        (st.startup_name || st.name).toLowerCase().includes(q) ||
        st.industry.toLowerCase().includes(q)
      );
    }
  });

  const hasActiveFilters = !isStartup && (selectedIndustry || selectedStage);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-4 pt-14 pb-4 border-b border-slate-100">
        <View className={`flex-row items-center justify-between mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Text className={`text-2xl font-black text-slate-900 ${isRTL ? "text-right" : "text-left"}`}>
            {isStartup ? t("explore.browseInvestors") : t("explore.browseStartups")}
          </Text>
          {!isStartup && (
            <TouchableOpacity
              className={`flex-row items-center px-3 py-2 rounded-xl ${hasActiveFilters ? "bg-slate-900" : "bg-slate-100"}`}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.7}
            >
              <SlidersHorizontal size={16} stroke={hasActiveFilters ? "white" : "#0f172a"} strokeWidth={1.5} />
              <Text className={`text-xs font-semibold ml-1 ${hasActiveFilters ? "text-white" : "text-slate-700"}`}>
                {t("common.filter")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View className={`flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Search size={18} stroke="#94a3b8" strokeWidth={1.5} />
          <TextInput
            className="flex-1 ml-2 text-slate-900 text-sm"
            placeholder={isStartup ? t("explore.searchInvestors") : t("explore.searchStartups")}
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            textAlign={isRTL ? "right" : "left"}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <XCircle size={18} stroke="#94a3b8" strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <View className={`flex-row flex-wrap gap-2 mt-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            {selectedIndustry && (
              <TouchableOpacity
                className="flex-row items-center bg-slate-900 rounded-full px-3 py-1"
                onPress={() => setSelectedIndustry("")}
              >
                <Text className="text-white text-xs">{selectedIndustry}</Text>
                <X size={12} stroke="white" strokeWidth={2} />
              </TouchableOpacity>
            )}
            {selectedStage && (
              <TouchableOpacity
                className="flex-row items-center bg-slate-900 rounded-full px-3 py-1"
                onPress={() => setSelectedStage("")}
              >
                <Text className="text-white text-xs">{selectedStage}</Text>
                <X size={12} stroke="white" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon={Compass}
              title={isStartup ? t("explore.browseInvestors") : t("explore.browseStartups")}
              description={t("common.noData")}
            />
          ) : null
        }
        renderItem={({ item }) =>
          isStartup ? (
            <InvestorCard
              item={item as Investor}
              onPress={() => router.push({ pathname: "/(stack)/investor/[id]", params: { id: item.id } })}
              isRTL={isRTL}
              t={t}
            />
          ) : (
            <StartupCard
              item={item as Startup}
              onPress={() => router.push({ pathname: "/(stack)/startup/[id]", params: { id: item.id } })}
              onConnect={(type) => handleConnect(item as Startup, type)}
              isRTL={isRTL}
              t={t}
              compatibilityScore={investorPrefs ? calcCompatibilityScore(item as Startup, investorPrefs) : undefined}
              fundingProgress={
                (item as Startup).capital_seeking
                  ? {
                      raised: fundingProgressMap.get(item.id) || 0,
                      goal: (item as Startup).capital_seeking!,
                    }
                  : null
              }
            />
          )
        }
      />

      {/* Filter Modal (investor only) */}
      {!isStartup && (
        <Modal
          visible={filterModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <SafeAreaView className="flex-1 bg-white">
            <View className={`flex-row items-center justify-between px-4 py-4 border-b border-slate-100 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Text className="font-black text-slate-900 text-lg">{t("common.filter")}</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} activeOpacity={0.7}>
                <X size={24} stroke="#64748b" strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                Industry
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                <TouchableOpacity
                  className={`px-3 py-2 rounded-xl border ${!selectedIndustry ? "bg-slate-900 border-slate-900" : "border-slate-200"}`}
                  onPress={() => setSelectedIndustry("")}
                >
                  <Text className={`text-xs font-medium ${!selectedIndustry ? "text-white" : "text-slate-700"}`}>
                    {t("explore.allIndustries")}
                  </Text>
                </TouchableOpacity>
                {industries.map((ind) => (
                  <TouchableOpacity
                    key={ind}
                    className={`px-3 py-2 rounded-xl border ${selectedIndustry === ind ? "bg-slate-900 border-slate-900" : "border-slate-200"}`}
                    onPress={() => setSelectedIndustry(ind)}
                  >
                    <Text className={`text-xs font-medium ${selectedIndustry === ind ? "text-white" : "text-slate-700"}`}>
                      {ind}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                Stage
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-8">
                <TouchableOpacity
                  className={`px-3 py-2 rounded-xl border ${!selectedStage ? "bg-slate-900 border-slate-900" : "border-slate-200"}`}
                  onPress={() => setSelectedStage("")}
                >
                  <Text className={`text-xs font-medium ${!selectedStage ? "text-white" : "text-slate-700"}`}>
                    {t("explore.allStages")}
                  </Text>
                </TouchableOpacity>
                {stages.map((stage) => (
                  <TouchableOpacity
                    key={stage}
                    className={`px-3 py-2 rounded-xl border ${selectedStage === stage ? "bg-slate-900 border-slate-900" : "border-slate-200"}`}
                    onPress={() => setSelectedStage(stage)}
                  >
                    <Text className={`text-xs font-medium ${selectedStage === stage ? "text-white" : "text-slate-700"}`}>
                      {stage}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                className="bg-slate-900 rounded-2xl py-4 items-center"
                onPress={() => {
                  setFilterModalVisible(false);
                  fetchItems();
                }}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold">Apply Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
