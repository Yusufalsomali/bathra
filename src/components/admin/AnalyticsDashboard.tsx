import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { adminService } from "@/lib/admin-service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, DollarSign, Target, Layers } from "lucide-react";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6"];

const AnalyticsDashboard = () => {
  const [data, setData] = useState<{
    sectorBreakdown: { sector: string; count: number }[];
    stageBreakdown: { stage: string; count: number }[];
    offerConversion: { total: number; accepted: number; rejected: number; pending: number };
    totalPaperCapital: number;
  } | null>(null);

  useEffect(() => {
    adminService.getAnalyticsData().then(({ data }) => setData(data));
  }, []);

  if (!data) return <div className="text-center py-12 text-muted-foreground">Loading analytics…</div>;

  const conversionData = [
    { name: "Accepted", value: data.offerConversion.accepted, fill: "#22c55e" },
    { name: "Pending", value: data.offerConversion.pending, fill: "#f59e0b" },
    { name: "Rejected", value: data.offerConversion.rejected, fill: "#ef4444" },
  ];

  const conversionRate =
    data.offerConversion.total > 0
      ? Math.round((data.offerConversion.accepted / data.offerConversion.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Analytics</h2>
        <p className="text-muted-foreground">Startup ecosystem and investment activity overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Offer Conversion Rate", value: `${conversionRate}%`, icon: Target, color: "text-green-600" },
          {
            label: "Total Paper Capital Deployed",
            value: `SAR ${(data.totalPaperCapital / 1_000_000).toFixed(2)}M`,
            icon: DollarSign,
            color: "text-purple-600",
          },
          { label: "Total Offers", value: data.offerConversion.total.toString(), icon: TrendingUp, color: "text-blue-600" },
          { label: "Sectors Represented", value: data.sectorBreakdown.length.toString(), icon: Layers, color: "text-orange-600" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Startups by Sector</CardTitle>
          <CardDescription>Number of approved startups per industry</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={Object.fromEntries(
              data.sectorBreakdown.map((s, i) => [s.sector, { label: s.sector, color: COLORS[i % COLORS.length] }])
            )}
            className="h-64"
          >
            <BarChart data={data.sectorBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="sector" width={100} tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.sectorBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Startups by Stage</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={{ count: { label: "Startups" } }} className="h-52 w-52">
              <PieChart>
                <Pie
                  data={data.stageBreakdown}
                  dataKey="count"
                  nameKey="stage"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ stage, count }: { stage: string; count: number }) => `${stage} (${count})`}
                >
                  {data.stageBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paper Offer Outcomes</CardTitle>
            <CardDescription>Conversion rate: {conversionRate}%</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={{ value: { label: "Offers" } }} className="h-52 w-52">
              <PieChart>
                <Pie
                  data={conversionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }: { name: string; value: number }) => `${name} (${value})`}
                >
                  {conversionData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
