import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter, Href } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { acceptStartupOffer, rejectStartupOffer } from "@/lib/paper-offers";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react-native";

interface OfferRow {
  id: string;
  investor_id: string;
  investor_name: string;
  amount: number;
  valuation_at_offer: number;
  implied_equity_percentage: number;
  status: string;
  note?: string | null;
  created_at: string;
}

export default function StartupOffersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)" as Href);
  };

  const fetchOffers = useCallback(async () => {
    if (!user || user.accountType !== "startup") return;
    try {
      const { data: rows, error } = await supabase
        .from("paper_investment_offers")
        .select(
          "id,investor_id,amount,valuation_at_offer,implied_equity_percentage,status,note,created_at"
        )
        .eq("startup_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = (rows || []) as Array<Record<string, unknown>>;
      const investorIds = [...new Set(list.map((r) => r.investor_id as string))];

      let nameMap = new Map<string, string>();
      if (investorIds.length > 0) {
        const { data: invs } = await supabase
          .from("investors")
          .select("id,name")
          .in("id", investorIds);
        nameMap = new Map(
          (invs || []).map((i: { id: string; name: string }) => [i.id, i.name])
        );
      }

      setOffers(
        list.map((r) => ({
          id: r.id as string,
          investor_id: r.investor_id as string,
          investor_name: nameMap.get(r.investor_id as string) || t("startupOffers.investor"),
          amount: Number(r.amount),
          valuation_at_offer: Number(r.valuation_at_offer),
          implied_equity_percentage: Number(r.implied_equity_percentage),
          status: String(r.status),
          note: (r.note as string) || null,
          created_at: String(r.created_at),
        }))
      );
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (user?.accountType !== "startup") {
      router.replace("/(tabs)" as Href);
      return;
    }
    fetchOffers();
  }, [user?.accountType, fetchOffers, router]);

  const pending = offers.filter((o) => o.status === "pending");
  const history = offers.filter((o) => o.status !== "pending");

  const header = (
    <View className={`bg-white px-4 pt-3 pb-3 border-b border-slate-100 flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
      <TouchableOpacity
        onPress={goBack}
        hitSlop={12}
        className={isRTL ? "pl-2" : "pr-2"}
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
      >
        {isRTL ? (
          <ChevronRight size={22} stroke="#000000" strokeWidth={2} />
        ) : (
          <ChevronLeft size={22} stroke="#000000" strokeWidth={2} />
        )}
      </TouchableOpacity>
      <Text
        className={`text-xl font-black text-black flex-1 ${isRTL ? "text-right" : "text-left"}`}
        numberOfLines={1}
      >
        {t("startupOffers.title")}
      </Text>
    </View>
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);

  const statusBadgeVariant = (s: string) => {
    if (s === "accepted") return "success";
    if (s === "pending") return "warning";
    if (s === "rejected" || s === "cancelled") return "error";
    return "info";
  };

  const confirmAccept = (offer: OfferRow) => {
    Alert.alert(t("startupOffers.acceptConfirmTitle"), t("startupOffers.acceptConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("startupOffers.accept"),
        onPress: async () => {
          setActingId(offer.id);
          const { error } = await acceptStartupOffer(offer.id);
          setActingId(null);
          if (error) {
            Alert.alert(t("common.error"), error);
          } else {
            Alert.alert(t("common.success"), t("startupOffers.offerAccepted"));
            fetchOffers();
          }
        },
      },
    ]);
  };

  const confirmReject = (offer: OfferRow) => {
    Alert.alert(t("startupOffers.rejectConfirmTitle"), t("startupOffers.rejectConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("startupOffers.reject"),
        style: "destructive",
        onPress: async () => {
          setActingId(offer.id);
          const { error } = await rejectStartupOffer(offer.id);
          setActingId(null);
          if (error) {
            Alert.alert(t("common.error"), error);
          } else {
            Alert.alert(t("common.success"), t("startupOffers.offerRejected"));
            fetchOffers();
          }
        },
      },
    ]);
  };

  if (!user || user.accountType !== "startup") return null;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
        {header}
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      {header}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOffers();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text className={`text-sm text-slate-500 mb-4 ${isRTL ? "text-right" : "text-left"}`}>
          {t("startupOffers.subtitle")}
        </Text>

        {pending.length > 0 && (
          <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ${isRTL ? "text-right" : "text-left"}`}>
            {t("startupOffers.pendingSection")} ({pending.length})
          </Text>
        )}

        {pending.map((offer) => (
          <Card key={offer.id} className="mb-4">
            <View className={`flex-row items-start justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Text className={`font-bold text-black text-base flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                {offer.investor_name}
              </Text>
              <Badge label={offer.status} variant={statusBadgeVariant(offer.status)} />
            </View>
            <Text className={`text-sm text-slate-600 mb-1 ${isRTL ? "text-right" : "text-left"}`}>
              SAR {fmt(offer.amount)} · {offer.implied_equity_percentage.toFixed(2)}%{" "}
              {t("portfolio.equity")}
            </Text>
            <Text className={`text-xs text-slate-400 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              {new Date(offer.created_at).toLocaleDateString()}
            </Text>
            {offer.note ? (
              <View className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 mb-3">
                <Text className={`text-sm text-slate-700 ${isRTL ? "text-right" : "text-left"}`}>
                  {offer.note}
                </Text>
              </View>
            ) : null}
            <View className={`flex-row gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <View className="flex-1">
                <Button
                  title={t("startupOffers.accept")}
                  onPress={() => confirmAccept(offer)}
                  loading={actingId === offer.id}
                  disabled={actingId !== null}
                  icon={<CheckCircle2 size={16} stroke="white" strokeWidth={1.5} />}
                />
              </View>
              <View className="flex-1">
                <Button
                  title={t("startupOffers.reject")}
                  variant="outline"
                  onPress={() => confirmReject(offer)}
                  loading={actingId === offer.id}
                  disabled={actingId !== null}
                  icon={<XCircle size={16} stroke="#000000" strokeWidth={1.5} />}
                />
              </View>
            </View>
          </Card>
        ))}

        {history.length > 0 && (
          <>
            <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 mt-2 ${isRTL ? "text-right" : "text-left"}`}>
              {t("startupOffers.historySection")}
            </Text>
            {history.map((offer) => (
              <View
                key={offer.id}
                className={`flex-row items-center justify-between py-3 border-b border-slate-100 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <View className="flex-1 min-w-0">
                  <Text className={`text-sm font-semibold text-black ${isRTL ? "text-right" : "text-left"}`} numberOfLines={1}>
                    {offer.investor_name}
                  </Text>
                  <Text className={`text-xs text-slate-500 ${isRTL ? "text-right" : "text-left"}`}>
                    SAR {fmt(offer.amount)}
                  </Text>
                </View>
                <Badge label={offer.status} variant={statusBadgeVariant(offer.status)} />
              </View>
            ))}
          </>
        )}

        {offers.length === 0 && (
          <EmptyState
            icon={TrendingUp}
            title={t("startupOffers.empty")}
            description={t("startupOffers.emptyDesc")}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
