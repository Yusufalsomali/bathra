export type AccountType = "startup" | "investor" | "admin";

export type Tables = {
  investors: {
    id: string;
    name: string;
    email: string;
    phone: string;
    birthday: string;
    company?: string;
    role: string;
    country: string;
    city: string;
    preferred_industries?: string;
    preferred_company_stage?: string;
    linkedin_profile?: string;
    other_social_media_profile?: string;
    calendly_link?: string;
    heard_about_us?: string;
    number_of_investments?: number;
    average_ticket_size?: string;
    secured_lead_investor?: boolean;
    participated_as_advisor?: boolean;
    strong_candidate_reason?: string;
    newsletter_subscribed: boolean;
    verified: boolean;
    status: "pending" | "approved" | "rejected" | "flagged";
    visibility_status?: "featured" | "hot" | "normal";
    admin_notes?: string;
    verified_at?: string;
    verified_by?: string;
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
    message?: string;
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
    problem_solving: string;
    solution: string;
    uniqueness: string;
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
    team_size?: number;
    co_founders?: string;
    calendly_link?: string;
    video_link?: string;
    pitch_deck?: string;
    additional_files?: string;
    additional_video_url: string;
    achievements?: string;
    risks?: string;
    risk_mitigation?: string;
    exit_strategy?:
      | "Competitor buyout"
      | "Company buyout"
      | "Shareholder/employee buyout"
      | "IPO/RPO";
    participated_in_accelerator?: boolean;
    newsletter_subscribed: boolean;
    verified: boolean;
    status: "pending" | "approved" | "rejected" | "flagged";
    visibility_status?: "featured" | "hot" | "normal";
    admin_notes?: string;
    verified_at?: string;
    verified_by?: string;
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
};

export type Startup = Tables["startups"];
export type Investor = Tables["investors"];
export type Notification = Tables["notifications"];
export type InvestorStartupConnection = Tables["investor_startup_connections"];
export type Matchmaking = Tables["matchmakings"];
export type Article = Tables["articles"];

export interface AppUser {
  id: string;
  email: string;
  name: string;
  accountType: AccountType;
  created_at: string;
  status?: "pending" | "approved" | "rejected" | "flagged";
}

export type Database = {
  public: {
    Tables: {
      investors: { Row: Investor; Insert: Partial<Investor>; Update: Partial<Investor> };
      startups: { Row: Startup; Insert: Partial<Startup>; Update: Partial<Startup> };
      investor_startup_connections: {
        Row: InvestorStartupConnection;
        Insert: Partial<InvestorStartupConnection>;
        Update: Partial<InvestorStartupConnection>;
      };
      articles: { Row: Article; Insert: Partial<Article>; Update: Partial<Article> };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification>;
        Update: Partial<Notification>;
      };
      matchmakings: {
        Row: Matchmaking;
        Insert: Partial<Matchmaking>;
        Update: Partial<Matchmaking>;
      };
      admins: {
        Row: Tables["admins"];
        Insert: Partial<Tables["admins"]>;
        Update: Partial<Tables["admins"]>;
      };
    };
    Functions: {
      increment_article_views: { Args: { article_id: string }; Returns: void };
      get_unread_notification_count: { Args: { user_id: string }; Returns: number };
    };
  };
};
