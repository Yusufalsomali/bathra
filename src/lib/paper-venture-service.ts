import { supabase } from "./supabase";
import {
  Investor,
  PaperInvestment,
  PaperInvestmentOffer,
  PaperWallet,
  Startup,
} from "./supabase";
import { NotificationService } from "./notification-service";
import {
  CreatePaperInvestmentOfferInput,
  InvestorPaperProfilePreview,
  InvestorPortfolioSummary,
  PaperPortfolioActivityItem,
  PaperInvestmentOfferStatus,
  PaperInvestmentOfferView,
  PaperPortfolioPosition,
  PaperSectorBreakdown,
  PaperWalletSummary,
  StartupCapTableEntry,
  StartupCapTableSummary,
  StartupFundingContext,
  StartupPaperInvestmentDashboard,
  StartupValuationUpdateInput,
} from "./paper-venture-types";

const DEFAULT_STARTING_BALANCE = 100_000;
const DEFAULT_CURRENCY = "SAR";

const isRelationMissingError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
};

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const roundPercentage = (value: number) =>
  Math.round((value + Number.EPSILON) * 10000) / 10000;

const calculateOwnershipPercentage = (amount: number, valuation: number) => {
  if (valuation <= 0) return 0;
  return roundPercentage((amount / valuation) * 100);
};

const hasActiveMatchmaking = (
  matchmakings: { is_archived: boolean; created_at: string }[]
) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return matchmakings.some(
    (matchmaking) =>
      !matchmaking.is_archived &&
      new Date(matchmaking.created_at).getTime() >= sevenDaysAgo.getTime()
  );
};

export class PaperVentureService {
  private static normalizeWallet(wallet: Partial<PaperWallet>): PaperWallet {
    return {
      investor_id: wallet.investor_id || "",
      currency_code: wallet.currency_code || DEFAULT_CURRENCY,
      starting_balance: toNumber(wallet.starting_balance, DEFAULT_STARTING_BALANCE),
      total_added: toNumber(wallet.total_added),
      available_balance: toNumber(
        wallet.available_balance,
        DEFAULT_STARTING_BALANCE
      ),
      reserved_balance: toNumber(wallet.reserved_balance),
      invested_balance: toNumber(wallet.invested_balance),
      realized_pnl: toNumber(wallet.realized_pnl),
      created_at: wallet.created_at || new Date().toISOString(),
      updated_at: wallet.updated_at,
    };
  }

  private static async insertWalletTransaction(
    investorId: string,
    type:
      | "initial_funding"
      | "add_funds"
      | "investment_reserved"
      | "investment_finalized"
      | "investment_released",
    amount: number,
    description: string,
    metadata?: Record<string, unknown>
  ) {
    try {
      await supabase.from("paper_wallet_transactions").insert({
        investor_id: investorId,
        type,
        amount: roundCurrency(amount),
        description,
        metadata: metadata || {},
      });
    } catch (error) {
      if (!isRelationMissingError(error)) {
        console.error("Failed to insert wallet transaction", error);
      }
    }
  }

