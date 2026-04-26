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
import { Loader, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface InvestorFormData {
  // Auth fields
  email: string;
  password: string;
  confirmPassword: string;

  // Personal info
  name: string;
  phone: string;
  birthday: string;
  company?: string;
  role: string;
  country: string;
  city: string;

  // Investment preferences
  preferredIndustries: string[];
  preferredStage: string;
  averageTicketSize: string;

  // Social profiles
  linkedinProfile: string;
  otherSocialMedia: { platform: string; url: string }[];
  calendlyLink?: string;

  // Background
  howDidYouHear: string;
  numberOfInvestments: number | null;
  hasSecuredLeadInvestor: boolean;
  hasBeenStartupAdvisor: boolean;
  whyStrongCandidate: string;

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

const COMPANY_STAGES = [
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Growth Stage",
  "Any Stage",
];

const TICKET_SIZES = [
  "$1K - $10K",
  "$10K - $50K",
  "$50K - $100K",
  "$100K - $500K",
  "$500K - $1M",
  "$1M - $5M",
  "$5M+",
];

const HOW_DID_YOU_HEAR = [
  "Google Search",
  "Social Media",
  "Referral from Friend",
  "Industry Event",
  "Newsletter",
  "Blog/Article",
  "Existing Investor",
  "Other",
];

export default function InvestorSignupForm() {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState<InvestorFormData>({
    // Auth fields
    email: "",
    password: "",
    confirmPassword: "",

    // Personal info
    name: "",
    phone: "",
    birthday: "",
    company: "",
    role: "",
    country: "",
    city: "",

    // Investment preferences
    preferredIndustries: [],
    preferredStage: "",
    averageTicketSize: "",

    // Social profiles
    linkedinProfile: "",
    otherSocialMedia: [],
    calendlyLink: "",

    // Background
    howDidYouHear: "",
    numberOfInvestments: null,
    hasSecuredLeadInvestor: false,
    hasBeenStartupAdvisor: false,
    whyStrongCandidate: "",

    // Agreement checkboxes
    agreeToTerms: false,
    acceptNewsletter: false,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const addSocialMedia = () => {
    setFormData((prev) => ({
      ...prev,
      otherSocialMedia: [...prev.otherSocialMedia, { platform: "", url: "" }],
    }));
  };

  const removeSocialMedia = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      otherSocialMedia: prev.otherSocialMedia.filter((_, i) => i !== index),
    }));
  };

  const updateSocialMedia = (
    index: number,
    field: "platform" | "url",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      otherSocialMedia: prev.otherSocialMedia.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const toggleIndustry = (industry: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredIndustries: prev.preferredIndustries.includes(industry)
        ? prev.preferredIndustries.filter((i) => i !== industry)
        : [...prev.preferredIndustries, industry],
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
    if (!formData.name) newErrors.push(t("nameRequiredError"));
    if (!formData.phone) newErrors.push(t("phoneRequiredError"));
    if (!formData.birthday) newErrors.push(t("birthdayRequiredError"));
    if (!formData.role) newErrors.push(t("roleRequiredError"));
    if (!formData.country) newErrors.push(t("countryRequiredError"));
    if (!formData.city) newErrors.push(t("cityRequiredError"));
    if (formData.preferredIndustries.length === 0)
      newErrors.push(t("preferredIndustriesRequiredError"));
    if (!formData.preferredStage)
      newErrors.push(t("preferredCompanyStageRequiredError"));
    if (!formData.averageTicketSize)
      newErrors.push(t("averageTicketSizeRequiredError"));
    if (!formData.linkedinProfile)
      newErrors.push(t("linkedinProfileRequiredError"));
    if (!formData.calendlyLink) newErrors.push(t("calendlyLinkRequiredError"));
    if (!formData.howDidYouHear)
      newErrors.push(t("howDidYouHearRequiredError"));
    if (!formData.whyStrongCandidate)
      newErrors.push(t("whyStrongCandidateRequiredError"));
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
      const registrationData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        accountType: "investor" as const,
        phone: formData.phone,
        birthday: formData.birthday,
        company: formData.company,
        role: formData.role,
        country: formData.country,
        city: formData.city,
        preferredIndustries: formData.preferredIndustries,
        preferredStage: formData.preferredStage,
        averageTicketSize: formData.averageTicketSize,
        linkedinProfile: formData.linkedinProfile,
        otherSocialMedia: formData.otherSocialMedia,
        calendlyLink: formData.calendlyLink,
        howDidYouHear: formData.howDidYouHear,
        numberOfInvestments: formData.numberOfInvestments,
        hasSecuredLeadInvestor: formData.hasSecuredLeadInvestor,
        hasBeenStartupAdvisor: formData.hasBeenStartupAdvisor,
        whyStrongCandidate: formData.whyStrongCandidate,
        newsletterSubscribed: formData.acceptNewsletter,
      };

      const success = await signUp(registrationData);

      if (success) {
        navigate("/pending-verification");
      } else {
        setErrors([t("registrationFailedPleaseTryAgainError")]);
      }
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
        <h1 className="text-2xl font-bold">{t("investorSignupTitle")}</h1>
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
                placeholder={getPlaceholder("your@email.com")}
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

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("personalInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">{t("fullNameLabel")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
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
              <Label htmlFor="birthday">{t("birthdayLabel")}</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, birthday: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="company">{t("companyOptionalLabel")}</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                placeholder={getPlaceholder("Company name")}
              />
            </div>
            <div>
              <Label htmlFor="role">{t("roleLabel")}</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                placeholder={getPlaceholder("Investor, Partner, CEO, etc.")}
                required
              />
            </div>
            <div>
              <Label htmlFor="country">{t("countryLabel")}</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, country: e.target.value }))
                }
                placeholder={getPlaceholder("United States")}
                required
              />
            </div>
            <div>
              <Label htmlFor="city">{t("cityLabel")}</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder={getPlaceholder("New York")}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Investment Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t("investmentPreferences")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>{t("preferredIndustriesLabel")}</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {INDUSTRIES.map((industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={industry}
                      checked={formData.preferredIndustries.includes(industry)}
                      onCheckedChange={() => toggleIndustry(industry)}
                    />
                    <Label htmlFor={industry} className="text-sm">
                      {industry}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="preferredStage">
                  {t("preferredCompanyStageLabel")}
                </Label>
                <Select
                  value={formData.preferredStage}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, preferredStage: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={getPlaceholder("Select preferred stage")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="averageTicketSize">
                  {t("averageTicketSizeLabel")}
                </Label>
                <Select
                  value={formData.averageTicketSize}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      averageTicketSize: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={getPlaceholder("Select ticket size")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Profiles */}
        <Card>
          <CardHeader>
            <CardTitle>{t("socialProfiles")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="linkedinProfile">
                {t("linkedinProfileLabel")}
              </Label>
              <Input
                id="linkedinProfile"
                value={formData.linkedinProfile}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    linkedinProfile: e.target.value,
                  }))
                }
                placeholder={getPlaceholder(
                  "https://linkedin.com/in/yourprofile"
                )}
                required
              />
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
              <div className="flex items-center justify-between mb-4">
                <Label>{t("otherSocialMediaProfilesLabel")}</Label>
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
              {formData.otherSocialMedia.map((social, index) => (
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
                  />
                  <Input
                    placeholder={
                      language === "English" ? t("profileUrlPlaceholder") : ""
                    }
                    value={social.url}
                    onChange={(e) =>
                      updateSocialMedia(index, "url", e.target.value)
                    }
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
            </div>
          </CardContent>
        </Card>

        {/* Background & Experience */}
        <Card>
          <CardHeader>
            <CardTitle>{t("backgroundAndExperience")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="howDidYouHear">{t("howDidYouHearLabel")}</Label>
              <Select
                value={formData.howDidYouHear}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, howDidYouHear: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={getPlaceholder(
                      "Select how you heard about us"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {HOW_DID_YOU_HEAR.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="numberOfInvestments">
                {t("numberOfInvestmentsLabel")}
              </Label>
              <Input
                id="numberOfInvestments"
                type="number"
                min="0"
                value={
                  formData.numberOfInvestments === null
                    ? ""
                    : formData.numberOfInvestments
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    numberOfInvestments:
                      e.target.value === "" ? null : parseInt(e.target.value),
                  }))
                }
                placeholder={getPlaceholder("0")}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasSecuredLeadInvestor"
                  checked={formData.hasSecuredLeadInvestor}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      hasSecuredLeadInvestor: !!checked,
                    }))
                  }
                />
                <Label htmlFor="hasSecuredLeadInvestor">
                  {t("hasSecuredLeadInvestorLabel")}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasBeenStartupAdvisor"
                  checked={formData.hasBeenStartupAdvisor}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      hasBeenStartupAdvisor: !!checked,
                    }))
                  }
                />
                <Label htmlFor="hasBeenStartupAdvisor">
                  {t("hasBeenStartupAdvisorLabel")}
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="whyStrongCandidate">
                {t("whyStrongCandidateLabel")}
              </Label>
              <Textarea
                id="whyStrongCandidate"
                value={formData.whyStrongCandidate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    whyStrongCandidate: e.target.value,
                  }))
                }
                placeholder={getPlaceholder(
                  "Tell us about your investment experience, expertise, and what you can bring to the Bathra community..."
                )}
                rows={4}
                required
              />
            </div>
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
                {t("creatingAccountButton")}
              </>
            ) : (
              t("createInvestorAccountButton")
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
