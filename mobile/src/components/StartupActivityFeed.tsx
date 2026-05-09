import { View, Text } from "react-native";
import { useEffect, useState, useContext } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Activity, DollarSign, TrendingUp, Users } from "lucide-react-native";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";

type FeedItem = {
  id: string;
  type: "interest" | "offer" | "info_request";
  title: string;
  description: string;
  timestamp: string;
};

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  const mins = Math.floor(sec / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function StartupActivityFeed({ startupId }: { startupId: string }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [{ data: connections }, { data: offers }] = await Promise.all([
        supabase
          .from("investor_startup_connections")
          .select("id, connection_type, investor_name, created_at")
          .eq("startup_id", startupId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("paper_investment_offers")
          .select("id, amount, status, created_at")
          .eq("startup_id", startupId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (cancelled) return;

      const feed: FeedItem[] = [
        ...(connections ?? []).map(
          (c: {
            id: string;
            connection_type: string;
            investor_name: string;
            created_at: string;
          }) => ({
            id: `conn-${c.id}`,
            type:
              c.connection_type === "interested" ? ("interest" as const) : ("info_request" as const),
            title:
              c.connection_type === "interested"
                ? t("activityFeed.interestTitle")
                : t("activityFeed.infoTitle"),
            description:
              c.connection_type === "interested"
                ? t("activityFeed.interestDesc", { name: c.investor_name })
                : t("activityFeed.infoDesc", { name: c.investor_name }),
            timestamp: c.created_at,
          })
        ),
        ...(offers ?? []).map(
          (o: { id: string; amount: number | string; status: string; created_at: string }) => ({
            id: `offer-${o.id}`,
            type: "offer" as const,
            title: t("activityFeed.offerTitle"),
            description: t("activityFeed.offerDesc", {
              amount: Number(o.amount).toLocaleString(),
              status: o.status,
            }),
            timestamp: o.created_at,
          })
        ),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);

      setItems(feed);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [startupId]);

  const icon = (type: FeedItem["type"]) => {
    const common = { size: 16, strokeWidth: 1.75 as const };
    if (type === "interest") return <Users {...common} color="#2563eb" />;
    if (type === "offer") return <DollarSign {...common} color="#059669" />;
    return <Activity {...common} color="#ea580c" />;
  };

  if (loading || items.length === 0) return null;

  return (
    <Card className="mb-4">
      <View className={`flex-row items-center gap-2 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        <TrendingUp size={18} stroke="#000000" strokeWidth={1.75} />
        <Text className={`font-bold text-black flex-1 ${isRTL ? "text-right" : "text-left"}`}>
          {t("activityFeed.sectionTitle")}
        </Text>
      </View>

      <View className="gap-3">
        {items.map((item) => (
          <View
            key={item.id}
            className={`flex-row items-start gap-3 p-3 rounded-xl bg-slate-50 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <View className="mt-0.5">{icon(item.type)}</View>
            <View className="flex-1 min-w-0">
              <Text className={`text-sm font-semibold text-black ${isRTL ? "text-right" : "text-left"}`}>
                {item.title}
              </Text>
              <Text
                className={`text-xs text-slate-500 mt-0.5 ${isRTL ? "text-right" : "text-left"}`}
                numberOfLines={3}
              >
                {item.description}
              </Text>
            </View>
            <Text className="text-[10px] text-slate-400 whitespace-nowrap">
              {formatRelative(item.timestamp)}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