  static async getOrCreateWallet(
    investorId: string
  ): Promise<{ data: PaperWallet | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("paper_wallets")
        .select("*")
        .eq("investor_id", investorId)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      if (data) {
        return { data: this.normalizeWallet(data), error: null };
      }

      const walletToInsert = {
        investor_id: investorId,
        currency_code: DEFAULT_CURRENCY,
        starting_balance: DEFAULT_STARTING_BALANCE,
        total_added: 0,
        available_balance: DEFAULT_STARTING_BALANCE,
        reserved_balance: 0,
        invested_balance: 0,
      };

      const { data: insertedWallet, error: insertError } = await supabase
        .from("paper_wallets")
        .insert(walletToInsert)
        .select("*")
        .single();

      if (insertError) {
        return { data: null, error: insertError.message };
      }

      await this.insertWalletTransaction(
        investorId,
        "initial_funding",
        DEFAULT_STARTING_BALANCE,
        "Initial simulated venture fund balance"
      );

      return { data: this.normalizeWallet(insertedWallet), error: null };
    } catch (error) {
      if (isRelationMissingError(error)) {
        return {
          data: {
            investor_id: investorId,
            currency_code: DEFAULT_CURRENCY,
            starting_balance: DEFAULT_STARTING_BALANCE,
            total_added: 0,
            available_balance: DEFAULT_STARTING_BALANCE,
            reserved_balance: 0,
            invested_balance: 0,
            realized_pnl: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        };
      }

      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to load wallet",
      };
    }
  }

  static async addVirtualFunds(
    investorId: string,
    amount: number
  ): Promise<{ success: boolean; error: string | null }> {
    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than zero" };
    }

    const walletResult = await this.getOrCreateWallet(investorId);
    if (!walletResult.data) {
      return { success: false, error: walletResult.error || "Wallet not found" };
    }

    const wallet = walletResult.data;
    const updatedWallet = {
      available_balance: roundCurrency(wallet.available_balance + amount),
      total_added: roundCurrency(toNumber(wallet.total_added) + amount),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("paper_wallets")
      .update(updatedWallet)
      .eq("investor_id", investorId);

    if (error) {
      return { success: false, error: error.message };
    }

    await this.insertWalletTransaction(
      investorId,
      "add_funds",
      amount,
      "Added simulated venture capital funds"
    );

    return { success: true, error: null };
  }

  private static async getStartupFundingContext(
    startupId: string
  ): Promise<{ data: StartupFundingContext | null; error: string | null }> {
    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .select("*")
      .eq("id", startupId)
      .single();

    if (startupError) {
      return { data: null, error: startupError.message };
    }

    const { data: investments, error: investmentError } = await supabase
      .from("paper_investments")
      .select("amount")
      .eq("startup_id", startupId)
      .eq("status", "active");

    if (investmentError && !isRelationMissingError(investmentError)) {
      return { data: null, error: investmentError.message };
    }

    const totalAcceptedRaised = (investments || []).reduce(
      (sum, investment) => sum + toNumber(investment.amount),
      0
    );

    const fundingGoal = toNumber(startup.capital_seeking, 0);
    const remainingFundingGoal =
      fundingGoal > 0 ? Math.max(fundingGoal - totalAcceptedRaised, 0) : null;

    return {
      data: {
        startup,
        totalAcceptedRaised,
        remainingFundingGoal,
      },
      error: null,
    };
  }

  private static async getActiveMatchmakingId(
    investorId: string,
    startupId: string
  ): Promise<{ id: string | null; error: string | null }> {
    const { data, error } = await supabase
      .from("matchmakings")
      .select("id, is_archived, created_at")
      .eq("investor_id", investorId)
      .eq("startup_id", startupId);

    if (error) {
      return { id: null, error: error.message };
    }

    if (!data || !hasActiveMatchmaking(data)) {
      return {
        id: null,
        error: null,
      };
    }

    return { id: data[0]?.id || null, error: null };
  }

  static async createInvestmentOffer(
    input: CreatePaperInvestmentOfferInput
  ): Promise<{ success: boolean; error: string | null }> {
    if (input.amount <= 0) {
      return { success: false, error: "Investment amount must be positive" };
    }

    const [walletResult, fundingContextResult, matchmakingResult] =
      await Promise.all([
        this.getOrCreateWallet(input.investorId),
        this.getStartupFundingContext(input.startupId),
        this.getActiveMatchmakingId(input.investorId, input.startupId),
      ]);

    if (!walletResult.data) {
      return { success: false, error: walletResult.error || "Wallet unavailable" };
    }
    if (!fundingContextResult.data) {
      return {
        success: false,
        error: fundingContextResult.error || "Startup details unavailable",
      };
    }
    if (matchmakingResult.error) {
      return {
        success: false,
        error: matchmakingResult.error,
      };
    }

    const wallet = walletResult.data;
    const fundingContext = fundingContextResult.data;
    const currentValuation = toNumber(
      fundingContext.startup.pre_money_valuation,
      0
    );

    if (wallet.available_balance < input.amount) {
      return {
        success: false,
        error: "This exceeds your available simulated balance",
      };
    }

    if (
      !input.allowOverfunding &&
      fundingContext.remainingFundingGoal !== null &&
      input.amount > fundingContext.remainingFundingGoal
    ) {
      return {
        success: false,
        error: "This exceeds the startup's remaining simulated funding goal",
      };
    }

    if (currentValuation <= 0) {
      return {
        success: false,
        error: "Startup valuation is required before making a simulated investment offer",
      };
    }

    const impliedEquity = calculateOwnershipPercentage(
      input.amount,
      currentValuation
    );

    const { error: offerError } = await supabase
      .from("paper_investment_offers")
      .insert({
        investor_id: input.investorId,
        startup_id: input.startupId,
        matchmaking_id: matchmakingResult.id,
        amount: roundCurrency(input.amount),
        valuation_at_offer: roundCurrency(currentValuation),
        implied_equity_percentage: impliedEquity,
        status: "pending",
        note: input.note || null,
      });

    if (offerError) {
      return { success: false, error: offerError.message };
    }

    // Notify startup of new investment offer
    await NotificationService.createNotification({
      user_id: input.startupId,
      type: "investment_interest",
      title: "New Investment Offer",
      content: `An investor has made a simulated investment offer of SAR ${input.amount.toLocaleString()} for your startup.`,
      priority: "high",
      action_url: "/startup-dashboard",
      action_label: "View Offer",
      metadata: { investor_id: input.investorId, amount: input.amount },
    });

    const { error: walletError } = await supabase
      .from("paper_wallets")
      .update({
        available_balance: roundCurrency(wallet.available_balance - input.amount),
        reserved_balance: roundCurrency(
          toNumber(wallet.reserved_balance) + input.amount
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("investor_id", input.investorId);

    if (walletError) {
      return { success: false, error: walletError.message };
    }

    await this.insertWalletTransaction(
      input.investorId,
      "investment_reserved",
      input.amount,
      `Reserved simulated funds for ${fundingContext.startup.startup_name}`,
      { startup_id: input.startupId }
    );

    return { success: true, error: null };
  }

  static async updateOfferStatus(
    offerId: string,
    status: Extract<PaperInvestmentOfferStatus, "rejected" | "cancelled">
  ): Promise<{ success: boolean; error: string | null }> {
    const { data: offer, error: offerError } = await supabase
      .from("paper_investment_offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (offerError) {
      return { success: false, error: offerError.message };
    }

    if (offer.status !== "pending") {
      return { success: false, error: "Only pending offers can be updated" };
    }

    const walletResult = await this.getOrCreateWallet(offer.investor_id);
    if (!walletResult.data) {
      return { success: false, error: walletResult.error || "Wallet not found" };
    }

    const wallet = walletResult.data;

    const { error: walletError } = await supabase
      .from("paper_wallets")
      .update({
        available_balance: roundCurrency(wallet.available_balance + offer.amount),
        reserved_balance: roundCurrency(
          Math.max(toNumber(wallet.reserved_balance) - offer.amount, 0)
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("investor_id", offer.investor_id);

    if (walletError) {
      return { success: false, error: walletError.message };
    }

    await this.insertWalletTransaction(
      offer.investor_id,
      "investment_released",
      offer.amount,
      `Released reserved simulated funds for ${status} offer`,
      { offer_id: offerId, startup_id: offer.startup_id }
    );

    const { error: statusError } = await supabase
      .from("paper_investment_offers")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", offerId);

    if (statusError) {
      return { success: false, error: statusError.message };
    }

    // Notify investor of rejection or cancellation
    const actionLabel = status === "rejected" ? "rejected" : "cancelled";
    await NotificationService.createNotification({
      user_id: offer.investor_id,
      type: "investment_interest",
      title: `Investment Offer ${status === "rejected" ? "Rejected" : "Cancelled"}`,
      content: `Your simulated investment offer of SAR ${offer.amount.toLocaleString()} was ${actionLabel}.`,
      priority: "normal",
      action_url: "/investor-portfolio",
      action_label: "View Portfolio",
      metadata: { offer_id: offerId, status },
    });

    return { success: true, error: null };
  }

  static async acceptOffer(
    offerId: string
  ): Promise<{ success: boolean; error: string | null }> {
    const { data: offer, error: offerError } = await supabase
      .from("paper_investment_offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (offerError) {
      return { success: false, error: offerError.message };
    }

    if (offer.status !== "pending") {
      return { success: false, error: "Only pending offers can be accepted" };
    }

    const [walletResult, fundingContextResult] = await Promise.all([
      this.getOrCreateWallet(offer.investor_id),
      this.getStartupFundingContext(offer.startup_id),
    ]);

    if (!walletResult.data) {
      return { success: false, error: walletResult.error || "Wallet not found" };
    }
    if (!fundingContextResult.data) {
      return {
        success: false,
        error: fundingContextResult.error || "Startup not found",
      };
    }

    const wallet = walletResult.data;
    const startup = fundingContextResult.data.startup;
    const valuationAtInvestment = toNumber(startup.pre_money_valuation);

    if (valuationAtInvestment <= 0) {
      return {
        success: false,
        error: "Startup valuation must be set before accepting an offer",
      };
    }

    const ownershipPct = calculateOwnershipPercentage(
      offer.amount,
      valuationAtInvestment
    );

    const { error: investmentError } = await supabase
      .from("paper_investments")
      .insert({
        investor_id: offer.investor_id,
        startup_id: offer.startup_id,
        offer_id: offer.id,
        matchmaking_id: offer.matchmaking_id,
        amount: offer.amount,
        valuation_at_investment: valuationAtInvestment,
        ownership_pct: ownershipPct,
        instrument: startup.investment_instrument || "Equity",
        notes: offer.note || null,
        status: "active",
      });

    if (investmentError) {
      return { success: false, error: investmentError.message };
    }

    const { error: walletError } = await supabase
      .from("paper_wallets")
      .update({
        reserved_balance: roundCurrency(
          Math.max(toNumber(wallet.reserved_balance) - offer.amount, 0)
        ),
        invested_balance: roundCurrency(
          toNumber(wallet.invested_balance) + offer.amount
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("investor_id", offer.investor_id);

    if (walletError) {
      return { success: false, error: walletError.message };
    }

    await this.insertWalletTransaction(
      offer.investor_id,
      "investment_finalized",
      offer.amount,
      `Finalized simulated investment in ${startup.startup_name}`,
      { offer_id: offer.id, startup_id: offer.startup_id }
    );

    const { error: offerUpdateError } = await supabase
      .from("paper_investment_offers")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", offer.id);

    if (offerUpdateError) {
      return { success: false, error: offerUpdateError.message };
    }

    // Notify investor of acceptance
    await NotificationService.createNotification({
      user_id: offer.investor_id,
      type: "investment_interest",
      title: "Investment Offer Accepted",
      content: `${startup.startup_name} has accepted your simulated investment offer of SAR ${offer.amount.toLocaleString()}.`,
      priority: "high",
      action_url: "/investor-portfolio",
      action_label: "View Portfolio",
      metadata: { startup_id: offer.startup_id, amount: offer.amount },
    });

    return { success: true, error: null };
  }

  static async exitInvestment(
    investmentId: string,
    exitAmount: number
  ): Promise<{ success: boolean; error: string | null }> {
    const { data: investment, error: fetchError } = await supabase
      .from("paper_investments")
      .select("*")
      .eq("id", investmentId)
      .single();

    if (fetchError || !investment) {
      return { success: false, error: fetchError?.message ?? "Investment not found" };
    }

    if (investment.status !== "active") {
      return { success: false, error: "Only active investments can be exited" };
    }

    const realizedGain = roundCurrency(exitAmount - toNumber(investment.amount));

    const { error: updateError } = await supabase
      .from("paper_investments")
      .update({
        status: "exited",
        exit_amount: roundCurrency(exitAmount),
        exited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", investmentId);

    if (updateError) return { success: false, error: updateError.message };

    const { data: wallet } = await supabase
      .from("paper_wallets")
      .select("*")
      .eq("investor_id", investment.investor_id)
      .single();

    if (wallet) {
      await supabase
        .from("paper_wallets")
        .update({
          invested_balance: roundCurrency(Math.max(toNumber(wallet.invested_balance) - toNumber(investment.amount), 0)),
          available_balance: roundCurrency(toNumber(wallet.available_balance) + exitAmount),
          realized_pnl: roundCurrency(toNumber(wallet.realized_pnl) + realizedGain),
          updated_at: new Date().toISOString(),
        })
        .eq("investor_id", investment.investor_id);
    }

    await NotificationService.createNotification({
      user_id: investment.investor_id,
      type: "investment_interest",
      title: "Investment Exited",
      content: `Your paper investment has been exited. Exit value: SAR ${exitAmount.toLocaleString()}. ${realizedGain >= 0 ? "Gain" : "Loss"}: SAR ${Math.abs(realizedGain).toLocaleString()}.`,
      priority: "high",
      action_url: "/investor-portfolio",
      action_label: "View Portfolio",
    });

    return { success: true, error: null };
  }

  static async getPortfolioValueTimeline(
    investorId: string
  ): Promise<{ date: string; value: number }[]> {
    const { data: investments } = await supabase
      .from("paper_investments")
      .select("startup_id, ownership_pct, amount, created_at")
      .eq("investor_id", investorId)
      .eq("status", "active");

    if (!investments || investments.length === 0) return [];

    const startupIds = investments.map((i) => i.startup_id);

    const { data: history } = await supabase
      .from("startup_valuation_history")
      .select("startup_id, valuation, created_at")
      .in("startup_id", startupIds)
      .order("created_at", { ascending: true });

    if (!history || history.length === 0) {
      const totalInvested = investments.reduce((sum, i) => sum + toNumber(i.amount), 0);
      return [{ date: new Date().toISOString().split("T")[0], value: roundCurrency(totalInvested) }];
    }

    const latestValuations = new Map<string, number>();
    for (const inv of investments) {
      latestValuations.set(
        inv.startup_id,
        toNumber(inv.amount) / (toNumber(inv.ownership_pct) / 100 || 1)
      );
    }

    const timeline: { date: string; value: number }[] = [];
    let lastDate = "";

    for (const entry of history) {
      latestValuations.set(entry.startup_id, toNumber(entry.valuation));
      const date = entry.created_at.split("T")[0];
      const totalValue = investments.reduce((sum, inv) => {
        const val = latestValuations.get(inv.startup_id) ?? 0;
        return sum + roundCurrency((toNumber(inv.ownership_pct) / 100) * val);
      }, 0);
      if (date === lastDate) {
        timeline[timeline.length - 1].value = roundCurrency(totalValue);
      } else {
        timeline.push({ date, value: roundCurrency(totalValue) });
        lastDate = date;
      }
    }

    return timeline;
  }

  static async getFundingProgressMap(
    startupIds: string[]
  ): Promise<Map<string, number>> {
    // Returns Map<startupId, totalRaisedSAR>
    if (startupIds.length === 0) return new Map();

    const { data } = await supabase
      .from("paper_investments")
      .select("startup_id, amount")
      .in("startup_id", startupIds)
      .eq("status", "active");

    const totals = new Map<string, number>();
    for (const row of data ?? []) {
      totals.set(row.startup_id, (totals.get(row.startup_id) ?? 0) + toNumber(row.amount));
    }
    return totals;
  }

  private static buildWalletSummary(
    wallet: PaperWallet,
    positions: PaperPortfolioPosition[],
    pendingOffers: PaperInvestmentOfferView[]
  ): PaperWalletSummary {
    const totalPortfolioValue = positions.reduce(
      (sum, position) => sum + position.current_paper_value,
      0
    );
    const totalAccepted = positions.reduce(
      (sum, position) => sum + position.amount_invested,
      0
    );
    const totalPending = pendingOffers
      .filter((offer) => offer.status === "pending")
      .reduce((sum, offer) => sum + offer.offered_amount, 0);
    const gainLoss = positions.reduce((sum, position) => sum + position.gain_loss, 0);

    return {
      investor_id: wallet.investor_id,
      currency_code: wallet.currency_code,
      starting_balance: wallet.starting_balance,
      total_added: toNumber(wallet.total_added),
      available_balance: wallet.available_balance,
      reserved_balance: toNumber(wallet.reserved_balance),
      invested_balance: wallet.invested_balance,
      total_portfolio_value: roundCurrency(totalPortfolioValue),
      total_pending_offers: roundCurrency(totalPending),
      total_accepted_investments: roundCurrency(totalAccepted),
      current_gain_loss: roundCurrency(gainLoss),
      remaining_cash: wallet.available_balance,
      active_deals_count:
        positions.length +
        pendingOffers.filter((offer) => offer.status === "pending").length,
    };
  }

  private static async getInvestorsMap(investorIds: string[]) {
    if (investorIds.length === 0) return new Map<string, Investor>();

    const { data } = await supabase
      .from("investors")
      .select("*")
      .in("id", investorIds);

    return new Map((data || []).map((investor) => [investor.id, investor]));
  }

  private static async getStartupsMap(startupIds: string[]) {
    if (startupIds.length === 0) return new Map<string, Startup>();

    const { data } = await supabase
      .from("startups")
      .select("*")
      .in("id", startupIds);

    return new Map((data || []).map((startup) => [startup.id, startup]));
  }

  static async getInvestorPortfolioSummary(
    investorId: string
  ): Promise<{ data: InvestorPortfolioSummary | null; error: string | null }> {
    const walletResult = await this.getOrCreateWallet(investorId);

    if (!walletResult.data) {
      return { data: null, error: walletResult.error || "Wallet unavailable" };
    }

    try {
      const [{ data: offers, error: offersError }, { data: investments, error: investmentsError }] =
        await Promise.all([
          supabase
            .from("paper_investment_offers")
            .select("*")
            .eq("investor_id", investorId)
            .order("created_at", { ascending: false }),
          supabase
            .from("paper_investments")
            .select("*")
            .eq("investor_id", investorId)
            .eq("status", "active")
            .order("created_at", { ascending: false }),
        ]);

      if (offersError && !isRelationMissingError(offersError)) {
        return { data: null, error: offersError.message };
      }
      if (investmentsError && !isRelationMissingError(investmentsError)) {
        return { data: null, error: investmentsError.message };
      }

      const startupIds = [
        ...new Set([...(offers || []).map((offer) => offer.startup_id), ...(investments || []).map((investment) => investment.startup_id)]),
      ];
      const startupMap = await this.getStartupsMap(startupIds);
      const { data: walletTransactions, error: walletTransactionsError } =
        await supabase
          .from("paper_wallet_transactions")
          .select("*")
          .eq("investor_id", investorId)
          .order("created_at", { ascending: false })
          .limit(10);

      if (
        walletTransactionsError &&
        !isRelationMissingError(walletTransactionsError)
      ) {
        return { data: null, error: walletTransactionsError.message };
      }

      const positions: PaperPortfolioPosition[] = (investments || []).map(
        (investment) => {
          const startup = startupMap.get(investment.startup_id);
          const currentValuation = toNumber(startup?.pre_money_valuation);
          const equityPercentage = toNumber(investment.ownership_pct);
          const currentPaperValue = roundCurrency(
            (equityPercentage / 100) * currentValuation
          );
          const gainLoss = roundCurrency(currentPaperValue - investment.amount);
          const returnPercentage =
            investment.amount > 0
              ? roundPercentage((gainLoss / investment.amount) * 100)
              : 0;

          return {
            investment_id: investment.id,
            startup_id: investment.startup_id,
            startup_name: startup?.startup_name || startup?.name || "Startup",
            sector: startup?.industry || "Unspecified",
            amount_invested: toNumber(investment.amount),
            status: investment.status,
            valuation_at_investment: toNumber(investment.valuation_at_investment),
            current_valuation: currentValuation,
            equity_percentage: equityPercentage,
            current_paper_value: currentPaperValue,
            gain_loss: gainLoss,
            return_percentage: returnPercentage,
            invested_at: investment.created_at,
          };
        }
      );

      const pendingOffers: PaperInvestmentOfferView[] = (offers || []).map(
        (offer) => {
          const startup = startupMap.get(offer.startup_id);
          return {
            id: offer.id,
            investor_id: offer.investor_id,
            startup_id: offer.startup_id,
            startup_name: startup?.startup_name || startup?.name || "Startup",
            startup_sector: startup?.industry || "Unspecified",
            investor_name: "",
            offered_amount: toNumber(offer.amount),
            valuation_at_offer: toNumber(offer.valuation_at_offer),
            implied_equity_percentage: toNumber(offer.implied_equity_percentage),
            status: offer.status,
            created_at: offer.created_at,
            updated_at: offer.updated_at,
            note: offer.note,
          };
        }
      );

      const sectorMap = new Map<string, PaperSectorBreakdown>();
      positions.forEach((position) => {
        const existing = sectorMap.get(position.sector);
        if (existing) {
          existing.amount += position.amount_invested;
          existing.currentValue += position.current_paper_value;
          existing.count += 1;
          existing.acceptedAmount += position.amount_invested;
          existing.exposureType =
            existing.pendingAmount > 0 ? "mixed" : "accepted";
        } else {
          sectorMap.set(position.sector, {
            sector: position.sector,
            amount: position.amount_invested,
            currentValue: position.current_paper_value,
            count: 1,
            pendingAmount: 0,
            acceptedAmount: position.amount_invested,
            exposureType: "accepted",
          });
        }
      });

      pendingOffers
        .filter((offer) => offer.status === "pending")
        .forEach((offer) => {
          const existing = sectorMap.get(offer.startup_sector);
          if (existing) {
            existing.amount += offer.offered_amount;
            existing.pendingAmount += offer.offered_amount;
            existing.exposureType =
              existing.acceptedAmount > 0 ? "mixed" : "pending";
          } else {
            sectorMap.set(offer.startup_sector, {
              sector: offer.startup_sector,
              amount: offer.offered_amount,
              currentValue: 0,
              count: 1,
              pendingAmount: offer.offered_amount,
              acceptedAmount: 0,
              exposureType: "pending",
            });
          }
        });

      const sectorBreakdown = Array.from(sectorMap.values()).sort(
        (a, b) => b.amount - a.amount
      );

      const activityMap = new Map<string, PaperPortfolioActivityItem>();

      (walletTransactions || []).forEach((transaction) => {
        const amount = toNumber(transaction.amount);
        const baseItem = {
          id: `wallet-${transaction.id}`,
          amount,
          created_at: transaction.created_at,
        };

        if (transaction.type === "add_funds" || transaction.type === "initial_funding") {
          activityMap.set(baseItem.id, {
            ...baseItem,
            type: "add_funds",
            title: "Virtual funds added",
            description:
              transaction.description || "Simulated funds were added to your wallet.",
          });
        } else if (transaction.type === "investment_reserved") {
          activityMap.set(baseItem.id, {
            ...baseItem,
            type: "offer_submitted",
            title: "Investment offer submitted",
            description:
              transaction.description ||
              "Virtual funds were reserved for a pending offer.",
          });
        } else if (transaction.type === "investment_finalized") {
          activityMap.set(baseItem.id, {
            ...baseItem,
            type: "offer_accepted",
            title: "Offer accepted",
            description:
              transaction.description ||
              "A startup accepted your simulated investment offer.",
          });
        } else if (transaction.type === "investment_released") {
          activityMap.set(baseItem.id, {
            ...baseItem,
            type: "offer_cancelled",
            title: "Reserved funds released",
            description:
              transaction.description ||
              "Reserved simulated funds were returned to available cash.",
          });
        }
      });

      pendingOffers.forEach((offer) => {
        if (offer.status === "rejected") {
          activityMap.set(`offer-${offer.id}-rejected`, {
            id: `offer-${offer.id}-rejected`,
            type: "offer_rejected",
            title: "Offer rejected",
            description: `${offer.startup_name} rejected your simulated offer.`,
            amount: offer.offered_amount,
            created_at: offer.updated_at || offer.created_at,
            status: offer.status,
          });
        }

        if (offer.status === "cancelled") {
          activityMap.set(`offer-${offer.id}-cancelled`, {
            id: `offer-${offer.id}-cancelled`,
            type: "offer_cancelled",
            title: "Offer cancelled",
            description: `You cancelled the pending offer for ${offer.startup_name}.`,
            amount: offer.offered_amount,
            created_at: offer.updated_at || offer.created_at,
            status: offer.status,
          });
        }
      });

      const { data: valuationHistory, error: valuationHistoryError } =
        await supabase
          .from("startup_valuation_history")
          .select("*")
          .in("startup_id", startupIds)
          .order("created_at", { ascending: false })
          .limit(10);

      if (valuationHistoryError && !isRelationMissingError(valuationHistoryError)) {
        return { data: null, error: valuationHistoryError.message };
      }

      (valuationHistory || []).forEach((entry) => {
        const startup = startupMap.get(entry.startup_id);
        activityMap.set(`valuation-${entry.id}`, {
          id: `valuation-${entry.id}`,
          type: "valuation_changed",
          title: "Valuation updated",
          description: `${
            startup?.startup_name || "A startup"
          } now carries a simulated valuation of ${roundCurrency(
            toNumber(entry.valuation)
          ).toLocaleString()} SAR.`,
          amount: toNumber(entry.valuation),
          created_at: entry.created_at,
        });
      });

      const recentActivity = Array.from(activityMap.values())
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 8);

      return {
        data: {
          wallet: this.buildWalletSummary(
            walletResult.data,
            positions,
            pendingOffers
          ),
          positions,
          sectorBreakdown,
          pendingOffers,
          recentActivity,
        },
        error: null,
      };
    } catch (error) {
      if (isRelationMissingError(error)) {
        return {
          data: {
            wallet: this.buildWalletSummary(walletResult.data, [], []),
            positions: [],
            sectorBreakdown: [],
            pendingOffers: [],
            recentActivity: [],
          },
          error: null,
        };
      }

      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Failed to load portfolio",
      };
    }
  }

  static async getInvestorPaperProfilePreview(
    investorId: string
  ): Promise<{ data: InvestorPaperProfilePreview | null; error: string | null }> {
    const [{ data: investor, error: investorError }, portfolioResult] =
      await Promise.all([
        supabase.from("investors").select("*").eq("id", investorId).single(),
        this.getInvestorPortfolioSummary(investorId),
      ]);

    if (investorError) {
      return { data: null, error: investorError.message };
    }
    if (!portfolioResult.data) {
      return { data: null, error: portfolioResult.error || "Portfolio unavailable" };
    }

    const sectors = [
      ...new Set(
        portfolioResult.data.positions
          .map((position) => position.sector)
          .filter(Boolean)
      ),
    ];

    return {
      data: {
        id: investor.id,
        name: investor.name,
        company: investor.company,
        role: investor.role,
        preferredIndustries: (investor.preferred_industries || "")
          .split(",")
          .map((industry) => industry.trim())
          .filter(Boolean),
        preferredStage: investor.preferred_company_stage,
        averageTicketSize: investor.average_ticket_size,
        totalDeployedCapital:
          portfolioResult.data.wallet.total_accepted_investments,
        startupsInvestedCount: portfolioResult.data.positions.length,
        sectorsInvestedIn: sectors,
        pendingOffersCount: portfolioResult.data.pendingOffers.filter(
          (offer) => offer.status === "pending"
        ).length,
        portfolioValue: portfolioResult.data.wallet.total_portfolio_value,
      },
      error: null,
    };
  }

  static async getStartupInvestmentDashboard(
    startupId: string
  ): Promise<{ data: StartupPaperInvestmentDashboard | null; error: string | null }> {
    try {
      const [{ data: offers, error: offersError }, { data: investments, error: investmentsError }] =
        await Promise.all([
          supabase
            .from("paper_investment_offers")
            .select("*")
            .eq("startup_id", startupId)
            .order("created_at", { ascending: false }),
          supabase
            .from("paper_investments")
            .select("*")
            .eq("startup_id", startupId)
            .eq("status", "active")
            .order("created_at", { ascending: false }),
        ]);

      if (offersError && !isRelationMissingError(offersError)) {
        return { data: null, error: offersError.message };
      }
      if (investmentsError && !isRelationMissingError(investmentsError)) {
        return { data: null, error: investmentsError.message };
      }

      const fundingContextResult = await this.getStartupFundingContext(startupId);
      if (!fundingContextResult.data) {
        return {
          data: null,
          error: fundingContextResult.error || "Startup funding context unavailable",
        };
      }

      const investorIds = [
        ...new Set([...(offers || []).map((offer) => offer.investor_id), ...(investments || []).map((investment) => investment.investor_id)]),
      ];

      const investorMap = await this.getInvestorsMap(investorIds);

      const offerViews = await Promise.all(
        (offers || []).map(async (offer) => {
          const investor = investorMap.get(offer.investor_id);
          const investorPreviewResult = await this.getInvestorPaperProfilePreview(
            offer.investor_id
          );

          return {
            id: offer.id,
            investor_id: offer.investor_id,
            startup_id: offer.startup_id,
            startup_name: fundingContextResult.data?.startup.startup_name || "Startup",
            startup_sector: fundingContextResult.data?.startup.industry || "Unspecified",
            investor_name: investor?.name || "Investor",
            offered_amount: toNumber(offer.amount),
            valuation_at_offer: toNumber(offer.valuation_at_offer),
            implied_equity_percentage: toNumber(offer.implied_equity_percentage),
            status: offer.status,
            created_at: offer.created_at,
            updated_at: offer.updated_at,
            note: offer.note,
            investor: investorPreviewResult.data || undefined,
          } satisfies PaperInvestmentOfferView;
        })
      );

      const capEntries: StartupCapTableEntry[] = (investments || []).map(
        (investment) => {
          const investor = investorMap.get(investment.investor_id);
          const currentValuation = toNumber(
            fundingContextResult.data?.startup.pre_money_valuation
          );
          const currentPaperValue = roundCurrency(
            (toNumber(investment.ownership_pct) / 100) * currentValuation
          );

          return {
            investor_id: investment.investor_id,
            investor_name: investor?.name || "Investor",
            amount_invested: toNumber(investment.amount),
            equity_percentage: toNumber(investment.ownership_pct),
            valuation_at_investment: toNumber(investment.valuation_at_investment),
            current_paper_value: currentPaperValue,
            invested_at: investment.created_at,
          };
        }
      );

      const totalRaised = capEntries.reduce(
        (sum, entry) => sum + entry.amount_invested,
        0
      );
      const totalEquitySold = capEntries.reduce(
        (sum, entry) => sum + entry.equity_percentage,
        0
      );
      const fundingGoal = toNumber(fundingContextResult.data.startup.capital_seeking);
      const capTable: StartupCapTableSummary = {
        startup_id: startupId,
        startup_name: fundingContextResult.data.startup.startup_name,
        funding_goal: fundingGoal,
        total_simulated_raised: roundCurrency(totalRaised),
        funding_progress_percentage:
          fundingGoal > 0
            ? roundPercentage((totalRaised / fundingGoal) * 100)
            : 0,
        total_equity_sold: roundPercentage(totalEquitySold),
        remaining_equity_available: roundPercentage(
          Math.max(100 - totalEquitySold, 0)
        ),
        current_valuation: toNumber(
          fundingContextResult.data.startup.pre_money_valuation
        ),
        entries: capEntries,
      };

      return {
        data: {
          offers: offerViews,
          capTable,
        },
        error: null,
      };
    } catch (error) {
      if (isRelationMissingError(error)) {
        const fundingContextResult = await this.getStartupFundingContext(startupId);
        return {
          data: {
            offers: [],
            capTable: {
              startup_id: startupId,
              startup_name:
                fundingContextResult.data?.startup.startup_name || "Startup",
              funding_goal: toNumber(fundingContextResult.data?.startup.capital_seeking),
              total_simulated_raised: 0,
              funding_progress_percentage: 0,
              total_equity_sold: 0,
              remaining_equity_available: 100,
              current_valuation: toNumber(
                fundingContextResult.data?.startup.pre_money_valuation
              ),
              entries: [],
            },
          },
          error: null,
        };
      }

      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load startup investment dashboard",
      };
    }
  }

  static async updateStartupValuation(
    input: StartupValuationUpdateInput
  ): Promise<{ success: boolean; error: string | null }> {
    if (input.valuation <= 0) {
      return { success: false, error: "Valuation must be greater than zero" };
    }

    const { error: startupError } = await supabase
      .from("startups")
      .update({
        pre_money_valuation: roundCurrency(input.valuation),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.startupId);

    if (startupError) {
      return { success: false, error: startupError.message };
    }

    try {
      await supabase.from("startup_valuation_history").insert({
        startup_id: input.startupId,
        valuation: roundCurrency(input.valuation),
        reason: input.reason || null,
      });
    } catch (error) {
      if (!isRelationMissingError(error)) {
        console.error("Failed to insert valuation history", error);
      }
    }

    return { success: true, error: null };
  }
}
