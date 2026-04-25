import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from "react-native";
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
import { Ionicons } from "@expo/vector-icons";

function StartupCard({
  item,
  onPress,
  onConnect,
  isRTL,
  t,
}: {
  item: Startup;
  onPress: () => void;
  onConnect: (type: "interested" | "info_request") => void;
  isRTL: boolean;
  t: (k: string) => string;
}) {
  return (
    <Card className="mb-3">
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View className={`flex-row items-center mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Avatar name={item.startup_name || item.name} uri={item.logo} size={44} />
          <View className={`flex-1 ${isRTL ? "mr-3" : "ml-3"}`}>
            <Text className={`font-bold text-slate-900 ${isRTL ? "text-right" : "text-left"}`}>
              {item.startup_name || item.name}
            </Text>
            <Text className={`text-xs text-slate-500 ${isRTL ? "text-right" : "text-left"}`}>
              {item.industry}
            </Text>
          </View>
          {item.stage && <Badge label={item.stage} variant="info" />}
        </View>

        {item.problem_solving && (
          <Text
            className={`text-sm text-slate-600 mb-3 leading-5 ${isRTL ? "text-right" : "text-left"}`}
            numberOfLines={2}
          >
            {item.problem_solving}
          </Text>
        )}

        {item.capital_seeking && (
          <View className={`flex-row items-center mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Ionicons name="cash-outline" size={14} color="#64748b" />
            <Text className="text-xs text-slate-500 ml-1">
              {item.capital_seeking.toLocaleString()} SAR
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View className={`flex-row gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
        <TouchableOpacity
          className="flex-1 bg-slate-900 rounded-xl py-2.5 items-center"
          onPress={() => onConnect("interested")}
        >
          <Text className="text-white text-xs font-semibold">{t("explore.expressInterest")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 border border-slate-200 rounded-xl py-2.5 items-center"
          onPress={() => onConnect("info_request")}
        >
          <Text className="text-slate-700 text-xs font-semibold">{t("explore.requestInfo")}</Text>
        </TouchableOpacity>
      </View>
    </Card>
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
            <Ionicons name="layers-outline" size={14} color="#64748b" />
            <Text className="text-xs text-slate-500 ml-1 flex-1" numberOfLines={1}>
              {item.preferred_industries}
            </Text>
          </View>
        )}

        {item.average_ticket_size && (
          <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
            <Ionicons name="cash-outline" size={14} color="#64748b" />
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
        const { data } = await supabase
          .from("startups")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false });
        setItems((data as Startup[]) || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isStartup]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-4 pt-14 pb-4 border-b border-slate-100">
        <Text className={`text-2xl font-black text-slate-900 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
          {isStartup ? t("explore.browseInvestors") : t("explore.browseStartups")}
        </Text>
        <View className={`flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
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
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="compass-outline"
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
            />
          )
        }
      />
    </SafeAreaView>
  );
}
