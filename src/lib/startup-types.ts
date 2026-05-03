// Basic startup information visible to regular users
export interface StartupBasicInfo {
  id: string;
  name: string;
  email: string;
  calendly_link?: string;
  startup_name: string;
  industry: string;
  stage: string;
  description: string;
  website?: string;
  founders?: string;
  team_size?: number;
  founded_date?: string;
  target_market?: string;
  problem_solved?: string;
  usp?: string;
  traction?: string;
  key_metrics?: string;
  funding_required?: string;
  valuation?: string;
  funding_goal?: number;
  valuation_amount?: number;
  already_raised_amount?: number;
  verified?: boolean;
  image?: string;
  logo?: string;
  score?: number;
}

// Extended startup information visible to admins
export interface AdminStartupInfo extends StartupBasicInfo {
  email: string;
  phone?: string;
  founder_info?: string;
  problem_solving?: string;
  solution?: string;
  uniqueness?: string;

  // Financial details
  previous_financial_year_revenue?: number;
  monthly_burn_rate?: number;
  capital_seeking?: number;
  pre_money_valuation?: number;
  funding_already_raised?: number;
  previous_funding?: string;
  investment_instrument?: string;
  has_received_funding?: boolean;

  // Additional details
  use_of_funds?: string;
  roadmap?: string;
  exit_strategy?: string;
  achievements?: string;
  risks?: string;
  risk_mitigation?: string;
  participated_in_accelerator?: boolean;
  pitch_deck?: string;
  calendly_link?: string;
  video_link?: string;

  // Status
  status: string;
  created_at: string;
  business_model?: string;
  contact_email?: string;
  investment_terms?: string;
  financials?: string;
  market_analysis?: string;
  competition?: string;
  video_url?: string;
  document_path?: string;
  additional_files?: string[];

  // Admin fields
  admin_notes?: string;
  verified_at?: string;
  verified_by?: string;
  visibility_status?: string;
  updated_at?: string;
}

export interface StartupCardProps {
  startup: StartupBasicInfo;
  onStartupClick: (startup: StartupBasicInfo) => void;
  isSaved?: boolean;
}

export interface StartupModalProps {
  startup: StartupBasicInfo;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isSaved: boolean;
  onRequestInfo: () => void;
}

export interface StartupFilters {
  industry?: string;
  stage?: string;
  searchTerm?: string;
  valuation?: string;
  limit?: number;
  offset?: number;
}

// Paginated response type for startups
export interface PaginatedStartups<T = StartupBasicInfo> {
  startups: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
