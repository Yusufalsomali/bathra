import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase, Startup } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  ArrowLeft,
  ExternalLink,
  DollarSign,
  Users,
  Key,
  MoreVertical,
  TrendingUp,
} from "lucide-react";
import StartupProfileEditModal from "@/components/StartupProfileEditModal";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { TranslationKey } from "@/context/LanguageContext";
import { PaperVentureService } from "@/lib/paper-venture-service";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SocialMediaAccount {
  platform: string;
  url: string;
}

interface CoFounder {
  name: string;
  role?: string;
  email?: string;
  linkedin?: string;
}

interface AdditionalFile {
  name: string;
  url: string;
  type?: string;
}

const StartupProfile = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [startupDetails, setStartupDetails] = useState<Startup | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [valuationInput, setValuationInput] = useState("");
  const [valuationReason, setValuationReason] = useState("");
  const [isUpdatingValuation, setIsUpdatingValuation] = useState(false);

  useEffect(() => {
    const fetchStartupDetails = async () => {
      try {
        if (!user?.id) return;

        const { data, error } = await supabase
          .from("startups")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setStartupDetails(data);
        }
      } catch (error) {
        console.error("Error fetching startup details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) {
      navigate("/login");
    } else {
      fetchStartupDetails();
    }
  }, [user, navigate]);

  const handleProfileUpdate = (updatedStartup: Startup) => {
    setStartupDetails(updatedStartup);
  };

  const handleValuationUpdate = async () => {
    const amount = parseFloat(valuationInput.replace(/,/g, ""));
    if (!amount || amount <= 0 || !user?.id) return;
    setIsUpdatingValuation(true);
    const { error } = await PaperVentureService.updateStartupValuation({
      startupId: user.id,
      valuation: amount,
      reason: valuationReason || "Self-reported valuation update",
    });
    setIsUpdatingValuation(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Valuation updated", description: `Pre-money valuation set to SAR ${amount.toLocaleString()}` });
      setValuationInput("");
      setValuationReason("");
      const { data } = await supabase.from("startups").select("*").eq("id", user.id).single();
      if (data) setStartupDetails(data);
    }
  };

  const handleViewPitchDeck = async (pitchDeckUrl: string) => {
    try {
      console.log("pitchDeckUrl", pitchDeckUrl);

      // Since we're using a public bucket, we can open URLs directly
      // Just validate the URL exists and is accessible
      if (pitchDeckUrl && pitchDeckUrl.trim() !== "") {
        window.open(pitchDeckUrl, "_blank");
      } else {
        console.error("No pitch deck URL provided");
      }
    } catch (error) {
      console.error("Error opening pitch deck:", error);
      // Try to open anyway as fallback
      if (pitchDeckUrl) {
        window.open(pitchDeckUrl, "_blank");
      }
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
              {t("loadingProfile" as TranslationKey)}
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
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                onClick={() => navigate("/startup-dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("backToDashboard" as TranslationKey)}
              </Button>

              {/* Desktop buttons */}
              <div className="ml-auto hidden sm:flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Key className="h-4 w-4" />
                  {t("changePasswordButton")}
                </Button>
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  disabled={!startupDetails}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t("editProfile" as TranslationKey)}
                </Button>
              </div>

              {/* Mobile dropdown */}
              <div className="ml-auto sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setIsEditModalOpen(true)}
                      disabled={!startupDetails}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {t("editProfile" as TranslationKey)}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsChangePasswordModalOpen(true)}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      {t("changePasswordButton")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-4">
              {t("startupProfileTitle" as TranslationKey)}
            </h1>

            {/* Profile Content */}
            <div className="neo-blur rounded-2xl shadow-lg p-8">
              {/* Basic Information */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
                    {startupDetails?.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {startupDetails?.name ||
                        t("startupNamePlaceholder" as TranslationKey)}
                    </h2>
                    <p className="text-muted-foreground">
                      {startupDetails?.industry ||
                        t("industryPlaceholder" as TranslationKey)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          startupDetails?.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {startupDetails?.status === "approved"
                          ? t("statusApproved" as TranslationKey)
                          : t("pendingVerification" as TranslationKey)}
                      </span>
                    </div>
                  </div>
                </div>

                {startupDetails?.website && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(startupDetails.website, "_blank")
                    }
                    className="mb-6"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("visitWebsite" as TranslationKey)}
                  </Button>
                )}
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Company Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {t("companyInfo" as TranslationKey)}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelIndustry" as TranslationKey)}
                        </label>
                        <p className="text-foreground">
                          {startupDetails?.industry ||
                            t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelStage" as TranslationKey)}
                        </label>
                        <p className="text-foreground">
                          {startupDetails?.stage ||
                            t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelTeamSize" as TranslationKey)}
                        </label>
                        <p className="text-foreground">
                          {startupDetails?.team_size ||
                            t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelSocialMedia" as TranslationKey)}
                        </label>
                        <div className="text-foreground">
                          {startupDetails?.social_media_accounts ? (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {(() => {
                                try {
                                  const socialMedia = JSON.parse(
                                    startupDetails.social_media_accounts
                                  );
                                  return Array.isArray(socialMedia)
                                    ? socialMedia.map(
                                        (
                                          account: SocialMediaAccount,
                                          index: number
                                        ) => (
                                          <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              window.open(account.url, "_blank")
                                            }
                                            className="text-xs"
                                          >
                                            <ExternalLink className="mr-1 h-3 w-3" />
                                            {account.platform}
                                          </Button>
                                        )
                                      )
                                    : null;
                                } catch {
                                  return (
                                    <span className="text-sm break-words">
                                      {startupDetails.social_media_accounts}
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          ) : (
                            <p className="text-sm">
                              {t("notSpecified" as TranslationKey)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Funding Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {t("fundingInfo" as TranslationKey)}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelCapitalSeeking" as TranslationKey)}
                        </label>
                        <p className="text-foreground flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          {startupDetails?.capital_seeking
                            ? `$${startupDetails.capital_seeking.toLocaleString()}`
                            : t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelFundingRaised" as TranslationKey)}
                        </label>
                        <p className="text-foreground flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          {startupDetails?.funding_already_raised
                            ? `$${startupDetails.funding_already_raised.toLocaleString()}`
                            : t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelPreMoneyValuation" as TranslationKey)}
                        </label>
                        <p className="text-foreground">
                          {startupDetails?.pre_money_valuation ||
                            t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {t("about" as TranslationKey)}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelProblem" as TranslationKey)}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.problem_solving ||
                            t("noDescriptionProvided" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelSolution" as TranslationKey)}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.solution ||
                            t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelUniqueness" as TranslationKey)}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.uniqueness ||
                            t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelCoFounders" as TranslationKey)}
                        </label>
                        <div className="text-foreground mt-1">
                          {startupDetails?.co_founders ? (
                            <div className="space-y-2">
                              {(() => {
                                try {
                                  const coFounders = JSON.parse(
                                    startupDetails.co_founders
                                  );
                                  return Array.isArray(coFounders)
                                    ? coFounders.map(
                                        (founder: CoFounder, index: number) => (
                                          <div
                                            key={index}
                                            className="bg-muted/50 rounded-lg p-3 text-sm"
                                          >
                                            <div className="font-medium">
                                              {founder.name}
                                            </div>
                                            {founder.role && (
                                              <div className="text-muted-foreground text-xs">
                                                {founder.role}
                                              </div>
                                            )}
                                            {founder.email && (
                                              <div className="text-xs mt-1">
                                                <a
                                                  href={`mailto:${founder.email}`}
                                                  className="text-primary hover:underline"
                                                >
                                                  {founder.email}
                                                </a>
                                              </div>
                                            )}
                                            {founder.linkedin && (
                                              <div className="text-xs mt-1">
                                                <a
                                                  href={founder.linkedin}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-primary hover:underline flex items-center gap-1"
                                                >
                                                  <ExternalLink className="h-3 w-3" />
                                                  LinkedIn
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      )
                                    : null;
                                } catch {
                                  return (
                                    <span className="text-sm break-words">
                                      {startupDetails.co_founders}
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          ) : (
                            <p className="text-sm">
                              {t("notSpecified" as TranslationKey)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {t("financialDetails" as TranslationKey)}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelPrevYearRevenue" as TranslationKey)}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.previous_financial_year_revenue
                            ? `$${startupDetails.previous_financial_year_revenue.toLocaleString()}`
                            : t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelCurrentYearRevenue" as TranslationKey)}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.current_financial_year_revenue
                            ? `$${startupDetails.current_financial_year_revenue.toLocaleString()}`
                            : t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelMonthlyBurn" as TranslationKey)}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.monthly_burn_rate
                            ? `$${startupDetails.monthly_burn_rate.toLocaleString()}`
                            : t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelInvestmentInstrument" as TranslationKey)}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.investment_instrument ||
                            t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelHasReceivedFunding" as TranslationKey)}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.has_received_funding !== undefined
                            ? startupDetails.has_received_funding
                              ? t("yes" as TranslationKey)
                              : t("no" as TranslationKey)
                            : t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Traction & Growth */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {t("tractionAndGrowth" as TranslationKey)}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelKeyAchievements" as TranslationKey)}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.achievements ||
                            t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelRisks" as TranslationKey)}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.risks ||
                            t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelRiskMitigation" as TranslationKey)}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.risk_mitigation ||
                            t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("labelExitStrategy" as TranslationKey)}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.exit_strategy ||
                            t("notSpecified" as TranslationKey)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t(
                            "labelParticipatedInAccelerator" as TranslationKey
                          )}
                        </label>
                        <p className="text-foreground text-sm leading-relaxed mt-1">
                          {startupDetails?.participated_in_accelerator
                            ? t("yes" as TranslationKey)
                            : t("no" as TranslationKey)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Team & Resources */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {t("teamAndResources" as TranslationKey)}
                    </h3>
                    <div className="space-y-4">
                      {/* Video Link */}
                      {startupDetails?.video_link && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            {t("videoPresentation" as TranslationKey)}
                          </label>
                          <div className="mt-1">
                            <Button
                              variant="outline"
                              onClick={() =>
                                window.open(startupDetails.video_link, "_blank")
                              }
                              className="text-sm"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              {t("watchVideo" as TranslationKey)}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Pitch Deck */}
                      {startupDetails?.pitch_deck && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            {t("pitchDeck" as TranslationKey)}
                          </label>
                          <div className="mt-1">
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleViewPitchDeck(startupDetails.pitch_deck!)
                              }
                              className="text-sm"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              {t("viewPitchDeck" as TranslationKey)}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Additional Files */}
                      {startupDetails?.additional_files && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            {t("additionalFiles" as TranslationKey)}
                          </label>
                          <div className="mt-1">
                            {(() => {
                              try {
                                const files = JSON.parse(
                                  startupDetails.additional_files
                                );
                                return Array.isArray(files) ? (
                                  <div className="flex flex-wrap gap-2">
                                    {files.map(
                                      (file: AdditionalFile, index: number) => (
                                        <Button
                                          key={index}
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            window.open(file.url, "_blank")
                                          }
                                          className="text-xs"
                                        >
                                          <ExternalLink className="mr-1 h-3 w-3" />
                                          {file.name}
                                          {file.type && (
                                            <span className="ml-1 text-muted-foreground">
                                              ({file.type})
                                            </span>
                                          )}
                                        </Button>
                                      )
                                    )}
                                  </div>
                                ) : null;
                              } catch {
                                return (
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      window.open(
                                        startupDetails.additional_files!,
                                        "_blank"
                                      )
                                    }
                                    className="text-sm"
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    {t("viewFiles" as TranslationKey)}
                                  </Button>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Valuation Update Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Update Pre-Money Valuation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {startupDetails?.pre_money_valuation && (
                  <p className="text-sm text-muted-foreground">
                    Current valuation:{" "}
                    <span className="font-semibold text-foreground">
                      SAR {Number(startupDetails.pre_money_valuation).toLocaleString()}
                    </span>
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="New valuation in SAR (e.g. 10000000)"
                    value={valuationInput}
                    onChange={(e) => setValuationInput(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Textarea
                  placeholder="Reason for update (optional)"
                  value={valuationReason}
                  onChange={(e) => setValuationReason(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={handleValuationUpdate}
                  disabled={!valuationInput || isUpdatingValuation}
                  className="w-full"
                >
                  {isUpdatingValuation ? "Updating…" : "Update Valuation"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Edit Profile Modal */}
      {startupDetails && (
        <StartupProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          startup={startupDetails}
          onUpdate={handleProfileUpdate}
        />
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={isChangePasswordModalOpen}
        onOpenChange={setIsChangePasswordModalOpen}
      />

      <Footer />
    </div>
  );
};

export default StartupProfile;
