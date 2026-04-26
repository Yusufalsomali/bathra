import { User } from "@supabase/supabase-js";
import { AccountType, UserRole, Permission } from "./account-types";

// Extended user profile with comprehensive information
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  accountType: AccountType;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;

  // Investor-specific fields
  portfolioSize?: number;
  linkedInUrl?: string;
  bio?: string;
  calendly_link?: string;

  // Startup-specific fields
  startupId?: string;
  position?: string; // CEO, CTO, etc.

  // Additional metadata
  avatar?: string;
  phoneNumber?: string;
  location?: string;
  timezone?: string;
  preferences?: UserPreferences;

  // Admin verification fields
  verified?: boolean;
  adminApproved?: boolean;
  status?: "pending" | "approved" | "rejected" | "flagged";
  visibility_status?: "featured" | "hot" | "normal";
  adminNotes?: string;
}

// User preferences for personalization
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  marketingEmails: boolean;
  language: string;
  currency: string;
}

// Authentication state
export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: Permission[];
}

// Registration data for new users
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  accountType: AccountType;
  newsletterSubscribed?: boolean;

  // Common fields
  phone?: string;

  // Investor-specific fields
  birthday?: string;
  company?: string;
  role?: string;
  country?: string;
  city?: string;
  preferredIndustries?: string[];
  preferredStage?: string;
  averageTicketSize?: string;
  linkedinProfile?: string;
  otherSocialMedia?: { platform: string; url: string }[];
  howDidYouHear?: string;
  numberOfInvestments?: number;
  hasSecuredLeadInvestor?: boolean;
  hasBeenStartupAdvisor?: boolean;
  whyStrongCandidate?: string;

  // Startup-specific fields
  startupName?: string;
  website?: string;
  industry?: string;
  stage?: string;
  logoUrl?: string;
  socialMediaAccounts?: { platform: string; url: string }[];
  problemSolving?: string;
  solutionDescription?: string;
  uniqueValueProposition?: string;
  currentRevenue?: number;
  hasReceivedFunding?: boolean;
  monthlyBurnRate?: number;
  investmentInstrument?: string;
  capitalSeeking?: number;
  preMoneyValuation?: number;
  fundingAlreadyRaised?: number;
  pitchDeckUrl?: string;
  coFounders?: {
    name: string;
    role: string;
    email: string;
    linkedinProfile?: string;
  }[];
  calendlyLink?: string;
  videoLink?: string;
  teamSize?: number;
  achievements?: string;
  risksAndMitigation?: string;
  exitStrategy?: string;
  participatedAccelerator?: boolean;
  acceleratorDetails?: string;
  additionalFiles?: string[];
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Password reset data
export interface PasswordResetData {
  email: string;
}

// Password update data
export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

// Profile update data
export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  linkedInUrl?: string;
  phoneNumber?: string;
  location?: string;
  avatar?: string;
  position?: string;
  preferences?: Partial<UserPreferences>;
}

// Auth error types
export type AuthError = {
  code: string;
  message: string;
  details?: unknown;
};

// Auth action results
export interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

// Session management
export interface SessionInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

// OAuth provider types
export type OAuthProvider = "google" | "github" | "linkedin";

// Auth events for listeners
export type AuthEvent =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "PASSWORD_RECOVERY"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "USER_DELETED";

// Auth event handler
export type AuthEventHandler = (
  event: AuthEvent,
  session: SessionInfo | null
) => void;

// Route protection levels
export type ProtectionLevel = "public" | "authenticated" | "role-based";

// Protected route configuration
export interface RouteProtection {
  level: ProtectionLevel;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  redirectTo?: string;
}
