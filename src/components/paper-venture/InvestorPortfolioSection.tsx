import { useState, useEffect } from "react";
import {
  Activity,
  ArrowUpLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Clock3,
  Landmark,
  Layers3,
  PieChart as PieChartIcon,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { PaperVentureService } from "@/lib/paper-venture-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InvestorPortfolioSummary } from "@/lib/paper-venture-types";
import { cn } from "@/lib/utils";

interface InvestorPortfolioSectionProps {
  summary: InvestorPortfolioSummary | null;
  onAddFunds: () => void;
  onOpenPortfolio?: () => void;
  onCancelOffer?: (offerId: string) => Promise<void>;
}

const sectorColors = [
  "#0f766e",
  "#0891b2",
  "#2563eb",
  "#9333ea",
  "#ea580c",
  "#ca8a04",
];

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "active":
    case "accepted":
      return "default";
    case "pending":
      return "secondary";
    case "rejected":
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
};

const formatCurrency = (
  amount: number,
  currencyCode = "SAR",
  locale = "en-SA",
) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

const InvestorPortfolioSection = ({
  summary,
  onAddFunds,
  onOpenPortfolio,
  onCancelOffer,
}: InvestorPortfolioSectionProps) => {
  const { language, isRTL } = useLanguage();
  const [timeline, setTimeline] = useState<{ date: string; value: number }[]>([]);

  useEffect(() => {
    if (summary?.wallet?.investor_id) {
      PaperVentureService.getPortfolioValueTimeline(summary.wallet.investor_id).then(setTimeline);
    }
  }, [summary?.wallet?.investor_id]);

  if (!summary) {
    return null;
  }

  const t = {
    title:
      language === "Arabic"
        ? "محفظة الاستثمار الورقية"
        : "Paper Venture Portfolio",
    subtitle:
      language === "Arabic"
        ? "جميع الأرصدة والعروض والاستثمارات هنا محاكاة تعليمية داخل منصة بذرة وليست أموالاً حقيقية."
        : "All balances, offers, and positions below are simulated for Bathra demo and academic use only.",
    addFunds:
      language === "Arabic" ? "إضافة أموال افتراضية" : "Add Virtual Funds",
    openStartups:
      language === "Arabic" ? "استكشف الشركات الناشئة" : "Browse Startups",
    availableCash:
      language === "Arabic"
        ? "النقد الافتراضي المتاح"
        : "Available simulated cash",
    reservedCash:
      language === "Arabic"
        ? "المحجوز في العروض المعلقة"
        : "Reserved in pending offers",
    acceptedCapital:
      language === "Arabic" ? "الاستثمارات المقبولة" : "Accepted investments",
    portfolioValue:
      language === "Arabic"
        ? "قيمة المحفظة الورقية الحالية"
        : "Current paper portfolio value",
    activeDeals: language === "Arabic" ? "الصفقات النشطة" : "Active deals",
    pendingOffers: language === "Arabic" ? "العروض المعلقة" : "Pending offers",
    pendingDescription:
      language === "Arabic"
        ? "هذه العروض بانتظار مراجعة الشركات الناشئة. الأموال هنا محجوزة فقط وليست مستثمرة نهائياً."
        : "These offers are waiting on startup review. Funds shown here are reserved, not finalized.",
    acceptedPositions:
      language === "Arabic" ? "الاستثمارات المقبولة" : "Accepted investments",
    acceptedDescription:
      language === "Arabic"
        ? "ملكية المستثمر ثابتة بعد القبول، بينما تتغير القيمة الورقية مع تغير تقييم الشركة."
        : "Ownership stays fixed after acceptance, while paper value moves with the startup valuation.",
    sectorExposure:
      language === "Arabic" ? "التعرض القطاعي" : "Sector exposure",
    sectorDescription:
      language === "Arabic"
        ? "يعرض هذا التوزيع التعرض الحالي، ويشمل التعرضات المعلقة عندما لا توجد صفقات مقبولة."
        : "Shows current sector concentration, including pending exposure when offers are not yet accepted.",
    recentActivity: language === "Arabic" ? "النشاط الأخير" : "Recent activity",
    recentDescription:
      language === "Arabic"
        ? "آخر التحركات في المحفظة الافتراضية والعروض وتغييرات التقييم."
        : "Latest wallet, offer, and valuation events across your simulated venture activity.",
    noPending:
      language === "Arabic"
        ? "لا توجد عروض معلقة حالياً. استكشف الشركات الناشئة وقدم عرضاً جديداً."
        : "No pending offers yet. Browse startups and submit a new offer.",
    noAccepted:
      language === "Arabic"
        ? "لا توجد استثمارات مقبولة بعد. عندما تقبل شركة ناشئة عرضك سيظهر هنا."
        : "No accepted positions yet. Once a startup accepts your offer, it will appear here.",
    noExposure:
      language === "Arabic"
        ? "سيظهر التوزيع القطاعي بمجرد إنشاء عرض أو قبول استثمار."
        : "Sector allocation will appear once you submit or finalize an offer.",
    noActivity:
      language === "Arabic"
        ? "لا توجد حركة حديثة بعد. أضف أموالاً افتراضية أو قدم عرض استثمار."
        : "No recent activity yet. Add virtual funds or submit an investment offer.",
    pendingExposure: language === "Arabic" ? "تعرض معلق" : "Pending exposure",
    acceptedExposure:
      language === "Arabic" ? "تعرض مقبول" : "Accepted exposure",
    mixedExposure: language === "Arabic" ? "تعرض مختلط" : "Mixed exposure",
    cancelOffer: language === "Arabic" ? "إلغاء العرض" : "Cancel offer",
    startup: language === "Arabic" ? "الشركة الناشئة" : "Startup",
    sector: language === "Arabic" ? "القطاع" : "Sector",
    amount: language === "Arabic" ? "المبلغ" : "Amount",
    equity: language === "Arabic" ? "الملكية" : "Ownership",
    valuationAtOffer:
      language === "Arabic" ? "التقييم عند العرض" : "Valuation at offer",
    entryValuation: language === "Arabic" ? "تقييم الدخول" : "Entry valuation",
    currentValuation:
      language === "Arabic" ? "التقييم الحالي" : "Current valuation",
    currentValue:
      language === "Arabic" ? "القيمة الحالية" : "Current paper value",
    gainLoss: language === "Arabic" ? "الربح/الخسارة" : "Gain / loss",
    returnPct: language === "Arabic" ? "العائد %" : "Return %",
    date: language === "Arabic" ? "التاريخ" : "Date",
    status: language === "Arabic" ? "الحالة" : "Status",
    impliedEquity:
      language === "Arabic" ? "الملكية المتوقعة" : "Implied equity",
    pnl: language === "Arabic" ? "الربح/الخسارة الحالية" : "Current paper P/L",
    reservedCaption:
      language === "Arabic"
        ? "محجوز حتى قرار الشركة الناشئة"
        : "Held until the startup responds",
    readyCaption:
      language === "Arabic" ? "جاهز لعروض جديدة" : "Ready for new offers",
    deployedCaption:
      language === "Arabic"
        ? "رأس المال المنشور في الشركات"
        : "Capital deployed into startups",
    dealsCaption:
      language === "Arabic"
        ? "عروض واستثمارات جارية"
        : "Pending + accepted deals",
  };

  const wallet = summary.wallet;
  const locale = language === "Arabic" ? "ar-SA" : "en-SA";
  const chartData = summary.sectorBreakdown.map((sector, index) => ({
    name: sector.sector,
    value: sector.amount,
    fill: sectorColors[index % sectorColors.length],
  }));

  const chartConfig = chartData.reduce<ChartConfig>((config, item) => {
    config[item.name] = {
      label: item.name,
      color: item.fill,
    };
    return config;
  }, {});

  const statCards = [
    {
      label: t.availableCash,
      value: formatCurrency(
        wallet.available_balance,
        wallet.currency_code,
        locale,
      ),
      description: t.readyCaption,
      icon: Wallet,
    },
    {
      label: t.reservedCash,
      value: formatCurrency(
        wallet.total_pending_offers,
        wallet.currency_code,
        locale,
      ),
      description: t.reservedCaption,
      icon: Clock3,
    },
    {
      label: t.acceptedCapital,
      value: formatCurrency(
        wallet.total_accepted_investments,
        wallet.currency_code,
        locale,
      ),
      description: t.deployedCaption,
      icon: Landmark,
    },
    {
      label: t.portfolioValue,
      value: formatCurrency(
        wallet.total_portfolio_value,
        wallet.currency_code,
        locale,
      ),
      description: `${t.pnl}: ${formatCurrency(
        wallet.current_gain_loss,
        wallet.currency_code,
        locale,
      )}`,
      icon: PieChartIcon,
    },
    {
      label: t.activeDeals,
      value: wallet.active_deals_count.toString(),
      description: t.dealsCaption,
      icon: BriefcaseBusiness,
    },
  ];

  const exposureLabel = (type: "pending" | "accepted" | "mixed") => {
    if (type === "pending") return t.pendingExposure;
    if (type === "accepted") return t.acceptedExposure;
    return t.mixedExposure;
  };

  const activityIcon = (type: string) => {
    switch (type) {
      case "add_funds":
        return PlusCircle;
      case "offer_submitted":
        return ArrowUpRight;
      case "offer_accepted":
        return Sparkles;
      case "offer_rejected":
        return ShieldAlert;
      case "offer_cancelled":
        return ArrowUpLeft;
      case "valuation_changed":
        return Layers3;
      default:
        return Activity;
    }
  };

  return (
    <div className={cn("space-y-8", isRTL && "text-right")}>
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-2xl">
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
              {language === "Arabic"
                ? "استثمار افتراضي فقط"
                : "Simulated venture investing only"}
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
                {t.subtitle}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={onAddFunds}
                className="gap-2 bg-white text-slate-950 hover:bg-white/90"
              >
                <PlusCircle className="h-4 w-4" />
                {t.addFunds}
              </Button>
              {onOpenPortfolio && (
                <Button
                  onClick={onOpenPortfolio}
                  variant="outline"
                  className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {t.openStartups}
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-white/70">{t.availableCash}</div>
              <div className="mt-2 text-2xl font-semibold">
                {formatCurrency(
                  wallet.available_balance,
                  wallet.currency_code,
                  locale,
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-white/70">{t.reservedCash}</div>
              <div className="mt-2 text-2xl font-semibold">
                {formatCurrency(
                  wallet.reserved_balance,
                  wallet.currency_code,
                  locale,
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-white/70">{t.acceptedCapital}</div>
              <div className="mt-2 text-2xl font-semibold">
                {formatCurrency(
                  wallet.total_accepted_investments,
                  wallet.currency_code,
                  locale,
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-white/70">{t.activeDeals}</div>
              <div className="mt-2 text-2xl font-semibold">
                {wallet.active_deals_count}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              className="overflow-hidden border-white/10 bg-gradient-to-br from-card to-card/60 shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardDescription>{card.label}</CardDescription>
                    <CardTitle className="mt-2 text-2xl sm:text-3xl">
                      {card.value}
                    </CardTitle>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {card.description}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-white/10 shadow-lg">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>{t.pendingOffers}</CardTitle>
            <CardDescription>{t.pendingDescription}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {summary.pendingOffers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {t.noPending}
              </div>
            ) : (
              <div className="divide-y">
                {summary.pendingOffers.map((offer) => (
                  <div key={offer.id} className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">
                            {offer.startup_name}
                          </h3>
                          <Badge variant={statusBadgeVariant(offer.status)}>
                            {offer.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {offer.startup_sector}
                        </div>
                        <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <div className="text-muted-foreground">
                              {t.amount}
                            </div>
                            <div className="font-medium">
                              {formatCurrency(
                                offer.offered_amount,
                                wallet.currency_code,
                                locale,
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              {t.impliedEquity}
                            </div>
                            <div className="font-medium">
                              {formatPercentage(
                                offer.implied_equity_percentage,
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              {t.valuationAtOffer}
                            </div>
                            <div className="font-medium">
                              {formatCurrency(
                                offer.valuation_at_offer,
                                wallet.currency_code,
                                locale,
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              {t.date}
                            </div>
                            <div className="font-medium">
                              {new Date(offer.created_at).toLocaleDateString(
                                locale,
                              )}
                            </div>
                          </div>
                        </div>
                        {offer.note && (
                          <div className="rounded-xl border border-white/10 bg-muted/20 p-3 text-sm">
                            {offer.note}
                          </div>
                        )}
                      </div>

                      {onCancelOffer && offer.status === "pending" && (
                        <div className="flex shrink-0 items-start">
                          <Button
                            variant="outline"
                            onClick={() => onCancelOffer(offer.id)}
                          >
                            {t.cancelOffer}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 shadow-lg">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>{t.sectorExposure}</CardTitle>
            <CardDescription>{t.sectorDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            {chartData.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                {t.noExposure}
              </div>
            ) : (
              <>
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-[280px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={72}
                      outerRadius={104}
                      strokeWidth={4}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      verticalAlign="bottom"
                      content={<ChartLegendContent />}
                    />
                  </PieChart>
                </ChartContainer>

                <div className="space-y-3">
                  {summary.sectorBreakdown.map((sector) => (
                    <div
                      key={sector.sector}
                      className="rounded-xl border border-white/10 bg-muted/10 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{sector.sector}</div>
                          <div className="text-sm text-muted-foreground">
                            {exposureLabel(sector.exposureType)}
                          </div>
                        </div>
                        <Badge variant="outline">{sector.count}</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <div className="text-muted-foreground">
                            {t.acceptedExposure}
                          </div>
                          <div className="font-medium">
                            {formatCurrency(
                              sector.acceptedAmount,
                              wallet.currency_code,
                              locale,
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            {t.pendingExposure}
                          </div>
                          <div className="font-medium">
                            {formatCurrency(
                              sector.pendingAmount,
                              wallet.currency_code,
                              locale,
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 shadow-lg">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>{t.acceptedPositions}</CardTitle>
            <CardDescription>{t.acceptedDescription}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {summary.positions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {t.noAccepted}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.startup}</TableHead>
                    <TableHead>{t.sector}</TableHead>
                    <TableHead>{t.amount}</TableHead>
                    <TableHead>{t.equity}</TableHead>
                    <TableHead>{t.entryValuation}</TableHead>
                    <TableHead>{t.currentValuation}</TableHead>
                    <TableHead>{t.currentValue}</TableHead>
                    <TableHead>{t.gainLoss}</TableHead>
                    <TableHead>{t.returnPct}</TableHead>
                    <TableHead>{t.date}</TableHead>
                    <TableHead>{t.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.positions.map((position) => (
                    <TableRow key={position.investment_id}>
                      <TableCell>
                        <div className="font-medium">
                          {position.startup_name}
                        </div>
                      </TableCell>
                      <TableCell>{position.sector}</TableCell>
                      <TableCell>
                        {formatCurrency(
                          position.amount_invested,
                          wallet.currency_code,
                          locale,
                        )}
                      </TableCell>
                      <TableCell>
                        {formatPercentage(position.equity_percentage)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          position.valuation_at_investment,
                          wallet.currency_code,
                          locale,
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          position.current_valuation,
                          wallet.currency_code,
                          locale,
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          position.current_paper_value,
                          wallet.currency_code,
                          locale,
                        )}
                      </TableCell>
                      <TableCell
                        className={
                          position.gain_loss >= 0
                            ? "text-emerald-600"
                            : "text-red-500"
                        }
                      >
                        {formatCurrency(
                          position.gain_loss,
                          wallet.currency_code,
                          locale,
                        )}
                      </TableCell>
                      <TableCell>
                        {formatPercentage(position.return_percentage)}
                      </TableCell>
                      <TableCell>
                        {new Date(position.invested_at).toLocaleDateString(
                          locale,
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(position.status)}>
                          {position.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {timeline.length > 1 && (
          <Card className="border-white/10 shadow-lg">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Portfolio Value Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ChartContainer
                config={{ value: { label: "Portfolio Value (SAR)", color: "hsl(var(--primary))" } }}
                className="h-52"
              >
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        <Card className="border-white/10 shadow-lg">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>{t.recentActivity}</CardTitle>
            <CardDescription>{t.recentDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {summary.recentActivity.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                {t.noActivity}
              </div>
            ) : (
              summary.recentActivity.map((activity) => {
                const Icon = activityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 rounded-xl border border-white/10 bg-muted/10 p-4"
                  >
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString(locale)}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      {typeof activity.amount === "number" && (
                        <div className="mt-2 text-sm font-medium">
                          {formatCurrency(
                            activity.amount,
                            wallet.currency_code,
                            locale,
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvestorPortfolioSection;
