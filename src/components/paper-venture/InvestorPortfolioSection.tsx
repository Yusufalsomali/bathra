import {
  ArrowUpRight,
  BadgeDollarSign,
  Landmark,
  PieChart as PieChartIcon,
  Wallet,
} from "lucide-react";
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
import { Cell, Pie, PieChart } from "recharts";
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

const formatCurrency = (amount: number, currencyCode = "SAR") =>
  new Intl.NumberFormat("en-SA", {
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
  if (!summary) {
    return null;
  }

  const wallet = summary.wallet;
  const chartData = summary.sectorBreakdown.map((sector, index) => ({
    name: sector.sector,
    value: sector.currentValue,
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
      label: "Available simulated cash",
      value: formatCurrency(wallet.available_balance, wallet.currency_code),
      description: "Ready for new venture offers",
      icon: Wallet,
    },
    {
      label: "Reserved in pending offers",
      value: formatCurrency(wallet.total_pending_offers, wallet.currency_code),
      description: "Held until the startup responds",
      icon: Landmark,
    },
    {
      label: "Accepted investments",
      value: formatCurrency(
        wallet.total_accepted_investments,
        wallet.currency_code
      ),
      description: "Capital deployed into startups",
      icon: BadgeDollarSign,
    },
    {
      label: "Current paper portfolio value",
      value: formatCurrency(wallet.total_portfolio_value, wallet.currency_code),
      description: `P/L ${formatCurrency(wallet.current_gain_loss, wallet.currency_code)}`,
      icon: PieChartIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Paper Venture Portfolio</h2>
          <p className="text-muted-foreground">
            All balances and investments below are simulated for Bathra demo and
            academic use only.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={onAddFunds}>
            Add Virtual Funds
          </Button>
          {onOpenPortfolio && (
            <Button onClick={onOpenPortfolio} className="gap-2">
              Open Full Portfolio
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="neo-blur border-white/10">
              <CardHeader className="pb-2">
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-2xl">{card.value}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{card.description}</span>
                <Icon className="h-4 w-4" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="neo-blur border-white/10">
          <CardHeader>
            <CardTitle>Portfolio positions</CardTitle>
            <CardDescription>
              Accepted simulated venture positions marked against current startup
              valuations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.positions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No accepted paper investments yet. Browse matched startups and
                make an offer to start building your venture portfolio.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Startup</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Equity</TableHead>
                    <TableHead>Current valuation</TableHead>
                    <TableHead>Current value</TableHead>
                    <TableHead>P/L</TableHead>
                    <TableHead>Return</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.positions.slice(0, 5).map((position) => (
                    <TableRow key={position.investment_id}>
                      <TableCell>
                        <div className="font-medium">{position.startup_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Entry {formatCurrency(position.valuation_at_investment)}
                        </div>
                      </TableCell>
                      <TableCell>{position.sector}</TableCell>
                      <TableCell>
                        {formatCurrency(position.amount_invested)}
                      </TableCell>
                      <TableCell>
                        {formatPercentage(position.equity_percentage)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(position.current_valuation)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(position.current_paper_value)}
                      </TableCell>
                      <TableCell
                        className={
                          position.gain_loss >= 0
                            ? "text-emerald-600"
                            : "text-red-500"
                        }
                      >
                        {formatCurrency(position.gain_loss)}
                      </TableCell>
                      <TableCell>{formatPercentage(position.return_percentage)}</TableCell>
                      <TableCell>
                        {new Date(position.invested_at).toLocaleDateString()}
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

        <Card className="neo-blur border-white/10">
          <CardHeader>
            <CardTitle>Sector exposure</CardTitle>
            <CardDescription>
              Breakdown of simulated capital by startup sector.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chartData.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                Sector allocation appears after your first accepted investment.
              </div>
            ) : (
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
                    innerRadius={70}
                    outerRadius={105}
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
            )}

            <div className="space-y-3">
              {summary.pendingOffers.slice(0, 3).map((offer) => (
                <div
                  key={offer.id}
                  className="rounded-lg border border-white/10 bg-background/60 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{offer.startup_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Pending offer · {offer.startup_sector}
                      </div>
                    </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(offer.offered_amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatPercentage(offer.implied_equity_percentage)} implied
                        </div>
                      </div>
                    </div>
                    {onCancelOffer && offer.status === "pending" && (
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancelOffer(offer.id)}
                        >
                          Cancel offer
                        </Button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvestorPortfolioSection;
