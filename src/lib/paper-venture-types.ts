import { Startup } from "./supabase";

export type PaperInvestmentOfferStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export type PaperWalletTransactionType =
  | "initial_funding"
  | "add_funds"
  | "investment_reserved"
  | "investment_finalized"
  | "investment_released";

export interface PaperWalletSummary {
  investor_id: string;
  currency_code: string;
  starting_balance: number;
  total_added: number;
  available_balance: number;
  reserved_balance: number;
  invested_balance: number;
  total_portfolio_value: number;
  total_pending_offers: number;
  total_accepted_investments: number;
  current_gain_loss: number;
  remaining_cash: number;
  active_deals_count: number;
}

export interface PaperPortfolioPosition {
  investment_id: string;
  startup_id: string;
  startup_name: string;
  sector: string;
  amount_invested: number;
  status: string;
  valuation_at_investment: number;
  current_valuation: number;
  equity_percentage: number;
  current_paper_value: number;
  gain_loss: number;
  return_percentage: number;
  invested_at: string;
}

export interface PaperSectorBreakdown {
  sector: string;
  amount: number;
  currentValue: number;
  count: number;
  pendingAmount: number;
  acceptedAmount: number;
  exposureType: "pending" | "accepted" | "mixed";
}

export interface PaperPortfolioActivityItem {
  id: string;
  type:
    | "add_funds"
    | "offer_submitted"
    | "offer_accepted"
    | "offer_rejected"
    | "offer_cancelled"
    | "valuation_changed";
  title: string;
  description: string;
  amount?: number;
  created_at: string;
  status?: string;
}

export interface InvestorPortfolioSummary {
  wallet: PaperWalletSummary;
  positions: PaperPortfolioPosition[];
  sectorBreakdown: PaperSectorBreakdown[];
  pendingOffers: PaperInvestmentOfferView[];
  recentActivity: PaperPortfolioActivityItem[];
}

export interface CreatePaperInvestmentOfferInput {
  investorId: string;
  startupId: string;
  amount: number;
  note?: string;
  allowOverfunding?: boolean;
}

export interface PaperInvestmentOfferView {
  id: string;
  investor_id: string;
  startup_id: string;
  startup_name: string;
  startup_sector: string;
  investor_name: string;
  offered_amount: number;
  valuation_at_offer: number;
  implied_equity_percentage: number;
  status: PaperInvestmentOfferStatus;
  created_at: string;
  updated_at?: string;
  note?: string;
  investor?: InvestorPaperProfilePreview;
}

export interface InvestorPaperProfilePreview {
  id: string;
  name: string;
  company?: string;
  role?: string;
  preferredIndustries: string[];
  preferredStage?: string;
  averageTicketSize?: string;
  totalDeployedCapital: number;
  startupsInvestedCount: number;
  sectorsInvestedIn: string[];
  pendingOffersCount: number;
  portfolioValue: number;
}

export interface StartupCapTableEntry {
  investor_id: string;
  investor_name: string;
  amount_invested: number;
  equity_percentage: number;
  valuation_at_investment: number;
  current_paper_value: number;
  invested_at: string;
}

export interface StartupCapTableSummary {
  startup_id: string;
  startup_name: string;
  funding_goal: number;
  total_simulated_raised: number;
  funding_progress_percentage: number;
  total_equity_sold: number;
  remaining_equity_available: number;
  current_valuation: number;
  entries: StartupCapTableEntry[];
}

export interface StartupPaperInvestmentDashboard {
  offers: PaperInvestmentOfferView[];
  capTable: StartupCapTableSummary;
}

export interface StartupValuationUpdateInput {
  startupId: string;
  valuation: number;
  reason?: string;
}

export interface StartupFundingContext {
  startup: Startup;
  totalAcceptedRaised: number;
  remainingFundingGoal: number | null;
}
