import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Building,
  Search,
  Settings,
  TrendingUp,
  Users,
  DollarSign,
  Rocket,
  Target,
  Briefcase,
  Star,
  Gauge,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { StartupService } from "@/lib/startup-service";
import { AdminStartupInfo } from "@/lib/startup-types";
import {
  ScoringWeights,
  ScoringInputs,
  defaultWeights,
  defaultInputs,
  calculateStartupScore,
  getScoreColor,
  getScoreLabel,
  mapFundingStage,
  mapProductStage,
  getTotalWeight,
  formatWeightKey,
} from "@/utils/startup-scoring";

const StartupScoringSystem = () => {
  const [inputs, setInputs] = useState<ScoringInputs>(defaultInputs);
  const [weights, setWeights] = useState<ScoringWeights>(defaultWeights);
  const [score, setScore] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [selectedStartupId, setSelectedStartupId] = useState<string>("");
  const [startups, setStartups] = useState<AdminStartupInfo[]>([]);
  const [showWeightConfig, setShowWeightConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveScore = async () => {
    if (!selectedStartupId || !score) return;
    const { error } = await supabase
      .from("startups")
      .update({ score })
      .eq("id", selectedStartupId);
    if (error) {
      toast({ title: "Error saving score", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Score saved", description: `Score of ${score} saved for this startup.` });
    }
  };

  useEffect(() => {
    loadStartups();
  }, []);

  useEffect(() => {
    const result = calculateStartupScore(inputs, weights);
    setScore(result.finalScore);
    setBreakdown(result.breakdown);
  }, [inputs, weights]);

  const loadStartups = async () => {
    try {
      setLoading(true);
      const response = await StartupService.getAllStartups();
      setStartups(response.data as AdminStartupInfo[]);
    } catch (error) {
      console.error("Error loading startups:", error);
      toast({
        title: "Error",
        description: "Failed to load startups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartupSelection = (startupId: string) => {
    const startup = startups.find((s) => s.id === startupId);
    if (!startup) return;

    setSelectedStartupId(startupId);

    // Auto-fill available data from database
    setInputs({
      ...inputs,
      teamSize: startup.team_size || 1,
      monthlyRevenue: startup.previous_financial_year_revenue
        ? startup.previous_financial_year_revenue / 12
        : 0,
      marketSize: startup.capital_seeking || 0, // Using capital seeking as a proxy for market opportunity
      fundingStage: mapFundingStage(startup.investment_instrument),
      productStage: mapProductStage(startup.stage),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            Startup Scoring System
          </h2>
          <p className="text-muted-foreground mt-2">
            Evaluate startup investment potential using weighted scoring
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowWeightConfig(!showWeightConfig)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Configure Weights
        </Button>
      </div>

      {/* Weight Configuration */}
      {showWeightConfig && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Scoring Weights Configuration</CardTitle>
              <CardDescription>
                Adjust the importance of each factor (total should equal 100%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(weights).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm capitalize">
                      {formatWeightKey(key)}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) =>
                        setWeights({
                          ...weights,
                          [key]: Number(e.target.value),
                        })
                      }
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Total Weight: {getTotalWeight(weights)}%
                  {getTotalWeight(weights) !== 100 && (
                    <span className="text-orange-600 ml-2">
                      ⚠️ Weights should total 100%
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Startup Information
              </CardTitle>
              <CardDescription>
                Select a startup from database or input values manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Startup Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Select Startup (Optional)
                </Label>
                <Select
                  value={selectedStartupId}
                  onValueChange={handleStartupSelection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose startup to auto-fill data..." />
                  </SelectTrigger>
                  <SelectContent>
                    {startups.map((startup) => (
                      <SelectItem key={startup.id} value={startup.id}>
                        {startup.startup_name} - {startup.industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Founders Experience */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Founders Experience (Years)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={inputs.foundersExperience || ""}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        foundersExperience: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Previous Startups</Label>
                  <Input
                    type="number"
                    min="0"
                    value={inputs.foundersStartups || ""}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        foundersStartups: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Successful Exits</Label>
                  <Input
                    type="number"
                    min="0"
                    value={inputs.foundersExits || ""}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        foundersExits: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Team and Market */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Size
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={inputs.teamSize || ""}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        teamSize: Number(e.target.value) || 1,
                      })
                    }
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Market Size (TAM in USD)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={inputs.marketSize || ""}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        marketSize: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="e.g., 1000000000 for $1B"
                  />
                </div>
              </div>

              {/* Funding and Revenue */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Funding Stage
                  </Label>
                  <Select
                    value={inputs.fundingStage}
                    onValueChange={(value) =>
                      setInputs({ ...inputs, fundingStage: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select funding stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="series-a">Series A</SelectItem>
                      <SelectItem value="series-b">Series B</SelectItem>
                      <SelectItem value="series-c">Series C+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Monthly Revenue (USD)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={inputs.monthlyRevenue || ""}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        monthlyRevenue: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Product Stage and Pitch Quality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Rocket className="h-4 w-4" />
                    Product Stage
                  </Label>
                  <Select
                    value={inputs.productStage}
                    onValueChange={(value) =>
                      setInputs({ ...inputs, productStage: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="prototype">Prototype</SelectItem>
                      <SelectItem value="mvp">MVP</SelectItem>
                      <SelectItem value="launched">Launched</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Pitch Quality Score (1-10)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={inputs.pitchQuality || ""}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        pitchQuality: Number(e.target.value) || 5,
                      })
                    }
                    placeholder="5"
                  />
                </div>
              </div>

              {/* Competitive Advantage */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Competitive Advantage
                </Label>
                <Textarea
                  value={inputs.competitiveAdvantage}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      competitiveAdvantage: e.target.value,
                    })
                  }
                  placeholder="Describe the startup's unique competitive advantages..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Score Display */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Investment Score
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="relative">
                <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </div>
                <div className="text-sm text-muted-foreground">/ 100</div>
              </div>

              <Badge
                variant={score >= 60 ? "default" : "secondary"}
                className="text-sm px-3 py-1"
              >
                {getScoreLabel(score)}
              </Badge>

              <div className="w-full">
                <Progress value={score} className="h-2" />
              </div>

              {selectedStartupId && (
                <Button onClick={handleSaveScore} variant="outline" size="sm" className="mt-2 w-full">
                  Save Score to Profile
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(breakdown).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{formatWeightKey(key)}</span>
                    <span className="font-medium">{Math.round(value)}</span>
                  </div>
                  <Progress value={value} className="h-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StartupScoringSystem;
