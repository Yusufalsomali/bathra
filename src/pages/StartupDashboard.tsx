import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase, Startup } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { User, ArrowRight, Heart, Clock } from "lucide-react";
import MatchmakingOrb from "@/components/MatchmakingOrb";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { TranslationKey } from "@/context/LanguageContext";
import { InvestorStartupConnectionService } from "@/lib/investor-startup-connection-service";
import StartupPaperInvestmentHub from "@/components/paper-venture/StartupPaperInvestmentHub";
import { StartupActivityFeed } from "@/components/startup/StartupActivityFeed";

const StartupDashboard = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [startupDetails, setStartupDetails] = useState<Startup | null>(null);
  const [interestedInvestorsCount, setInterestedInvestorsCount] = useState(0);
  const [hasBeenRegisteredFor7Days, setHasBeenRegisteredFor7Days] =
    useState(false);

  useEffect(() => {
    const fetchStartupData = async () => {
      try {
        if (!user?.id) return;

        // Fetch startup details
        const { data, error } = await supabase
          .from("startups")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setStartupDetails(data);

          // Check if startup has been registered for 7+ days
          const registrationDate = new Date(data.created_at);
          const currentDate = new Date();
          const daysSinceRegistration = Math.floor(
            (currentDate.getTime() - registrationDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          setHasBeenRegisteredFor7Days(daysSinceRegistration >= 7);

          // Fetch interested investors
          const connectionsResult =
            await InvestorStartupConnectionService.getConnections({
              startup_id: user.id,
              connection_type: "interested",
              status: "active",
            });

          if (connectionsResult.data) {
            setInterestedInvestorsCount(connectionsResult.data.length);
          }
        }
      } catch (error) {
        console.error("Error fetching startup data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) {
      navigate("/login");
    } else {
      fetchStartupData();
    }
  }, [user, navigate]);

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
                  {t("startupDashboardTitle" as TranslationKey)}
                </h1>
                <Button
                  onClick={() => navigate("/startup-profile")}
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
                  {startupDetails?.name || "Startup"}
                </h2>
                <p className="text-muted-foreground">
                  {startupDetails?.status === "approved"
                    ? t("profileApproved" as TranslationKey)
                    : t("profilePending" as TranslationKey)}
                </p>
              </div>
            </div>

            {/* Matchmaking Section */}
            <div className="neo-blur rounded-2xl shadow-lg p-8">
              {interestedInvestorsCount > 0 ? (
                // Show current dashboard when there are interested investors
                <div className="text-center py-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                  >
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gradient mb-2">
                      {t("greatNews" as TranslationKey) || "Great News!"}
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      {interestedInvestorsCount === 1
                        ? "1 investor is interested in your startup!"
                        : `${interestedInvestorsCount} investors are interested in your startup!`}
                    </p>
                  </motion.div>
                  <Button
                    onClick={() => navigate("/interested-investors")}
                    className="flex items-center gap-2 mx-auto"
                  >
                    {t("viewInterestedInvestors" as TranslationKey) ||
                      "View Interested Investors"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : hasBeenRegisteredFor7Days ? (
                // Show "no match" message after 7 days
                <div className="text-center py-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                  >
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gradient mb-4">
                      {t("noMatchFoundTitle" as TranslationKey)}
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
                      {t("noMatchFoundMessage" as TranslationKey)}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        onClick={() => navigate("/startup-profile")}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        {t("updateProfile" as TranslationKey) ||
                          "Update Profile"}
                      </Button>
                    </div>
                  </motion.div>
                </div>
              ) : (
                // Show MatchmakingOrb for startups registered less than 7 days
                <MatchmakingOrb userType="startup" />
              )}
            </div>

            <div className="mt-8">
              <StartupPaperInvestmentHub />
            </div>

            {user?.id && (
              <div className="mt-8">
                <StartupActivityFeed startupId={user.id} />
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StartupDashboard;
