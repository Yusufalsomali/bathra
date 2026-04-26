import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, LineChart, WalletCards, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PaperVentureService } from "@/lib/paper-venture-service";
import {
  StartupPaperInvestmentDashboard,
  InvestorPaperProfilePreview,
} from "@/lib/paper-venture-types";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

const statusVariant = (status: string) => {
  switch (status) {
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

const InvestorPreviewDialog = ({
  preview,
  open,
  onOpenChange,
}: {
  preview: InvestorPaperProfilePreview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Investor paper portfolio preview</DialogTitle>
      </DialogHeader>
      {preview && (
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-lg font-semibold">{preview.name}</div>
            <div className="text-muted-foreground">
              {[preview.role, preview.company].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground">Deployed capital</div>
              <div className="text-lg font-semibold">
                {formatCurrency(preview.totalDeployedCapital)}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground">Portfolio value</div>
              <div className="text-lg font-semibold">
                {formatCurrency(preview.portfolioValue)}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground">Startups invested in</div>
              <div className="text-lg font-semibold">
                {preview.startupsInvestedCount}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground">Pending offers</div>
              <div className="text-lg font-semibold">
                {preview.pendingOffersCount}
              </div>
            </div>
          </div>
          <div>
            <div className="font-medium">Preferred sectors</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {preview.preferredIndustries.length > 0 ? (
                preview.preferredIndustries.map((industry) => (
                  <Badge key={industry} variant="secondary">
                    {industry}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">No sectors specified</span>
              )}
            </div>
          </div>
          <div>
            <div className="font-medium">Sectors already invested in</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {preview.sectorsInvestedIn.length > 0 ? (
                preview.sectorsInvestedIn.map((sector) => (
                  <Badge key={sector} variant="outline">
                    {sector}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">
                  No accepted investments yet
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
);

const StartupPaperInvestmentHub = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] =
    useState<StartupPaperInvestmentDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvestor, setSelectedInvestor] =
    useState<InvestorPaperProfilePreview | null>(null);
  const [valuationInput, setValuationInput] = useState("");
  const [valuationReason, setValuationReason] = useState("");
  const [isUpdatingValuation, setIsUpdatingValuation] = useState(false);

  const loadDashboard = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    const result = await PaperVentureService.getStartupInvestmentDashboard(
      user.id
    );

    if (result.error) {
      toast({
        title: "Unable to load paper investing",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setDashboard(result.data);
      setValuationInput(
        result.data?.capTable.current_valuation
          ? String(result.data.capTable.current_valuation)
          : ""
      );
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, [user?.id]);

  const pendingOffers = useMemo(
    () => dashboard?.offers.filter((offer) => offer.status === "pending") || [],
    [dashboard]
  );

  const handleOfferAction = async (
    offerId: string,
    action: "accept" | "reject"
  ) => {
    const result =
      action === "accept"
        ? await PaperVentureService.acceptOffer(offerId)
        : await PaperVentureService.updateOfferStatus(offerId, "rejected");

    if (result.error) {
      toast({
        title: "Offer update failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: action === "accept" ? "Offer accepted" : "Offer rejected",
      description:
        action === "accept"
          ? "The simulated investment is now part of the startup cap table."
          : "Reserved virtual funds were released back to the investor wallet.",
    });
    loadDashboard();
  };

  const handleUpdateValuation = async () => {
    if (!user?.id || !valuationInput) return;

    setIsUpdatingValuation(true);
    const result = await PaperVentureService.updateStartupValuation({
      startupId: user.id,
      valuation: Number(valuationInput),
      reason: valuationReason || undefined,
    });
    setIsUpdatingValuation(false);

    if (result.error) {
      toast({
        title: "Valuation update failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Valuation updated",
      description:
        "Investor paper values will now reflect the latest simulated startup valuation.",
    });
    loadDashboard();
  };

  if (isLoading || !dashboard) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="neo-blur border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletCards className="h-5 w-5" />
            Incoming paper investment offers
          </CardTitle>
          <CardDescription>
            These are simulated venture offers from matched investors. Accepting
            one moves it into your paper cap table only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingOffers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              No pending offers yet. Investors can make paper offers from their
              matched startup list.
            </div>
          ) : (
            pendingOffers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl border border-white/10 bg-background/60 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{offer.investor_name}</h3>
                      <Badge variant={statusVariant(offer.status)}>
                        {offer.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {offer.startup_sector} thesis · offered{" "}
                      {formatCurrency(offer.offered_amount)} for{" "}
                      {formatPercentage(offer.implied_equity_percentage)} implied
                      ownership at offer valuation.
                    </p>
                    {offer.note && (
                      <p className="rounded-lg border border-white/10 bg-background/80 p-3 text-sm">
                        {offer.note}
                      </p>
                    )}
                    {offer.investor && (
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>
                          Deployed {formatCurrency(offer.investor.totalDeployedCapital)}
                        </span>
                        <span>·</span>
                        <span>
                          {offer.investor.startupsInvestedCount} simulated startup
                          positions
                        </span>
                        <span>·</span>
                        <span>
                          {offer.investor.preferredIndustries.slice(0, 2).join(", ") ||
                            "No preferred sectors listed"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 lg:w-[220px]">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedInvestor(offer.investor || null)}
                      disabled={!offer.investor}
                    >
                      Review investor
                    </Button>
                    <Button
                      onClick={() => handleOfferAction(offer.id, "accept")}
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleOfferAction(offer.id, "reject")}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

          {dashboard.offers.filter((offer) => offer.status !== "pending").length >
            0 && (
            <div className="rounded-xl border border-white/10 bg-background/40 p-4">
              <div className="mb-3 font-medium">Offer history</div>
              <div className="space-y-2">
                {dashboard.offers
                  .filter((offer) => offer.status !== "pending")
                  .slice(0, 4)
                  .map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span>
                        {offer.investor_name} · {formatCurrency(offer.offered_amount)}
                      </span>
                      <Badge variant={statusVariant(offer.status)}>
                        {offer.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="neo-blur border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Simulated cap table
            </CardTitle>
            <CardDescription>
              Accepted paper investments only. Ownership percentages stay fixed
              after acceptance, while paper values change with valuation updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <div className="text-sm text-muted-foreground">Raised</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(dashboard.capTable.total_simulated_raised)}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm text-muted-foreground">Current valuation</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(dashboard.capTable.current_valuation)}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Funding goal progress</span>
                <span>
                  {formatCurrency(dashboard.capTable.total_simulated_raised)} /{" "}
                  {formatCurrency(dashboard.capTable.funding_goal)}
                </span>
              </div>
              <Progress value={dashboard.capTable.funding_progress_percentage} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <div className="text-sm text-muted-foreground">Total equity sold</div>
                <div className="text-xl font-semibold">
                  {formatPercentage(dashboard.capTable.total_equity_sold)}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm text-muted-foreground">
                  Remaining equity available
                </div>
                <div className="text-xl font-semibold">
                  {formatPercentage(dashboard.capTable.remaining_equity_available)}
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Equity</TableHead>
                  <TableHead>Current paper value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.capTable.entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No accepted paper investments yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  dashboard.capTable.entries.map((entry) => (
                    <TableRow key={`${entry.investor_id}-${entry.invested_at}`}>
                      <TableCell>{entry.investor_name}</TableCell>
                      <TableCell>{formatCurrency(entry.amount_invested)}</TableCell>
                      <TableCell>{formatPercentage(entry.equity_percentage)}</TableCell>
                      <TableCell>{formatCurrency(entry.current_paper_value)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="neo-blur border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Update simulated valuation
            </CardTitle>
            <CardDescription>
              Use this when the startup makes progress in the demo. Existing
              investor ownership stays fixed, but portfolio values will refresh.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="startup-valuation">Current valuation (SAR)</Label>
              <Input
                id="startup-valuation"
                type="number"
                min="1"
                step="1000"
                value={valuationInput}
                onChange={(event) => setValuationInput(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startup-valuation-reason">Why did it change?</Label>
              <Textarea
                id="startup-valuation-reason"
                value={valuationReason}
                onChange={(event) => setValuationReason(event.target.value)}
                placeholder="Example: secured pilot customers, launched MVP, expanded team"
              />
            </div>
            <Button onClick={handleUpdateValuation} disabled={isUpdatingValuation}>
              {isUpdatingValuation ? "Updating..." : "Update Valuation"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <InvestorPreviewDialog
        preview={selectedInvestor}
        open={Boolean(selectedInvestor)}
        onOpenChange={(open) => !open && setSelectedInvestor(null)}
      />
    </div>
  );
};

export default StartupPaperInvestmentHub;
