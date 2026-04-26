import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import { simpleAuthService, User } from "@/lib/simple-auth-service";
import {
  UserProfile,
  RegistrationData,
  LoginCredentials,
  PasswordResetData,
  PasswordUpdateData,
  ProfileUpdateData,
  OAuthProvider,
} from "@/lib/auth-types";
import { AccountType, Permission, hasPermission } from "@/lib/account-types";
import { getAuthErrorMessage } from "@/lib/auth-utils";

// Modified AuthState to use our simple User type
interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: Permission[];
}

interface AuthContextType extends AuthState {
  // Authentication methods
  signIn: (
    credentials: LoginCredentials
  ) => Promise<{ success: boolean; user?: User }>;
  signUp: (data: RegistrationData) => Promise<boolean>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<boolean>;

  // Password management
  resetPassword: (data: PasswordResetData) => Promise<boolean>;
  updatePassword: (data: PasswordUpdateData) => Promise<boolean>;

  // Profile management
  updateProfile: (data: ProfileUpdateData) => Promise<boolean>;
  refreshProfile: () => Promise<void>;

  // Authorization helpers
  hasPermission: (permission: Permission) => boolean;
  isRole: (role: AccountType) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check for real authenticated user
      const currentUser = await simpleAuthService.getCurrentUser();

