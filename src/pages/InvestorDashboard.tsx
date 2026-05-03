import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase, Investor } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { User, ArrowRight } from "lucide-react";
import MatchmakingOrb from "@/components/MatchmakingOrb";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { TranslationKey } from "@/context/LanguageContext";
import InvestorBrowseStartups from "@/components/InvestorBrowseStartups";
import { PaperVentureService } from "@/lib/paper-venture-service";
import { InvestorPortfolioSummary } from "@/lib/paper-venture-types";
import InvestorPortfolioSection from "@/components/paper-venture/InvestorPortfolioSection";
import AddVirtualFundsDialog from "@/components/paper-venture/AddVirtualFundsDialog";
import { toast } from "@/hooks/use-toast";
import { StartupService } from "@/lib/startup-service";
import { PaginatedStartups } from "@/lib/startup-types";

const InvestorDashboard = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [investorDetails, setInvestorDetails] = useState<Investor | null>(null);
  const [availableStartupsCount, setAvailableStartupsCount] = useState(0);
  const [portfolioSummary, setPortfolioSummary] =
    useState<InvestorPortfolioSummary | null>(null);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  useEffect(() => {
    const fetchInvestorData = async () => {
      try {
        if (!user?.id) return;

        // Fetch investor details and matchmakings in parallel
        const [investorResult, startupsResult, portfolioResult] =
          await Promise.all([
          supabase.from("investors").select("*").eq("id", user.id).single(),
          StartupService.getVettedStartups({ limit: 1, offset: 0 }),
          PaperVentureService.getInvestorPortfolioSummary(user.id),
        ]);

        if (investorResult.error) throw investorResult.error;

        if (investorResult.data) {
          setInvestorDetails(investorResult.data);
        }
        if (portfolioResult.data) {
          setPortfolioSummary(portfolioResult.data);
        }
        if (startupsResult.data) {
          const paginatedResult = startupsResult.data as PaginatedStartups;
          setAvailableStartupsCount(paginatedResult.total || 0);
        }
      } catch (error) {
        console.error("Error fetching investor data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) {
      navigate("/login");
    } else {
      fetchInvestorData();
    }
  }, [user, navigate]);

  const handleAddFunds = async (amount: number) => {
    if (!user?.id) return;

    const result = await PaperVentureService.addVirtualFunds(user.id, amount);
    if (result.error) {
      toast({
        title: "Could not add virtual funds",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Virtual funds added",
      description:
        "Your simulated investor wallet has been topped up for Bathra venture testing.",
    });

    const portfolioResult = await PaperVentureService.getInvestorPortfolioSummary(
      user.id
    );
    if (portfolioResult.data) {
      setPortfolioSummary(portfolioResult.data);
    }
  };

  const handleCancelOffer = async (offerId: string) => {
    const result = await PaperVentureService.updateOfferStatus(
      offerId,
      "cancelled"
    );

    if (result.error) {
      toast({
        title: "Could not cancel offer",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    const portfolioResult = await PaperVentureService.getInvestorPortfolioSummary(
      user.id
    );
    if (portfolioResult.data) {
      setPortfolioSummary(portfolioResult.data);
    }
  };

  if (!user || !profile) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {t("loadingDashboard" as TranslationKey)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            {/* Dashboard Header */}
            <div className="neo-blur rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gradient">
                  {t("investorDashboardTitle" as TranslationKey)}
                </h1>
                <Button
                  onClick={() => navigate("/investor-profile")}
                  className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
                >
                  <User className="h-4 w-4" />
                  {t("viewProfile" as TranslationKey)}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-6 glass rounded-xl border border-white/10">
                <h2 className="text-xl font-semibold mb-2">
                  {t("welcomeBack" as TranslationKey)}
                  {profile?.name ||
                    t("investorRolePlaceholder" as TranslationKey)}
                </h2>
                <p className="text-muted-foreground">
                  {t("investorProfileActive" as TranslationKey)}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <InvestorPortfolioSection
                summary={portfolioSummary}
                onAddFunds={() => setIsAddFundsOpen(true)}
                onOpenPortfolio={() => navigate("/portfolio")}
                onCancelOffer={handleCancelOffer}
              />
            </div>

            {/* Matchmaking Section */}
            <div className="neo-blur rounded-2xl shadow-lg p-8">
              {availableStartupsCount > 0 ? (
                <div className="space-y-6">
                  {/* Startup Discovery Header */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gradient mb-4">
                      Browse Active Startups
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      {availableStartupsCount} approved startup
                      {availableStartupsCount !== 1 ? "s" : ""} available for
                      paper venture discovery
                    </p>
                  </div>

                  {/* Preview of Startups */}
                  <div className="mb-6">
                    <InvestorBrowseStartups
                      isDashboard={true}
                      maxStartups={3}
                    />
                  </div>

                  {/* View All Button */}
                  <div className="text-center">
                    <Button
                      onClick={() => navigate("/startups")}
                      size="lg"
                      className="gap-2"
                    >
                      View All Startups
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gradient mb-4">
                      Startup Discovery Is Opening Soon
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      No approved startups are available yet. Once startups are
                      approved, they will appear here for direct paper venture
                      investing.
                    </p>
                  </div>
                  <MatchmakingOrb userType="investor" />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <AddVirtualFundsDialog
        open={isAddFundsOpen}
        onOpenChange={setIsAddFundsOpen}
        onSubmit={handleAddFunds}
        currencyCode={portfolioSummary?.wallet.currency_code || "SAR"}
      />
    </div>
  );
};

export default InvestorDashboard;
