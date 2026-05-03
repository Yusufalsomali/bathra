import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Users, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FeedItem {
  id: string;
  type: "interest" | "offer" | "info_request";
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

interface Props {
  startupId: string;
}

export const StartupActivityFeed = ({ startupId }: Props) => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

      const feed: FeedItem[] = [
        ...(connections ?? []).map((c) => ({
          id: `conn-${c.id}`,
          type: c.connection_type === "interested" ? ("interest" as const) : ("info_request" as const),
          title: c.connection_type === "interested" ? "Investor showed interest" : "Investor requested info",
          description: `${c.investor_name} ${c.connection_type === "interested" ? "marked your startup as interesting" : "sent you an info request"}`,
          timestamp: c.created_at,
        })),
        ...(offers ?? []).map((o) => ({
          id: `offer-${o.id}`,
          type: "offer" as const,
          title: "Paper investment offer received",
          description: `SAR ${Number(o.amount).toLocaleString()} offer — status: ${o.status}`,
          timestamp: o.created_at,
          amount: Number(o.amount),
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);

      setItems(feed);
      setLoading(false);
    };
    load();
  }, [startupId]);

  const icon = (type: FeedItem["type"]) => {
    if (type === "interest") return <Users className="h-4 w-4 text-blue-500" />;
    if (type === "offer") return <DollarSign className="h-4 w-4 text-green-500" />;
    return <Activity className="h-4 w-4 text-orange-500" />;
  };

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
              <div className="mt-0.5">{icon(item.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