      if (currentUser) {
        setUser(currentUser);

        // Create a basic profile from the user data
        const userProfile: UserProfile = {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          accountType: currentUser.accountType,
          role: currentUser.accountType, // Use accountType as role
          isEmailVerified: true, // Assume verified since we have the user
          createdAt: currentUser.created_at,
          updatedAt: currentUser.created_at,
        };

        // Try to load additional profile data based on account type
        try {
          if (currentUser.accountType === "admin") {
            const adminData = await simpleAuthService.getAdminProfile(
              currentUser.id
            );
            if (adminData) {
              // Enhance profile with admin-specific data
              userProfile.role = "admin";
              // Add any admin-specific fields here
            }
          } else if (currentUser.accountType === "investor") {
            const investorData = await simpleAuthService.getInvestorProfile(
              currentUser.id
            );
            if (investorData) {
              // Enhance profile with investor-specific data
              userProfile.portfolioSize = undefined; // average_ticket_size is a string
              userProfile.linkedInUrl = investorData.linkedin_profile;
              userProfile.bio = investorData.strong_candidate_reason;
              userProfile.phoneNumber = investorData.phone;
              userProfile.location = investorData.city;
              userProfile.status = investorData.status;
              userProfile.verified = investorData.verified;
              userProfile.adminNotes = investorData.admin_notes;
              userProfile.visibility_status = investorData.visibility_status;
            }
          } else if (currentUser.accountType === "startup") {
            const startupData = await simpleAuthService.getStartupProfile(
              currentUser.id
            );
            if (startupData) {
              // Enhance profile with startup-specific data
              userProfile.startupId = startupData.id;
              userProfile.position = "Founder"; // Default position
              userProfile.phoneNumber = startupData.phone;
              userProfile.status = startupData.status;
              userProfile.verified = startupData.verified;
              userProfile.adminNotes = startupData.admin_notes;
              userProfile.visibility_status = startupData.visibility_status;
            }
          }
        } catch (error) {
          console.error("Error loading additional profile data:", error);
          // Continue with basic profile
        }

        setProfile(userProfile);

        // Emit event for LanguageContext to handle admin language enforcement
        const event = new CustomEvent("authProfileChange", {
          detail: { profile: userProfile },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Authentication methods
  const signIn = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; user?: User }> => {
    try {
      setIsLoading(true);

      const loggedInUser = await simpleAuthService.login(credentials);

      if (loggedInUser) {
        setUser(loggedInUser);

        // Create a basic profile from the user data
        const userProfile: UserProfile = {
          id: loggedInUser.id,
          email: loggedInUser.email,
          name: loggedInUser.name,
          accountType: loggedInUser.accountType,
          role: loggedInUser.accountType, // Use accountType as role
          isEmailVerified: true, // Assume verified since login succeeded
          createdAt: loggedInUser.created_at,
          updatedAt: loggedInUser.created_at,
        };

        // Try to load additional profile data based on account type
        try {
          if (loggedInUser.accountType === "admin") {
            const adminData = await simpleAuthService.getAdminProfile(
              loggedInUser.id
            );
            if (adminData) {
              // Enhance profile with admin-specific data
              userProfile.role = "admin";
              // Add any admin-specific fields here
            }
          } else if (loggedInUser.accountType === "investor") {
            const investorData = await simpleAuthService.getInvestorProfile(
              loggedInUser.id
            );
            if (investorData) {
              // Enhance profile with investor-specific data
              userProfile.portfolioSize = undefined; // average_ticket_size is a string
              userProfile.linkedInUrl = investorData.linkedin_profile;
              userProfile.bio = investorData.strong_candidate_reason;
              userProfile.phoneNumber = investorData.phone;
              userProfile.location = investorData.city;
              userProfile.status = investorData.status;
              userProfile.verified = investorData.verified;
              userProfile.adminNotes = investorData.admin_notes;
              userProfile.visibility_status = investorData.visibility_status;
              userProfile.calendly_link = investorData.calendly_link;
            }
          } else if (loggedInUser.accountType === "startup") {
            const startupData = await simpleAuthService.getStartupProfile(
              loggedInUser.id
            );
            if (startupData) {
              // Enhance profile with startup-specific data
              userProfile.startupId = startupData.id;
              userProfile.position = "Founder"; // Default position
              userProfile.phoneNumber = startupData.phone;
              userProfile.status = startupData.status;
              userProfile.verified = startupData.verified;
              userProfile.adminNotes = startupData.admin_notes;
              userProfile.visibility_status = startupData.visibility_status;
            }
          }
        } catch (error) {
          console.error("Error loading additional profile data:", error);
          // Continue with basic profile
        }

        setProfile(userProfile);

        // Emit event for LanguageContext to handle admin language enforcement
        const event = new CustomEvent("authProfileChange", {
          detail: { profile: userProfile },
        });
        window.dispatchEvent(event);

        toast.success("Successfully signed in");
        return { success: true, user: loggedInUser };
      } else {
        toast.error("Sign in failed");
        return { success: false };
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error(getAuthErrorMessage(error));
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: RegistrationData): Promise<boolean> => {
    try {
      setIsLoading(true);

      const signUpCredentials = {
        email: data.email,
        password: data.password,
        name: data.name,
        accountType: data.accountType,
      };

      const result = await simpleAuthService.signUp(signUpCredentials, data);

      if (result && result.user) {
        setUser(result.user);

        // Create a basic profile from the user data
        const userProfile: UserProfile = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          accountType: result.user.accountType,
          role: result.user.accountType, // Use accountType as role
          isEmailVerified: !result.emailVerificationSent,
          createdAt: result.user.created_at,
          updatedAt: result.user.created_at,
        };

        try {
          if (result.user.accountType === "investor") {
            const investorData = await simpleAuthService.getInvestorProfile(
              result.user.id
            );
            if (investorData) {
              userProfile.linkedInUrl = investorData.linkedin_profile;
              userProfile.bio = investorData.strong_candidate_reason;
              userProfile.phoneNumber = investorData.phone;
              userProfile.location = investorData.city;
              userProfile.status = investorData.status;
              userProfile.verified = investorData.verified;
              userProfile.adminNotes = investorData.admin_notes;
              userProfile.visibility_status = investorData.visibility_status;
              userProfile.calendly_link = investorData.calendly_link;
            }
          } else if (result.user.accountType === "startup") {
            const startupData = await simpleAuthService.getStartupProfile(
              result.user.id
            );
            if (startupData) {
              userProfile.startupId = startupData.id;
              userProfile.position = "Founder";
              userProfile.phoneNumber = startupData.phone;
              userProfile.status = startupData.status;
              userProfile.verified = startupData.verified;
              userProfile.adminNotes = startupData.admin_notes;
              userProfile.visibility_status = startupData.visibility_status;
            }
          }
        } catch (profileError) {
          console.error("Error loading profile after sign up:", profileError);
        }

        setProfile(userProfile);

        const event = new CustomEvent("authProfileChange", {
          detail: { profile: userProfile },
        });
        window.dispatchEvent(event);

        toast.success("Account created successfully.");
        return true;
      } else {
        toast.error("Sign up failed");
        return false;
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error(getAuthErrorMessage(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);

      await simpleAuthService.logout();

      setUser(null);
      setProfile(null);

      // Emit event for LanguageContext to handle profile clearing
      const event = new CustomEvent("authProfileChange", {
        detail: { profile: null },
      });
      window.dispatchEvent(event);

      toast.success("Successfully signed out");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOAuth = async (provider: OAuthProvider): Promise<boolean> => {
    try {
      setIsLoading(true);

      // This is a placeholder since simpleAuthService doesn't have OAuth support
      // You would need to implement this in the simple-auth-service.ts file
      toast.error(`OAuth sign in with ${provider} is not implemented yet`);
      return false;
    } catch (error) {
      console.error("OAuth sign in error:", error);
      toast.error(getAuthErrorMessage(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Password management
  const resetPassword = async (data: PasswordResetData): Promise<boolean> => {
    try {
      setIsLoading(true);

      await simpleAuthService.resetPassword(data.email);
      toast.success("Password reset email sent. Check your inbox.");
      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(getAuthErrorMessage(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (data: PasswordUpdateData): Promise<boolean> => {
    try {
      if (!user) {
        toast.error("No authenticated user");
        return false;
      }

      setIsLoading(true);

      // Validate current password and update to new password
      await simpleAuthService.updatePassword(
        data.currentPassword,
        data.newPassword
      );
      toast.success("Password updated successfully");
      return true;
    } catch (error) {
      console.error("Password update error:", error);
      toast.error(getAuthErrorMessage(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Profile management
  const updateProfile = async (data: ProfileUpdateData): Promise<boolean> => {
    try {
      if (!user) {
        toast.error("No authenticated user");
        return false;
      }

      setIsLoading(true);

      // This is a placeholder since simpleAuthService doesn't have updateUserProfile
      // You would need to implement this in the simple-auth-service.ts file
      toast.error("Profile update is not implemented yet");
      return false;
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(getAuthErrorMessage(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      if (!user) return;

      const currentUser = await simpleAuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);

        // Update the profile with the latest user data
        if (profile) {
          setProfile({
            ...profile,
            name: currentUser.name,
            email: currentUser.email,
            accountType: currentUser.accountType,
          });
        }
      }
    } catch (error) {
      console.error("Profile refresh error:", error);
    }
  };

  // Authorization helpers
  const checkPermission = useCallback(
    (permission: Permission): boolean => {
      if (!profile) return false;
      return hasPermission(profile.accountType, permission);
    },
    [profile]
  );

  const isRole = useCallback(
    (accountType: AccountType): boolean => {
      return profile?.accountType === accountType;
    },
    [profile]
  );

  // Computed values
  const isAuthenticated = !!user;
  const permissions = profile
    ? getPermissionsForAccountType(profile.accountType)
    : [];

  // Helper function to get permissions for an account type
  function getPermissionsForAccountType(
    accountType: AccountType
  ): Permission[] {
    switch (accountType) {
      case "investor":
        return [
          "view_all_startups",
          "create_investor_profile",
          "edit_investor_profile",
          "connect_with_startups",
        ];
      case "startup":
        return [
          "view_all_investors",
          "create_startup_profile",
          "edit_startup_profile",
          "connect_with_investors",
        ];
      default:
        return [];
    }
  }

  const contextValue: AuthContextType = {
    // State
    user,
    profile,
    isLoading,
    isAuthenticated,
    permissions,

    // Authentication methods
    signIn,
    signUp,
    signOut,
    signInWithOAuth,

    // Password management
    resetPassword,
    updatePassword,

    // Profile management
    updateProfile,
    refreshProfile,

    // Authorization helpers
    hasPermission: checkPermission,
    isRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
