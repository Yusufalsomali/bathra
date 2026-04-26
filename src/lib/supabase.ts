import { supabase as defaultClient } from "@/integrations/supabase/client";

// Re-export the shared Supabase client configured from Vite env vars.
export const supabase = defaultClient;

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Define database types to use with Supabase
export type Tables = {
  investors: {
    id: string;
    // Basic Info
    name: string;
    email: string;
    phone: string;
    birthday: string;
    company?: string;
    role: string;
    country: string;
    city: string;

    // Investment Preferences
    preferred_industries?: string;
    preferred_company_stage?: string;

    // Social Media & Contact
    linkedin_profile?: string;
    other_social_media_profile?: string;
    calendly_link?: string;

    // Background Info
    heard_about_us?: string;
    number_of_investments?: number;
    average_ticket_size?: string;
    secured_lead_investor?: boolean;
    participated_as_advisor?: boolean;
    strong_candidate_reason?: string;

    // Newsletter Subscription
    newsletter_subscribed: boolean;

    // Admin Management Fields
    verified: boolean;
    status: "pending" | "approved" | "rejected" | "flagged";
    visibility_status?: "featured" | "hot" | "normal";
    admin_notes?: string;
    verified_at?: string;
    verified_by?: string;

    // System fields
    created_at: string;
    updated_at?: string;
  };
  investor_startup_connections: {
    id: string;
    investor_id: string;
    startup_id: string;
    connection_type: "interested" | "info_request";
    investor_name: string;
    investor_email: string;
    investor_calendly_link?: string;
    startup_name: string;
    startup_email: string;
    message?: string; // For info requests
    status: "active" | "archived";
    created_at: string;
    updated_at?: string;
  };
  articles: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    featured_image_url?: string;
    category:
      | "news"
      | "industry_insights"
      | "startup_tips"
      | "investment_guide"
      | "company_updates"
      | "market_analysis"
      | "founder_stories"
      | "investor_spotlight";
    tags: string[];
    status: "draft" | "published" | "archived";
    author_id: string;
    author_name: string;
    published_at?: string;
    created_at: string;
    updated_at: string;
    views_count: number;
    is_featured: boolean;
    seo_title?: string;
    seo_description?: string;
  };
  startups: {
    id: string;

    // Basic Info
    logo?: string;
    name: string;
    founder_info: string;
    email: string;
    phone: string;
    startup_name: string;
    website?: string;
    industry: string;
    stage?: "Idea" | "MVP" | "Scaling";
    social_media_accounts?: string;

    // Problem & Solution
    problem_solving: string;
    solution: string;
    uniqueness: string;

    // Financial Information
    previous_financial_year_revenue?: number;
    current_financial_year_revenue?: number;
    has_received_funding?: boolean;
    monthly_burn_rate?: number;
    investment_instrument?:
      | "Equity"
      | "Convertible note"
      | "SAFE"
      | "Loan"
      | "Other"
      | "Undecided"
      | "Not interested in funding";
    capital_seeking?: number;
    pre_money_valuation?: number;
    funding_already_raised?: number;

    // Team & Resources
    team_size?: number;
    co_founders?: string;
    calendly_link?: string;
    video_link?: string;
    pitch_deck?: string;
    additional_files?: string;
    additional_video_url: string;

    // Traction & Growth
    achievements?: string;
    risks?: string;
    risk_mitigation?: string;
    exit_strategy?:
      | "Competitor buyout"
      | "Company buyout"
      | "Shareholder/employee buyout"
      | "IPO/RPO";
    participated_in_accelerator?: boolean;

    // Newsletter Subscription
    newsletter_subscribed: boolean;

    // Admin Management Fields
    verified: boolean;
    status: "pending" | "approved" | "rejected" | "flagged";
    visibility_status?: "featured" | "hot" | "normal";
    admin_notes?: string;
    verified_at?: string;
    verified_by?: string;

    // System fields
    created_at: string;
    updated_at?: string;
  };
  admins: {
    id: string;
    email: string;
    name: string;
    admin_level: string;
    avatar?: string;
    phone_number?: string;
    location?: string;
    created_at: string;
    updated_at: string;
  };
  admin_invites: {
    id: string;
    email: string;
    name: string;
    admin_level: string;
    phone_number?: string;
    location?: string;
    invited_by: string;
    invited_at: string;
    status: "pending" | "accepted" | "expired";
    invite_token: string;
    expires_at: string;
    created_at: string;
    updated_at: string;
  };
  notifications: {
    id: string;
    user_id: string;
    type:
      | "newsletter"
      | "admin_action"
      | "connection_request"
      | "message"
      | "profile_update"
      | "match_suggestion"
      | "investment_interest"
      | "meeting_request"
      | "system_update"
      | "reminder"
      | "other";
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
    is_read: boolean;
    read_at?: string;
    priority: "low" | "normal" | "high" | "urgent";
    newsletter_id?: string;
    recipient_type?: "all" | "investors" | "startups" | "specific";
    action_url?: string;
    action_label?: string;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
    scheduled_for?: string;
    sent_at?: string;
  };
  newsletter_campaigns: {
    id: string;
    title: string;
    subject: string;
    content: string;
    recipient_type: "all" | "investors" | "startups" | "specific";
    specific_recipients?: string[];
    status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
    scheduled_for?: string;
    sent_at?: string;
    total_recipients: number;
    created_by: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  };
  user_invites: {
    id: string;
    email: string;
    name: string;
    invited_by: string;
    invited_at: string;
    status: "pending" | "accepted" | "expired";
    invite_token: string;
    expires_at: string;
    user_id?: string; // ID of the user who accepted the invite
    created_at: string;
    updated_at: string;
  };
  matchmakings: {
    id: string;
    investor_id: string;
    investor_name: string;
    investor_email: string;
    startup_id: string;
    startup_name: string;
    startup_email: string;
    expiry_date: string;
    is_interested: boolean;
    is_archived: boolean;
    matched_by: string;
    comment?: string;
    created_at: string;
    updated_at: string;
  };
  paper_wallets: {
    investor_id: string;
    currency_code: string;
    starting_balance: number;
    total_added?: number;
    available_balance: number;
    reserved_balance?: number;
    invested_balance: number;
    realized_pnl?: number;
    created_at: string;
    updated_at?: string;
  };
  paper_wallet_transactions: {
    id: string;
    investor_id: string;
    type:
      | "initial_funding"
      | "add_funds"
      | "investment_reserved"
      | "investment_finalized"
      | "investment_released";
    amount: number;
    description?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
  };
  paper_investment_offers: {
    id: string;
    investor_id: string;
    startup_id: string;
    matchmaking_id?: string;
    amount: number;
    valuation_at_offer: number;
    implied_equity_percentage: number;
    status: "pending" | "accepted" | "rejected" | "cancelled";
    note?: string;
    created_at: string;
    updated_at?: string;
  };
  paper_investments: {
    id: string;
    investor_id: string;
    startup_id: string;
    offer_id?: string;
    matchmaking_id?: string;
    amount: number;
    valuation_at_investment?: number;
    ownership_pct?: number;
    instrument?:
      | "Equity"
      | "Convertible note"
      | "SAFE"
      | "Loan"
      | "Other"
      | "Undecided"
      | "Not interested in funding";
    notes?: string;
    status: "active" | "exited" | "cancelled";
    exit_amount?: number;
    exited_at?: string;
    created_at: string;
    updated_at?: string;
  };
  startup_valuation_history: {
    id: string;
    startup_id: string;
    valuation: number;
    reason?: string;
    created_at: string;
  };
};

