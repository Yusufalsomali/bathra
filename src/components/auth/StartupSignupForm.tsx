import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader, Plus, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadPitchDeck } from "@/lib/storage-service";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface CoFounder {
  name: string;
  role: string;
  email: string;
  linkedinProfile?: string;
}

interface StartupFormData {
  // Auth fields
  email: string;
  password: string;
  confirmPassword: string;

  // Basic info
  founderName: string;
  phone: string;
  startupName: string;
  website?: string;
  industry: string;
  stage: string;

  // Logo and media
  logoUrl?: string;
  socialMediaAccounts: { platform: string; url: string }[];

  // Business details
  problemSolving: string;
  solutionDescription: string;
  uniqueValueProposition: string;

  // Financial info
  currentRevenue: number | null;
  hasReceivedFunding: boolean;
  monthlyBurnRate: number | null;
  investmentInstrument: string;
  capitalSeeking: number | null;
  preMoneyValuation: number | null;
  fundingAlreadyRaised: number | null;

  // Resources
  pitchDeckUrl?: string;
  pitchDeckFile?: File;
  coFounders: CoFounder[];
  calendlyLink?: string;
  videoLink?: string;
  additionalVideoUrl?: string;
  teamSize: number;

  // Strategic info
  achievements: string;
  risksAndMitigation: string;
  exitStrategy: string;
  participatedAccelerator: boolean;
  acceleratorDetails?: string;
  additionalFiles: string[];

  // Agreement checkboxes
  agreeToTerms: boolean;
  acceptNewsletter: boolean;
}

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Fintech",
  "E-commerce",
  "SaaS",
  "AI/ML",
  "Biotech",
  "Clean Energy",
  "Real Estate",
  "EdTech",
  "FoodTech",
  "AgTech",
  "Gaming",
  "Media",
  "Transportation",
  "Manufacturing",
  "Other",
];

const STARTUP_STAGES = ["Idea", "MVP", "Scaling"];

const INVESTMENT_INSTRUMENTS = [
  "Equity",
  "Convertible note",
  "SAFE",
  "Loan",
  "Other",
  "Undecided",
  "Not interested in funding",
];

const EXIT_STRATEGIES = [
  "Competitor buyout",
  "Company buyout",
  "Shareholder/employee buyout",
  "IPO/RPO",
];

