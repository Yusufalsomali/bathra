import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bookmark,
  ExternalLink,
  MessageCircle,
  File,
  Heart,
  CheckCircle,
  Landmark,
  Calendar,
} from "lucide-react";
import InfoRequestModal from "@/components/InfoRequestModal";
import PaperInvestDialog from "@/components/paper-venture/PaperInvestDialog";
import { useAuth } from "@/context/AuthContext";
import { PaperVentureService } from "@/lib/paper-venture-service";
import { toast } from "@/hooks/use-toast";
import { PaperWalletSummary } from "@/lib/paper-venture-types";

type StartupDetailProps = {
  startup: {
    id: string;
    name: string;
    industry: string;
    stage: string;
    funding_required: string;
    valuation: string;
    document_path?: string;
    business_model?: string;
    key_metrics?: string;
    founders?: string;
    website?: string;
    contact_email?: string;
    investment_terms?: string;
    description?: string;
    video_url?: string;
    market_analysis?: string;
    competition?: string;
    financials?: string;
    startup_name?: string;
    email?: string;
    funding_goal?: number;
    valuation_amount?: number;
    already_raised_amount?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isSaved: boolean;
  onRequestInfo: () => void;
  onInterested?: () => void;
  isInterested?: boolean;
};

const StartupDetailModal: React.FC<StartupDetailProps> = ({
  startup,
  isOpen,
  onClose,
  onSave,
  isSaved,
  onRequestInfo,
  onInterested,
  isInterested = false,
}) => {
  const [isInfoRequestModalOpen, setIsInfoRequestModalOpen] = useState(false);
  const [isInvestDialogOpen, setIsInvestDialogOpen] = useState(false);
  const [walletSummary, setWalletSummary] = useState<PaperWalletSummary | null>(
    null
  );
  const [remainingFundingGoal, setRemainingFundingGoal] = useState<number | null>(
    startup.funding_goal
      ? Math.max(
          startup.funding_goal - (startup.already_raised_amount || 0),
          0
        )
      : null
  );
  const { user, profile } = useAuth();

  const handleRequestInfo = () => {
    setIsInfoRequestModalOpen(true);
  };

  useEffect(() => {
    const loadPaperContext = async () => {
      if (!isOpen || !user?.id || profile?.accountType !== "investor") {
        return;
      }

      const [portfolioResult, startupDashboardResult] = await Promise.all([
        PaperVentureService.getInvestorPortfolioSummary(user.id),
        PaperVentureService.getStartupInvestmentDashboard(startup.id),
      ]);

      if (portfolioResult.data) {
        setWalletSummary(portfolioResult.data.wallet);
      }

      if (startupDashboardResult.data) {
        const capTable = startupDashboardResult.data.capTable;
        setRemainingFundingGoal(
          capTable.funding_goal > 0
            ? Math.max(capTable.funding_goal - capTable.total_simulated_raised, 0)
            : null
        );
      }
    };

    loadPaperContext();
  }, [isOpen, profile?.accountType, startup.id, user?.id]);

  const handlePaperInvest = async (amount: number, note?: string) => {
    if (!user?.id) return;

    const result = await PaperVentureService.createInvestmentOffer({
      investorId: user.id,
      startupId: startup.id,
      amount,
      note,
    });

    if (result.error) {
      toast({
        title: "Offer could not be created",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Simulated investment offer submitted",
      description:
        "Your virtual funds are now reserved until the startup reviews this paper venture offer.",
    });

    const portfolioResult = await PaperVentureService.getInvestorPortfolioSummary(
      user.id
    );
    if (portfolioResult.data) {
      setWalletSummary(portfolioResult.data.wallet);
    }
    if (remainingFundingGoal !== null) {
      setRemainingFundingGoal(Math.max(remainingFundingGoal - amount, 0));
    }
  };
  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] sm:h-[80vh] flex flex-col w-[95vw] sm:w-full">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold break-words">
                {startup.name}
              </DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full">
                  {startup.industry}
                </span>
                <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full">
                  {startup.stage}
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              
              {startup.website && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const url = startup.website?.startsWith("http")
                            ? startup.website
                            : `https://${startup.website}`;
                          window.open(url, "_blank");
                        }}
                      >
                        <ExternalLink className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Go to startup's website</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-grow overflow-auto pt-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="overview" className="text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="business" className="text-sm">
                Business
              </TabsTrigger>
              <TabsTrigger value="team" className="text-sm">
                Team
              </TabsTrigger>
              <TabsTrigger value="financials" className="text-sm">
                Financials
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">About</h3>
                <p className="text-gray-700">{startup.description}</p>
              </div>

              {startup.video_url && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Pitch Video</h3>
                  <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-500">
                      Video player would appear here
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Funding Sought</h3>
                  <p className="text-lg sm:text-xl font-bold break-words">
                    {startup.funding_required}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Valuation</h3>
                  <p className="text-lg sm:text-xl font-bold break-words">
                    {startup.valuation}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Simulated paper venture investing only
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Bathra uses virtual money for academic/demo venture scenarios.
                  No real payment, legal transfer, or live securities transaction
                  takes place here.
                </p>
                {walletSummary && (
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Your available simulated balance:{" "}
                    {new Intl.NumberFormat("en-SA", {
                      style: "currency",
                      currency: walletSummary.currency_code || "SAR",
                      maximumFractionDigits: 0,
                    }).format(walletSummary.available_balance)}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Business Model</h3>
                <p className="text-gray-700">
                  {startup.business_model || "Information not provided"}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Market Analysis</h3>
                <p className="text-gray-700">
                  {startup.market_analysis || "Information not provided"}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">
                  Competitive Landscape
                </h3>
                <p className="text-gray-700">
                  {startup.competition || "Information not provided"}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Key Metrics</h3>
                <p className="text-gray-700">
                  {startup.key_metrics || "Information not provided"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Founders</h3>
                <p className="text-gray-700">
                  {startup.founders || "Information not provided"}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">
                  Contact Information
                </h3>
                <p className="text-gray-700">
                  {startup.contact_email && (
                    <a
                      href={`mailto:${startup.contact_email}`}
                      className="text-primary hover:underline"
                    >
                      {startup.contact_email}
                    </a>
                  )}
                  {!startup.contact_email && "Information not provided"}
                </p>
                <p className="text-gray-700 mt-1">
                  {startup.website && (
                    <a
                      href={`https://${startup.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {startup.website}
                    </a>
                  )}
                </p>
                {startup.calendly_link && (
                  <div className="mt-3">
                    <a
                      href={startup.calendly_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule a Meeting
                    </a>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="financials" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Financial Projections
                </h3>
                <p className="text-gray-700">
                  {startup.financials || "Information not provided"}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Investment Terms</h3>
                <p className="text-gray-700">
                  {startup.investment_terms || "Information not provided"}
                </p>
              </div>

              {startup.document_path && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Documents</h3>
                  <Button variant="outline" className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    Download Pitch Deck
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="pt-4 border-t mt-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={handleRequestInfo}
              variant="outline"
              className="gap-2 w-full sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden xs:inline">Request More Info</span>
              <span className="xs:hidden">Request Info</span>
            </Button>
            {onInterested && (
              <Button
                onClick={onInterested}
                className="gap-2 w-full sm:w-auto"
                variant={isInterested ? "secondary" : "default"}
                disabled={isInterested}
              >
                {isInterested ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden xs:inline">Interest Shown</span>
                    <span className="xs:hidden">Interested</span>
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    <span className="hidden xs:inline">I'm Interested</span>
                    <span className="xs:hidden">Interested</span>
                  </>
                )}
              </Button>
            )}
            {profile?.accountType === "investor" && (
              <Button
                onClick={() => setIsInvestDialogOpen(true)}
                className="gap-2 w-full sm:w-auto"
              >
                <Landmark className="h-4 w-4" />
                Invest With Virtual Funds
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Info Request Modal */}
      <InfoRequestModal
        isOpen={isInfoRequestModalOpen}
        onClose={() => setIsInfoRequestModalOpen(false)}
        startup={{
          id: startup.id,
          name: startup.name,
          startup_name: startup.startup_name || startup.name,
          email: startup.email || startup.contact_email || "",
          industry: startup.industry,
          stage: startup.stage || "",
          verified: true,
          description: startup.description || "",
          founders: startup.founders || "",
        }}
      />
    </Dialog>
      <PaperInvestDialog
        open={isInvestDialogOpen}
        onOpenChange={setIsInvestDialogOpen}
        startup={startup}
        availableBalance={walletSummary?.available_balance || 0}
        remainingFundingGoal={remainingFundingGoal}
        onConfirm={handlePaperInvest}
      />
    </>
  );
};

export default StartupDetailModal;