// Export common types for convenience
export type Startup = Tables["startups"];
export type Investor = Tables["investors"];
export type Admin = Tables["admins"];
export type Notification = Tables["notifications"];
export type NewsletterCampaign = Tables["newsletter_campaigns"];
export type UserInvite = Tables["user_invites"];
export type InvestorStartupConnection = Tables["investor_startup_connections"];
export type Matchmaking = Tables["matchmakings"];
export type PaperWallet = Tables["paper_wallets"];
export type PaperWalletTransaction = Tables["paper_wallet_transactions"];
export type PaperInvestmentOffer = Tables["paper_investment_offers"];
export type PaperInvestment = Tables["paper_investments"];
export type StartupValuationHistory = Tables["startup_valuation_history"];

// Define specific response types to help with TypeScript safety
export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

// Helper types for filtering
export type DataFilter<T> = {
  [K in keyof T]?: T[K];
};

// Define helper functions to properly type the responses from our mock client
export const processStartupData = (data: unknown[]): Startup[] => {
  return data.filter((item): item is Startup => {
    if (typeof item !== "object" || item === null) return false;
    const obj = item as Record<string, unknown>;
    return (
      typeof obj.id === "number" &&
      typeof obj.name === "string" &&
      typeof obj.industry === "string" &&
      typeof obj.founder_info === "string" &&
      typeof obj.email === "string" &&
      typeof obj.phone === "string" &&
      typeof obj.startup_name === "string" &&
      typeof obj.problem_solving === "string" &&
      typeof obj.solution === "string" &&
      typeof obj.uniqueness === "string"
    );
  });
};

export const processInvestorData = (data: unknown[]): Investor[] => {
  return data.filter((item): item is Investor => {
    if (typeof item !== "object" || item === null) return false;
    const obj = item as Record<string, unknown>;
    return (
      typeof obj.id === "number" &&
      typeof obj.email === "string" &&
      typeof obj.name === "string" &&
      typeof obj.phone === "string" &&
      typeof obj.birthday === "string" &&
      typeof obj.role === "string" &&
      typeof obj.country === "string" &&
      typeof obj.city === "string"
    );
  });
};

export const processAdminData = (data: unknown[]): Admin[] => {
  return data.filter((item): item is Admin => {
    if (typeof item !== "object" || item === null) return false;
    const obj = item as Record<string, unknown>;
    return (
      typeof obj.id === "string" &&
      typeof obj.email === "string" &&
      typeof obj.name === "string" &&
      typeof obj.admin_level === "string"
    );
  });
};