export default function StartupSignupForm() {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState<StartupFormData>({
    // Auth fields
    email: "",
    password: "",
    confirmPassword: "",

    // Basic info
    founderName: "",
    phone: "",
    startupName: "",
    website: "",
    industry: "",
    stage: "",
    logoUrl: "",

    // Social media
    socialMediaAccounts: [],

    // Business details
    problemSolving: "",
    solutionDescription: "",
    uniqueValueProposition: "",

    // Financial info
    currentRevenue: null,
    hasReceivedFunding: false,
    monthlyBurnRate: null,
    investmentInstrument: "",
    capitalSeeking: null,
    preMoneyValuation: null,
    fundingAlreadyRaised: null,

    // Resources
    pitchDeckUrl: "",
    pitchDeckFile: undefined,
    coFounders: [],
    calendlyLink: "",
    videoLink: "",
    additionalVideoUrl: "",
    teamSize: 1,

    // Strategic info
    achievements: "",
    risksAndMitigation: "",
    exitStrategy: "",
    participatedAccelerator: false,
    acceleratorDetails: "",
    additionalFiles: [],

    // Agreement checkboxes
    agreeToTerms: false,
    acceptNewsletter: false,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const addSocialMedia = () => {
    setFormData((prev) => ({
      ...prev,
      socialMediaAccounts: [
        ...prev.socialMediaAccounts,
        { platform: "", url: "" },
      ],
    }));
  };

  const removeSocialMedia = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      socialMediaAccounts: prev.socialMediaAccounts.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const updateSocialMedia = (
    index: number,
    field: "platform" | "url",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      socialMediaAccounts: prev.socialMediaAccounts.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addCoFounder = () => {
    setFormData((prev) => ({
      ...prev,
      coFounders: [
        ...prev.coFounders,
        { name: "", role: "", email: "", linkedinProfile: "" },
      ],
    }));
  };

  const removeCoFounder = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      coFounders: prev.coFounders.filter((_, i) => i !== index),
    }));
  };

  const updateCoFounder = (
    index: number,
    field: keyof CoFounder,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      coFounders: prev.coFounders.map((coFounder, i) =>
        i === index ? { ...coFounder, [field]: value } : coFounder
      ),
    }));
  };

  const validateForm = (): string[] => {
    const newErrors: string[] = [];

    if (!formData.email) newErrors.push(t("emailRequiredError"));
    if (!formData.password) newErrors.push(t("passwordRequiredError"));
    if (formData.password !== formData.confirmPassword)
      newErrors.push(t("passwordsDoNotMatchError"));
    if (formData.password.length < 8)
      newErrors.push(t("passwordMustBeAtLeast8CharactersError"));
    if (!formData.founderName) newErrors.push(t("founderNameRequiredError"));
    if (!formData.phone) newErrors.push(t("phoneRequiredError"));
    if (!formData.startupName) newErrors.push(t("startupNameRequiredError"));
    if (!formData.industry) newErrors.push(t("industryRequiredError"));
    if (!formData.stage) newErrors.push(t("startupStageRequiredError"));
    if (!formData.logoUrl) newErrors.push(t("logoUrlRequiredError"));
    if (formData.socialMediaAccounts.length === 0)
      newErrors.push(t("pleaseAddAtLeastOneSocialMediaAccountError"));
    if (!formData.problemSolving)
      newErrors.push(t("problemDescriptionRequiredError"));
    if (!formData.solutionDescription)
      newErrors.push(t("solutionDescriptionRequiredError"));
    if (!formData.uniqueValueProposition)
      newErrors.push(t("uniqueValuePropositionRequiredError"));
    if (!formData.investmentInstrument)
      newErrors.push(t("investmentInstrumentRequiredError"));
    if (!formData.calendlyLink) newErrors.push(t("calendlyLinkRequiredError"));
    if (formData.teamSize === 0) newErrors.push(t("teamSizeRequiredError"));
    if (!formData.achievements)
      newErrors.push(t("achievementsDescriptionRequiredError"));
    if (!formData.risksAndMitigation)
      newErrors.push(t("risksAndMitigationRequiredError"));
    if (!formData.exitStrategy) newErrors.push(t("exitStrategyRequiredError"));
    if (!formData.agreeToTerms) newErrors.push(t("agreeToTermsRequiredError"));

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      let pitchDeckUrl = formData.pitchDeckUrl;

      const registrationData = {
        email: formData.email,
        password: formData.password,
        name: formData.founderName,
        accountType: "startup" as const,
        phone: formData.phone,
        startupName: formData.startupName,
        website: formData.website,
        industry: formData.industry,
        stage: formData.stage,
        logoUrl: formData.logoUrl,
        socialMediaAccounts: formData.socialMediaAccounts,
        problemSolving: formData.problemSolving,
        solutionDescription: formData.solutionDescription,
        uniqueValueProposition: formData.uniqueValueProposition,
        currentRevenue: formData.currentRevenue,
        hasReceivedFunding: formData.hasReceivedFunding,
        monthlyBurnRate: formData.monthlyBurnRate,
        investmentInstrument: formData.investmentInstrument,
        capitalSeeking: formData.capitalSeeking,
        preMoneyValuation: formData.preMoneyValuation,
        fundingAlreadyRaised: formData.fundingAlreadyRaised,
        pitchDeckUrl: pitchDeckUrl,
        coFounders: formData.coFounders,
        calendlyLink: formData.calendlyLink,
        videoLink: formData.videoLink,
        additionalVideoUrl: formData.additionalVideoUrl,
        teamSize: formData.teamSize,
        achievements: formData.achievements,
        risksAndMitigation: formData.risksAndMitigation,
        exitStrategy: formData.exitStrategy,
        participatedAccelerator: formData.participatedAccelerator,
        acceleratorDetails: formData.acceleratorDetails,
        additionalFiles: formData.additionalFiles,
        newsletterSubscribed: formData.acceptNewsletter,
      };

      const success = await signUp(registrationData);

      if (!success) {
        setErrors([t("registrationFailedPleaseTryAgainError")]);
        setIsSubmitting(false);
        return;
      }

      if (formData.pitchDeckFile) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErrors(["Signup succeeded but no authenticated user session was found."]);
          setIsSubmitting(false);
          return;
        }

        setIsUploadingFile(true);
        const uploadResult = await uploadPitchDeck(
          formData.pitchDeckFile,
          user.id
        );
        setIsUploadingFile(false);

        if (!uploadResult.success || !uploadResult.url) {
          setErrors([uploadResult.error || t("failedToUploadPitchDeckError")]);
          setIsSubmitting(false);
          return;
        }

        pitchDeckUrl = uploadResult.url;

        const { error: startupUpdateError } = await supabase
          .from("startups")
          .update({
            pitch_deck: pitchDeckUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (startupUpdateError) {
          setErrors([startupUpdateError.message]);
          setIsSubmitting(false);
          return;
        }
      }

      navigate("/pending-verification");
    } catch (error) {
      console.error("Registration error:", error);
      // Check for specific error types from Supabase
      if (error instanceof Error) {
        if (
          error.message.includes("email already in use") ||
          error.message.includes("User already registered")
        ) {
          setErrors([t("accountWithThisEmailAlreadyExistsError")]);
        } else {
          setErrors([error.message]);
        }
      } else {
        setErrors([t("registrationFailedPleaseTryAgainError")]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to handle placeholders based on language
  const getPlaceholder = (englishText: string) => {
    return language === "English" ? englishText : "";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center items-center">
        <h1 className="text-2xl font-bold">{t("startupSignupTitle")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("accountInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder={getPlaceholder("founder@startup.com")}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder={getPlaceholder("Minimum 8 characters")}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">
                {t("confirmPasswordLabel")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder={getPlaceholder("Confirm your password")}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("basicInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="founderName">{t("founderNameLabel")}</Label>
              <Input
                id="founderName"
                value={formData.founderName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    founderName: e.target.value,
                  }))
                }
                placeholder={getPlaceholder("John Doe")}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">{t("phoneLabel")}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder={getPlaceholder("+1 234 567 8900")}
                required
              />
            </div>
            <div>
              <Label htmlFor="startupName">{t("startupNameLabel")}</Label>
              <Input
                id="startupName"
                value={formData.startupName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startupName: e.target.value,
                  }))
                }
                placeholder={getPlaceholder("Your startup name")}
                required
              />
            </div>
            <div>
              <Label htmlFor="website">{t("websiteLabel")}</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, website: e.target.value }))
                }
                placeholder={getPlaceholder("https://yourstartup.com")}
              />
            </div>
            <div>
              <Label htmlFor="industry">{t("industryLabel")}</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, industry: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="stage">{t("startupStageLabel")}</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, stage: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {STARTUP_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="logoUrl">{t("logoUrlLabel")}</Label>
              <Input
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))
                }
                placeholder={getPlaceholder("https://example.com/logo.png")}
                required
              />
            </div>
            <div>
              <Label htmlFor="teamSize">{t("teamSizeLabel")}</Label>
              <Input
                id="teamSize"
                type="number"
                min="1"
                step="1"
                value={formData.teamSize === null ? "" : formData.teamSize}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    teamSize:
                      e.target.value === "" ? null : parseInt(e.target.value),
                  }))
                }
                placeholder={getPlaceholder("1")}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle>{t("socialMediaAccounts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Label>{t("socialMediaProfilesLabel")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSocialMedia}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("addSocialMediaButton")}
              </Button>
            </div>
            {formData.socialMediaAccounts.map((social, index) => (
              <div key={index} className="flex gap-4 items-center mb-3">
                <Input
                  placeholder={
                    language === "English"
                      ? t("socialMediaProfilePlaceholder")
                      : ""
                  }
                  value={social.platform}
                  onChange={(e) =>
                    updateSocialMedia(index, "platform", e.target.value)
                  }
                  required
                />
                <Input
                  placeholder={
                    language === "English" ? t("profileUrlPlaceholder") : ""
                  }
                  value={social.url}
                  onChange={(e) =>
                    updateSocialMedia(index, "url", e.target.value)
                  }
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeSocialMedia(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Business Description */}
        <Card>
          <CardHeader>
            <CardTitle>{t("businessDescription")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="problemSolving">{t("problemSolvingLabel")}</Label>
              <Textarea
                id="problemSolving"
                value={formData.problemSolving}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    problemSolving: e.target.value,
                  }))
                }
                placeholder={getPlaceholder(
                  "Describe the problem your startup is addressing..."
                )}
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="solutionDescription">
                {t("solutionDescriptionLabel")}
              </Label>
              <Textarea
                id="solutionDescription"
                value={formData.solutionDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    solutionDescription: e.target.value,
                  }))
                }
                placeholder={getPlaceholder("Describe your solution...")}
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="uniqueValueProposition">
                {t("uniqueValuePropositionLabel")}
              </Label>
              <Textarea
                id="uniqueValueProposition"
                value={formData.uniqueValueProposition}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    uniqueValueProposition: e.target.value,
                  }))
                }
                placeholder={getPlaceholder(
                  "Describe what differentiates you from competitors..."
                )}
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("financialInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="currentRevenue">{t("currentRevenueLabel")}</Label>
              <Input
                id="currentRevenue"
                type="number"
                min="0"
                value={
                  formData.currentRevenue === null
                    ? ""
                    : formData.currentRevenue
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    currentRevenue:
                      e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
                placeholder={getPlaceholder("0")}
                required
              />
            </div>
            <div>
              <Label htmlFor="monthlyBurnRate">
                {t("monthlyBurnRateLabel")}
              </Label>
              <Input
                id="monthlyBurnRate"
                type="number"
                min="0"
                value={
                  formData.monthlyBurnRate === null
                    ? ""
                    : formData.monthlyBurnRate
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    monthlyBurnRate:
                      e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
                placeholder={getPlaceholder("0")}
                required
              />
            </div>
            <div>
              <Label htmlFor="capitalSeeking">{t("capitalSeekingLabel")}</Label>
              <Input
                id="capitalSeeking"
                type="number"
                min="0"
                value={
                  formData.capitalSeeking === null
                    ? ""
                    : formData.capitalSeeking
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    capitalSeeking:
                      e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
                placeholder={getPlaceholder("0")}
                required
              />
            </div>
            <div>
              <Label htmlFor="preMoneyValuation">
                {t("preMoneyValuationLabel")}
              </Label>
              <Input
                id="preMoneyValuation"
                type="number"
                min="0"
                value={
                  formData.preMoneyValuation === null
                    ? ""
                    : formData.preMoneyValuation
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    preMoneyValuation:
                      e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
                placeholder={getPlaceholder("0")}
                required
              />
            </div>
            <div>
              <Label htmlFor="fundingAlreadyRaised">
                {t("fundingAlreadyRaisedLabel")}
              </Label>
              <Input
                id="fundingAlreadyRaised"
                type="number"
                min="0"
                value={
                  formData.fundingAlreadyRaised === null
                    ? ""
                    : formData.fundingAlreadyRaised
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fundingAlreadyRaised:
                      e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
                placeholder={getPlaceholder("0")}
                required
              />
            </div>
            <div>
              <Label htmlFor="investmentInstrument">
                {t("investmentInstrumentLabel")}
              </Label>
              <Select
                value={formData.investmentInstrument}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    investmentInstrument: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select instrument" />
                </SelectTrigger>
                <SelectContent>
                  {INVESTMENT_INSTRUMENTS.map((instrument) => (
                    <SelectItem key={instrument} value={instrument}>
                      {instrument}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Funding Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t("fundingStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="hasReceivedFunding"
                checked={formData.hasReceivedFunding}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    hasReceivedFunding: !!checked,
                  }))
                }
              />
              <Label htmlFor="hasReceivedFunding">
                {t("hasReceivedFundingLabel")}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Co-Founders */}
        <Card>
          <CardHeader>
            <CardTitle>{t("coFounders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Label>{t("addCoFoundersLabel")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCoFounder}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("addCoFounderButton")}
              </Button>
            </div>
            {formData.coFounders.map((coFounder, index) => (
              <div key={index} className="border p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    placeholder={t("coFounderNamePlaceholder")}
                    value={coFounder.name}
                    onChange={(e) =>
                      updateCoFounder(index, "name", e.target.value)
                    }
                  />
                  <Input
                    placeholder={t("roleTitlePlaceholder")}
                    value={coFounder.role}
                    onChange={(e) =>
                      updateCoFounder(index, "role", e.target.value)
                    }
                  />
                  <Input
                    placeholder={t("emailPlaceholder")}
                    type="email"
                    value={coFounder.email}
                    onChange={(e) =>
                      updateCoFounder(index, "email", e.target.value)
                    }
                  />
                  <Input
                    placeholder={t("linkedinProfileOptionalPlaceholder")}
                    value={coFounder.linkedinProfile}
                    onChange={(e) =>
                      updateCoFounder(index, "linkedinProfile", e.target.value)
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCoFounder(index)}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t("removeCoFounderButton")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle>{t("resourcesAndLinks")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="pitchDeckFile">{t("pitchDeckLabel")}</Label>
              <div className="space-y-2">
                <div className="flex flex-col space-y-1">
                  <Input
                    id="pitchDeckFile"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setFormData((prev) => ({
                        ...prev,
                        pitchDeckFile: file,
                      }));
                    }}
                    className="w-full h-auto min-h-[40px] py-1 file:mr-2 file:py-1 file:px-2 sm:file:py-1.5 sm:file:px-3 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer file:transition-colors"
                  />
                </div>
                {formData.pitchDeckFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    <span>{formData.pitchDeckFile.name}</span>
                    <span>
                      ({(formData.pitchDeckFile.size / 1024 / 1024).toFixed(2)}{" "}
                      MB)
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload your pitch deck as a PDF file (max 10MB)
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="calendlyLink">{t("calendlyLinkLabel")}</Label>
              <Input
                id="calendlyLink"
                value={formData.calendlyLink}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    calendlyLink: e.target.value,
                  }))
                }
                placeholder={getPlaceholder("https://calendly.com/yourlink")}
                required
              />
            </div>
            <div>
              <Label htmlFor="videoLink">{t("videoLinkLabel")}</Label>
              <Input
                id="videoLink"
                value={formData.videoLink}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    videoLink: e.target.value,
                  }))
                }
                placeholder={getPlaceholder("https://youtube.com/watch?v=...")}
              />
            </div>
            <div>
              <Label htmlFor="additionalVideoUrl">
                {t("additionalVideoLinkLabel")}
              </Label>
              <Input
                id="additionalVideoUrl"
                value={formData.additionalVideoUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    additionalVideoUrl: e.target.value,
                  }))
                }
                placeholder={getPlaceholder(
                  "https://example.com/additional-video"
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Strategic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("strategicInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="achievements">{t("achievementsLabel")}</Label>
              <Textarea
                id="achievements"
                value={formData.achievements}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    achievements: e.target.value,
                  }))
                }
                placeholder={getPlaceholder(
                  "Describe your key achievements, milestones, and traction..."
                )}
                rows={4}
                required
              />
            </div>
            <div>
              <Label htmlFor="risksAndMitigation">
                {t("risksAndMitigationLabel")}
              </Label>
              <Textarea
                id="risksAndMitigation"
                value={formData.risksAndMitigation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    risksAndMitigation: e.target.value,
                  }))
                }
                placeholder={getPlaceholder(
                  "Identify potential risks and your mitigation strategies..."
                )}
                rows={4}
                required
              />
            </div>
            <div>
              <Label htmlFor="exitStrategy">{t("exitStrategyLabel")}</Label>
              <Select
                value={formData.exitStrategy}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, exitStrategy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exit strategy" />
                </SelectTrigger>
                <SelectContent>
                  {EXIT_STRATEGIES.map((strategy) => (
                    <SelectItem key={strategy} value={strategy}>
                      {strategy}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Accelerator Experience */}
        <Card>
          <CardHeader>
            <CardTitle>{t("acceleratorExperience")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="participatedAccelerator"
                checked={formData.participatedAccelerator}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    participatedAccelerator: !!checked,
                  }))
                }
              />
              <Label htmlFor="participatedAccelerator">
                {t("participatedAcceleratorLabel")}
              </Label>
            </div>
            {formData.participatedAccelerator && (
              <div>
                <Label htmlFor="acceleratorDetails">
                  {t("acceleratorDetailsLabel")}
                </Label>
                <Textarea
                  id="acceleratorDetails"
                  value={formData.acceleratorDetails}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      acceleratorDetails: e.target.value,
                    }))
                  }
                  placeholder={getPlaceholder(
                    "Which accelerator/incubator did you participate in? What was the outcome?"
                  )}
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agreement Checkboxes */}
        <Card>
          <CardHeader>
            <CardTitle>{t("agreement")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    agreeToTerms: !!checked,
                  }))
                }
                required
              />
              <Label
                htmlFor="agreeToTerms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("agreeToTermsLabel")}{" "}
                <a
                  href="/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t("termsAndConditionsLink")}
                </a>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="acceptNewsletter"
                checked={formData.acceptNewsletter}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    acceptNewsletter: !!checked,
                  }))
                }
              />
              <Label
                htmlFor="acceptNewsletter"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("acceptNewsletterLabel")}
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex">
          <Button
            type="submit"
            disabled={isSubmitting || !formData.agreeToTerms}
            className="flex-1"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {isUploadingFile
                  ? t("uploadingPitchDeck")
                  : t("creatingAccountButton")}
              </>
            ) : (
              t("createStartupAccountButton")
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
