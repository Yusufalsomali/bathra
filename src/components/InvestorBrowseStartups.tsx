import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Building,
  ArrowRight,
  X,
  Star,
  Sparkles,
  Landmark,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StartupDetailModal from "@/components/StartupDetailModal";
import { StartupService } from "@/lib/startup-service";
import {
  StartupBasicInfo,
  StartupFilters,
  PaginatedStartups,
} from "@/lib/startup-types";
import { Pagination } from "@/components/ui/pagination";
import { InvestorStartupConnectionService } from "@/lib/investor-startup-connection-service";
import { supabase } from "@/lib/supabase";
import Navbar from "./Navbar";

interface InvestorBrowseStartupsProps {
  isDashboard?: boolean;
  maxStartups?: number;
}

const ITEMS_PER_PAGE = 12;
const DEFAULT_SAMPLE_CHECK = 50000;

const formatCurrency = (value?: string | number) => {
  const numericValue =
    typeof value === "number" ? value : value ? Number(value) : NaN;

  if (!Number.isFinite(numericValue)) {
    return "Undisclosed";
  }

  return `SAR ${numericValue.toLocaleString()}`;
};

const calcCompatibilityScore = (
  startup: StartupBasicInfo,
  investor: { preferred_industries?: string; preferred_company_stage?: string } | null
): number => {
  if (!investor) return 0;
  let score = 20;
  const preferredIndustries = (investor.preferred_industries ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (
    preferredIndustries.length === 0 ||
    preferredIndustries.some((ind) => startup.industry?.toLowerCase().includes(ind))
  ) {
    score += 40;
  }
  if (!investor.preferred_company_stage || investor.preferred_company_stage === startup.stage) {
    score += 40;
  }
  return score;
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return "bg-green-100 text-green-800 border-green-200";
  if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
};

const getStartupInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const getBannerPalette = (seed: string) => {
  const palettes = [
    "from-sky-500 via-cyan-500 to-emerald-500",
    "from-indigo-500 via-violet-500 to-fuchsia-500",
    "from-amber-500 via-orange-500 to-rose-500",
    "from-emerald-500 via-teal-500 to-sky-500",
    "from-slate-700 via-slate-900 to-emerald-700",
  ];

  const index =
    seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    palettes.length;

  return palettes[index];
};

const InvestorBrowseStartups = ({
  isDashboard = false,
  maxStartups,
}: InvestorBrowseStartupsProps) => {
  const navigate = useNavigate();
  const [startups, setStartups] = useState<StartupBasicInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] =
    useState<string>("all-industries");
  const [selectedStage, setSelectedStage] = useState<string>("all-stages");
  const [selectedStartup, setSelectedStartup] =
    useState<StartupBasicInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedStartupIds, setSavedStartupIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [interestedStartups, setInterestedStartups] = useState<string[]>([]);
  const [investorProfile, setInvestorProfile] = useState<{ preferred_industries?: string; preferred_company_stage?: string } | null>(null);
  const [industries, setIndustries] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchStartups();
    if (!isDashboard && user?.id) {
      fetchFilterOptions();
    }
    if (user?.id) {
      loadInterestedStartups();
      InvestorStartupConnectionService.getSavedStartupIds(user.id).then((ids) =>
        setSavedStartupIds(new Set(ids))
      );
      supabase
        .from("investors")
        .select("preferred_industries, preferred_company_stage")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setInvestorProfile(data));
    }
  }, [isDashboard, maxStartups, user?.id]);

  useEffect(() => {
    if (!isDashboard) {
      fetchStartups();
    }
  }, [searchTerm, selectedIndustry, selectedStage, currentPage, isDashboard]);

  const fetchStartups = async () => {
    try {
      setIsLoading(true);

      if (!user?.id) {
        setStartups([]);
        setTotalPages(1);
        setTotal(0);
        return;
      }

      if (isDashboard) {
        const { data, error } = await StartupService.getDashboardStartups(
          maxStartups || 6
        );

        if (error) {
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          });
          return;
        }

        setStartups(data || []);
        setTotalPages(1);
        setTotal((data || []).length);
        return;
      }

      const filters: StartupFilters = {
        searchTerm: searchTerm || undefined,
        industry:
          selectedIndustry !== "all-industries" ? selectedIndustry : undefined,
        stage: selectedStage !== "all-stages" ? selectedStage : undefined,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
      };

      const result = await StartupService.getVettedStartups(filters);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      const paginatedData = result.data as PaginatedStartups;
      setStartups(paginatedData.startups || []);
      setTotalPages(paginatedData.totalPages || 1);
      setTotal(paginatedData.total || 0);
    } catch (error) {
      console.error("Error fetching startups:", error);
      toast({
        title: "Error",
        description: "Failed to load startups",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [industriesResult, stagesResult] = await Promise.all([
        StartupService.getIndustries(),
        StartupService.getStages(),
      ]);

      setIndustries(industriesResult.data || []);
      setStages(stagesResult.data || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const loadInterestedStartups = async () => {
    if (!user?.id) return;

    try {
      const { data } = await InvestorStartupConnectionService.getConnections({
        investor_id: user.id,
        connection_type: "interested",
      });

      if (data) {
        const startupIds = data.map((connection) => connection.startup_id);
        setInterestedStartups(startupIds);
      }
    } catch (error) {
      console.error("Error loading interested startups:", error);
    }
  };

  const handleStartupClick = (startup: StartupBasicInfo) => {
    setSelectedStartup(startup);
    setIsModalOpen(true);
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleIndustryChange = (value: string) => {
    setSelectedIndustry(value);
    setCurrentPage(1);
  };

  const handleStageChange = (value: string) => {
    setSelectedStage(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSaveStartup = async () => {
    if (!selectedStartup || !user?.id || !profile) return;
    setSavingId(selectedStartup.id);
    const { saved, error } = await InvestorStartupConnectionService.toggleSaved(
      user.id,
      selectedStartup.id,
      profile.name || "Unknown Investor",
      profile.email || user.email || "",
      selectedStartup.startup_name || selectedStartup.name,
      selectedStartup.email
    );
    setSavingId(null);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }
    setSavedStartupIds((prev) => {
      const next = new Set(prev);
      saved ? next.add(selectedStartup.id) : next.delete(selectedStartup.id);
      return next;
    });
    toast({
      title: saved ? "Startup saved" : "Removed from saved",
      description: saved
        ? `${selectedStartup.startup_name || selectedStartup.name} has been added to your saved startups`
        : `${selectedStartup.startup_name || selectedStartup.name} has been removed from your saved startups`,
    });
  };

  const handleRequestInfo = () => {
    // This is now handled by the InfoRequestModal component
    // The old toast functionality is replaced by the modal
  };

  const handleInterested = async () => {
    if (!selectedStartup || !user || !profile) {
      toast({
        title: "Error",
        description: "You must be logged in to show interest",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } =
        await InvestorStartupConnectionService.createConnection({
          investor_id: user.id,
          startup_id: selectedStartup.id,
          connection_type: "interested",
          investor_name: profile.name || "Unknown Investor",
          investor_email: profile.email || user.email || "",
          investor_calendly_link: profile.calendly_link,
          startup_name: selectedStartup.startup_name || selectedStartup.name,
          startup_email: selectedStartup.email,
        });

      if (error) {
        if (error === "Connection already exists") {
          toast({
            title: "Already Interested",
            description: "You have already shown interest in this startup",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          });
        }
        return;
      }

      // Update local state
      setInterestedStartups((prev) => [...prev, selectedStartup.id]);

      toast({
        title: "Interest Recorded!",
        description: `Your interest in ${
          selectedStartup.startup_name || selectedStartup.name
        } has been recorded. The startup will be notified.`,
      });
    } catch (error) {
      console.error("Error showing interest:", error);
      toast({
        title: "Error",
        description: "Failed to record interest. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedIndustry("all-industries");
    setSelectedStage("all-stages");
    setCurrentPage(1);
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-lg p-6 shadow-md">
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-20 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <Navbar />
      <div className={`${isDashboard ? "" : "py-24"}`}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {!isDashboard && (
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Your Matched Startups</h1>
              <p className="text-xl text-muted-foreground">
                Explore approved startups and simulate venture investments with virtual funds
              </p>
            </div>
          )}

          {!isDashboard && (
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-1/2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search your matched startups"
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => handleSearchTermChange(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Button
                    variant="outline"
                    className="flex-1 md:flex-none"
                    onClick={() => navigate("/startups/interested")}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Interested ({interestedStartups.length})
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 md:flex-none"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </Button>
                </div>
              </div>

              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg border"
                >
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">
                      Industry
                    </label>
                    <Select
                      value={selectedIndustry}
                      onValueChange={handleIndustryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Industries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-industries">
                          All Industries
                        </SelectItem>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">
                      Stage
                    </label>
                    <Select
                      value={selectedStage}
                      onValueChange={handleStageChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Stages" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-stages">All Stages</SelectItem>
                        {stages.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="h-10"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {isLoading ? (
            renderSkeletons()
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {startups.map((startup) => (
                <motion.div
                  key={startup.id}
                  whileHover={{ y: -8, scale: 1.01 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-card shadow-md transition-all duration-300 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10 flex flex-col h-full"
                >
                  <div className="relative h-44 flex-shrink-0 overflow-hidden">
                    {startup.image ? (
                      <div
                        className="absolute inset-0 bg-center bg-cover transition-transform duration-500 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${startup.image})`,
                        }}
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${getBannerPalette(
                          startup.name
                        )}`}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />

                    <div className="relative flex h-full flex-col justify-between p-4">
                      <div className="flex items-start justify-between gap-3">
                        <Badge className="border-white/15 bg-white/15 text-white hover:bg-white/15">
                          <Sparkles className="mr-1 h-3.5 w-3.5" />
                          {startup.verified ? "Active Opportunity" : "New"}
                        </Badge>
                        <div className="flex gap-1.5">
                          {interestedStartups.includes(startup.id) && (
                            <Badge className="border-emerald-300/20 bg-emerald-400/15 text-emerald-50 hover:bg-emerald-400/15">
                              <Star className="mr-1 h-3.5 w-3.5" />
                              Interested
                            </Badge>
                          )}
                          {investorProfile && (() => {
                            const score = calcCompatibilityScore(startup, investorProfile);
                            return (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getScoreColor(score)}`}>
                                {score}% match
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs uppercase tracking-[0.22em] text-white/65">
                            {startup.industry}
                          </div>
                          <div className="mt-2 line-clamp-1 text-2xl font-semibold text-white">
                            {startup.startup_name || startup.name}
                          </div>
                        </div>
                        {!startup.image && (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg font-semibold text-white backdrop-blur">
                            {getStartupInitials(startup.startup_name || startup.name)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="rounded-full">
                          {startup.stage}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-primary/10 text-primary"
                        >
                          {startup.industry}
                        </Badge>
                        {startup.valuation_amount && (
                          <Badge
                            variant="outline"
                            className="rounded-full border-emerald-500/20 bg-emerald-500/5 text-emerald-700"
                          >
                            <TrendingUp className="mr-1 h-3 w-3" />
                            {formatCurrency(startup.valuation_amount)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold leading-tight text-foreground">
                          {startup.name}
                        </h3>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {startup.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-muted/20 p-4">
                        <div className="space-y-1">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            Valuation
                          </div>
                          <div className="text-sm font-semibold">
                            {formatCurrency(startup.valuation_amount || startup.valuation)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            Stage
                          </div>
                          <div className="text-sm font-semibold">
                            {startup.stage}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            Sector
                          </div>
                          <div className="text-sm font-semibold">
                            {startup.industry}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <Landmark className="h-4 w-4" />
                          Investment insight
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {startup.valuation_amount
                            ? `${formatCurrency(
                                DEFAULT_SAMPLE_CHECK
                              )} \u2192 ~${(
                                (DEFAULT_SAMPLE_CHECK / startup.valuation_amount) *
                                100
                              ).toFixed(2)}% equity`
                            : "Add a sample check to estimate implied equity after opening the opportunity."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <Button
                        onClick={() => handleStartupClick(startup)}
                        size="lg"
                        className="h-12 w-full rounded-2xl text-base font-semibold shadow-lg transition-all duration-300 group-hover:bg-primary/90 group-hover:shadow-primary/20"
                      >
                        Review & Invest
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Results count */}
          {!isDashboard && !isLoading && (
            <div className="text-center mb-8 mt-8">
              <p className="text-muted-foreground">
                {total === 0
                  ? "No startups found"
                  : `${total} startup${total !== 1 ? "s" : ""} found`}
              </p>
            </div>
          )}

          {startups.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">
                No startups found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedIndustry || selectedStage
                  ? "Try adjusting your search criteria or filters."
                  : "No approved startups are available yet."}
              </p>
            </div>
          )}

          {/* Pagination */}
          {!isDashboard && !isLoading && totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                loading={isLoading}
              />
            </div>
          )}
        </motion.div>
      </div>

      {selectedStartup && (
        <StartupDetailModal
          startup={{
            ...selectedStartup,
            funding_required:
              selectedStartup.funding_required || "Not specified",
            valuation: selectedStartup.valuation || "Not specified",
          }}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveStartup}
          isSaved={savedStartupIds.has(selectedStartup.id)}
          onRequestInfo={handleRequestInfo}
          onInterested={handleInterested}
          isInterested={interestedStartups.includes(selectedStartup.id)}
        />
      )}
    </div>
    </div>
  );
};

export default InvestorBrowseStartups;
