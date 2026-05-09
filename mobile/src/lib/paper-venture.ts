/**
 * Paper venture / simulated wallet logic aligned with web `PaperVentureService`.
 */
import { supabase } from "@/lib/supabase/client";
import type { Startup } from "@/types/database";

const DEFAULT_STARTING_BALANCE = 100_000;
const DEFAULT_CURRENCY = "SAR";

export const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const roundPercentage = (value: number) =>
  Math.round((value + Number.EPSILON) * 10000) / 10000;

export const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const isRelationMissingError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
};

export interface PaperWalletRow {
  investor_id: string;
  currency_code: string;
  starting_balance: number;
  total_added: number;
  available_balance: number;
  reserved_balance: number;
  invested_balance: number;
  realized_pnl: number;
  created_at: string;
  updated_at?: string;
}

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

export interface PaperInvestmentOfferView {
  id: string;
  investor_id: string;
  startup_id: string;
  startup_name: string;
  startup_sector: string;
  offered_amount: number;
  valuation_at_offer: number;
  implied_equity_percentage: number;
  status: string;
  created_at: string;
  updated_at?: string;
  note?: string | null;
}

export interface PaperPortfolioActivityItem {
  id: string;
  type: string;
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

function normalizeWallet(wallet: Partial<PaperWalletRow>): PaperWalletRow {
  return {
    investor_id: wallet.investor_id || "",
    currency_code: wallet.currency_code || DEFAULT_CURRENCY,
    starting_balance: toNumber(wallet.starting_balance, DEFAULT_STARTING_BALANCE),
    total_added: toNumber(wallet.total_added),
    available_balance: toNumber(wallet.available_balance, DEFAULT_STARTING_BALANCE),
    reserved_balance: toNumber(wallet.reserved_balance),
    invested_balance: toNumber(wallet.invested_balance),
    realized_pnl: toNumber(wallet.realized_pnl),
    created_at: wallet.created_at || new Date().toISOString(),
    updated_at: wallet.updated_at,
  };
}

function calculateOwnershipPercentage(amount: number, valuation: number) {
  if (valuation <= 0) return 0;
  return roundPercentage((amount / valuation) * 100);
}

const hasActiveMatchmaking = (
  matchmakings: { is_archived: boolean; created_at: string }[]
) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return matchmakings.some(
    (m) =>
      !m.is_archived &&
      new Date(m.created_at).getTime() >= sevenDaysAgo.getTime()
  );
};

async function insertWalletTransaction(
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
  await supabase.from("paper_wallet_transactions").insert({
    investor_id: investorId,
    type,
    amount: roundCurrency(amount),
    description,
    metadata: metadata ?? {},
  } as Record<string, unknown>);
}

export async function getOrCreateWallet(
  investorId: string
): Promise<{ data: PaperWalletRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("paper_wallets")
    .select("*")
    .eq("investor_id", investorId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (data) return { data: normalizeWallet(data as PaperWalletRow), error: null };

  const walletToInsert = {
    investor_id: investorId,
    currency_code: DEFAULT_CURRENCY,
    starting_balance: DEFAULT_STARTING_BALANCE,
    total_added: 0,
    available_balance: DEFAULT_STARTING_BALANCE,
    reserved_balance: 0,
    invested_balance: 0,
    realized_pnl: 0,
  };

  const { data: insertedWallet, error: insertError } = await supabase
    .from("paper_wallets")
    .insert(walletToInsert as Record<string, unknown>)
    .select("*")
    .single();

  if (insertError || !insertedWallet)
    return { data: null, error: insertError?.message ?? "Wallet" };

  await insertWalletTransaction(
    investorId,
    "initial_funding",
    DEFAULT_STARTING_BALANCE,
    "Initial simulated venture fund balance"
  );

  return { data: normalizeWallet(insertedWallet as PaperWalletRow), error: null };
}

export async function addVirtualFunds(
  investorId: string,
  amount: number
): Promise<{ success: boolean; error: string | null }> {
  if (amount <= 0) return { success: false, error: "Amount must be greater than zero" };

  const walletResult = await getOrCreateWallet(investorId);
  if (!walletResult.data)
    return { success: false, error: walletResult.error || "Wallet not found" };

  const wallet = walletResult.data;
  const updatedWallet = {
    available_balance: roundCurrency(wallet.available_balance + amount),
    total_added: roundCurrency(toNumber(wallet.total_added) + amount),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("paper_wallets")
    .update(updatedWallet as Record<string, unknown>)
    .eq("investor_id", investorId);

  if (error) return { success: false, error: error.message };

  await insertWalletTransaction(
    investorId,
    "add_funds",
    amount,
    "Added simulated venture capital funds"
  );

  return { success: true, error: null };
}

async function getStartupFundingContext(startupId: string): Promise<{
  data: {
    startup: Startup;
    totalAcceptedRaised: number;
    remainingFundingGoal: number | null;
  } | null;
  error: string | null;
}> {
  const { data: startup, error: startupError } = await supabase
    .from("startups")
    .select("*")
    .eq("id", startupId)
    .single();

  if (startupError) return { data: null, error: startupError.message };

  const { data: investments, error: investmentError } = await supabase
    .from("paper_investments")
    .select("amount")
    .eq("startup_id", startupId)
    .eq("status", "active");

  if (investmentError && !isRelationMissingError(investmentError)) {
    return { data: null, error: investmentError.message };
  }

  const totalAcceptedRaised = (investments || []).reduce((sum: number, investment: { amount?: unknown }) => {
    return sum + toNumber(investment.amount);
  }, 0);

  const fundingGoal = toNumber((startup as Startup).capital_seeking, 0);
  const remainingFundingGoal =
    fundingGoal > 0 ? Math.max(fundingGoal - totalAcceptedRaised, 0) : null;

  return {
    data: {
      startup: startup as Startup,
      totalAcceptedRaised,
      remainingFundingGoal,
    },
    error: null,
  };
}

async function getActiveMatchmakingId(
  investorId: string,
  startupId: string
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("matchmakings")
    .select("id, is_archived, created_at")
    .eq("investor_id", investorId)
    .eq("startup_id", startupId);

  if (error) return { id: null, error: error.message };
  if (!data || !hasActiveMatchmaking(data)) return { id: null, error: null };
  return { id: data[0]?.id || null, error: null };
}

async function notifyStartupNewOffer(
  startupId: string,
  investorId: string,
  amount: number
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: startupId,
    type: "investment_interest",
    title: "New Investment Offer",
    content: `An investor has made a simulated investment offer of SAR ${amount.toLocaleString()} for your startup.`,
    priority: "high",
    action_url: "/startup-dashboard",
    action_label: "View Offer",
    metadata: { investor_id: investorId, amount },
  } as Record<string, unknown>);
  if (error && typeof __DEV__ !== "undefined" && __DEV__)
    console.warn("notification insert:", error.message);
}

export async function createInvestmentOffer(input: {
  investorId: string;
  startupId: string;
  amount: number;
  note?: string;
  allowOverfunding?: boolean;
}): Promise<{ success: boolean; error: string | null }> {
  if (input.amount <= 0)
    return { success: false, error: "Investment amount must be positive" };

  const [walletResult, fundingContextResult, matchmakingResult] = await Promise.all([
    getOrCreateWallet(input.investorId),
    getStartupFundingContext(input.startupId),
    getActiveMatchmakingId(input.investorId, input.startupId),
  ]);

  if (!walletResult.data)
    return { success: false, error: walletResult.error || "Wallet unavailable" };
  if (!fundingContextResult.data)
    return {
      success: false,
      error: fundingContextResult.error || "Startup details unavailable",
    };
  if (matchmakingResult.error)
    return { success: false, error: matchmakingResult.error };

  const wallet = walletResult.data;
  const fundingContext = fundingContextResult.data;
  const currentValuation = toNumber(fundingContext.startup.pre_money_valuation, 0);

  if (wallet.available_balance < input.amount)
    return { success: false, error: "This exceeds your available simulated balance" };

  if (
    !input.allowOverfunding &&
    fundingContext.remainingFundingGoal !== null &&
    input.amount > fundingContext.remainingFundingGoal
  )
    return {
      success: false,
      error: "This exceeds the startup's remaining simulated funding goal",
    };

  if (currentValuation <= 0)
    return {
      success: false,
      error:
        "Startup valuation is required before making a simulated investment offer",
    };

  const impliedEquity = calculateOwnershipPercentage(input.amount, currentValuation);

  const { error: offerError } = await supabase.from("paper_investment_offers").insert({
    investor_id: input.investorId,
    startup_id: input.startupId,
    matchmaking_id: matchmakingResult.id,
    amount: roundCurrency(input.amount),
    valuation_at_offer: roundCurrency(currentValuation),
    implied_equity_percentage: impliedEquity,
    status: "pending",
    note: input.note || null,
  } as Record<string, unknown>);

  if (offerError) return { success: false, error: offerError.message };

  await notifyStartupNewOffer(input.startupId, input.investorId, input.amount);

  const { error: walletError } = await supabase
    .from("paper_wallets")
    .update({
      available_balance: roundCurrency(wallet.available_balance - input.amount),
      reserved_balance: roundCurrency(toNumber(wallet.reserved_balance) + input.amount),
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("investor_id", input.investorId);

  if (walletError) return { success: false, error: walletError.message };

  await insertWalletTransaction(
    input.investorId,
    "investment_reserved",
    input.amount,
    `Reserved simulated funds for ${fundingContext.startup.startup_name || fundingContext.startup.name}`,
    { startup_id: input.startupId }
  );

  return { success: true, error: null };
}

/** Investor cancels own pending offer (releases reserved funds). */
export async function cancelInvestorOffer(
  offerId: string
): Promise<{ success: boolean; error: string | null }> {
  const { data: offer, error: offerError } = await supabase
    .from("paper_investment_offers")
    .select("*")
    .eq("id", offerId)
    .single();

  if (offerError || !offer)
    return { success: false, error: offerError?.message ?? "Offer not found" };

  if (offer.status !== "pending")
    return { success: false, error: "Only pending offers can be cancelled" };

  const walletResult = await getOrCreateWallet(offer.investor_id as string);
  if (!walletResult.data)
    return { success: false, error: walletResult.error || "Wallet not found" };

  const wallet = walletResult.data;
  const amt = toNumber(offer.amount);

  const { error: walletError } = await supabase
    .from("paper_wallets")
    .update({
      available_balance: roundCurrency(wallet.available_balance + amt),
      reserved_balance: roundCurrency(Math.max(toNumber(wallet.reserved_balance) - amt, 0)),
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("investor_id", offer.investor_id as string);

  if (walletError) return { success: false, error: walletError.message };

  await insertWalletTransaction(
    offer.investor_id as string,
    "investment_released",
    amt,
    "Released reserved simulated funds for cancelled offer",
    { offer_id: offerId, startup_id: offer.startup_id }
  );

  const { error: statusError } = await supabase
    .from("paper_investment_offers")
    .update({ status: "cancelled", updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq("id", offerId);

  if (statusError) return { success: false, error: statusError.message };

  return { success: true, error: null };
}

function buildWalletSummary(
  wallet: PaperWalletRow,
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

async function getStartupsMap(startupIds: string[]) {
  if (startupIds.length === 0) return new Map<string, Startup>();
  const { data } = await supabase.from("startups").select("*").in("id", startupIds);
  return new Map(
    (data || []).map((s: Startup) => [s.id, s])
  );
}

export async function getPortfolioValueTimeline(
  investorId: string
): Promise<{ date: string; value: number }[]> {
  const { data: investments } = await supabase
    .from("paper_investments")
    .select("startup_id, ownership_pct, amount, created_at")
    .eq("investor_id", investorId)
    .eq("status", "active");

  if (!investments || investments.length === 0) return [];

  const startupIds = investments.map((i: { startup_id: string }) => i.startup_id);

  const { data: history } = await supabase
    .from("startup_valuation_history")
    .select("startup_id, valuation, created_at")
    .in("startup_id", startupIds)
    .order("created_at", { ascending: true });

  if (!history || history.length === 0) {
    const totalInvested = investments.reduce((sum: number, i: { amount?: unknown }) => {
      return sum + toNumber(i.amount);
    }, 0);
    return [{ date: new Date().toISOString().split("T")[0], value: roundCurrency(totalInvested) }];
  }

  const latestValuations = new Map<string, number>();
  for (const inv of investments) {
    const row = inv as { startup_id: string; amount?: unknown; ownership_pct?: unknown };
    latestValuations.set(
      row.startup_id,
      toNumber(row.amount) / (toNumber(row.ownership_pct) / 100 || 1)
    );
  }

  const timeline: { date: string; value: number }[] = [];
  let lastDate = "";

  for (const entry of history || []) {
    const e = entry as { startup_id: string; valuation: unknown; created_at: string };
    latestValuations.set(e.startup_id, toNumber(e.valuation));
    const date = e.created_at.split("T")[0];
    const totalValue = investments.reduce((sum: number, inv: { startup_id: string; ownership_pct?: unknown }) => {
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

export async function getInvestorPortfolioSummary(
  investorId: string
): Promise<{ data: InvestorPortfolioSummary | null; error: string | null }> {
  const walletResult = await getOrCreateWallet(investorId);
  if (!walletResult.data)
    return { data: null, error: walletResult.error || "Wallet unavailable" };

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

    if (offersError && !isRelationMissingError(offersError))
      return { data: null, error: offersError.message };
    if (investmentsError && !isRelationMissingError(investmentsError))
      return { data: null, error: investmentsError.message };

    const startupIds = [
      ...new Set([
        ...(offers || []).map((o: { startup_id: string }) => o.startup_id),
        ...(investments || []).map((i: { startup_id: string }) => i.startup_id),
      ]),
    ];
    const startupMap = await getStartupsMap(startupIds);

    const { data: walletTransactions, error: walletTransactionsError } = await supabase
      .from("paper_wallet_transactions")
      .select("*")
      .eq("investor_id", investorId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (walletTransactionsError && !isRelationMissingError(walletTransactionsError))
      return { data: null, error: walletTransactionsError.message };

    const positions: PaperPortfolioPosition[] = (investments || []).map((investment: Record<string, unknown>) => {
      const inv = investment;
      const startup = startupMap.get(inv.startup_id as string) as Startup | undefined;
      const currentValuation = toNumber(startup?.pre_money_valuation);
      const equityPercentage = toNumber(inv.ownership_pct);
      const currentPaperValue = roundCurrency((equityPercentage / 100) * currentValuation);
      const amountInvested = toNumber(inv.amount);
      const gainLoss = roundCurrency(currentPaperValue - amountInvested);
      const returnPercentage =
        amountInvested > 0 ? roundPercentage((gainLoss / amountInvested) * 100) : 0;

      return {
        investment_id: inv.id as string,
        startup_id: inv.startup_id as string,
        startup_name: startup?.startup_name || startup?.name || "Startup",
        sector: startup?.industry || "Unspecified",
        amount_invested: amountInvested,
        status: inv.status as string,
        valuation_at_investment: toNumber(inv.valuation_at_investment),
        current_valuation: currentValuation,
        equity_percentage: equityPercentage,
        current_paper_value: currentPaperValue,
        gain_loss: gainLoss,
        return_percentage: returnPercentage,
        invested_at: inv.created_at as string,
      };
    });

    const pendingOffers: PaperInvestmentOfferView[] = (offers || []).map((offer: Record<string, unknown>) => {
      const o = offer;
      const startup = startupMap.get(o.startup_id as string) as Startup | undefined;
      return {
        id: o.id as string,
        investor_id: o.investor_id as string,
        startup_id: o.startup_id as string,
        startup_name: startup?.startup_name || startup?.name || "Startup",
        startup_sector: startup?.industry || "Unspecified",
        offered_amount: toNumber(o.amount),
        valuation_at_offer: toNumber(o.valuation_at_offer),
        implied_equity_percentage: toNumber(o.implied_equity_percentage),
        status: o.status as string,
        created_at: o.created_at as string,
        updated_at: o.updated_at as string | undefined,
        note: (o.note as string) ?? null,
      };
    });

    const sectorMap = new Map<string, PaperSectorBreakdown>();
    positions.forEach((position) => {
      const existing = sectorMap.get(position.sector);
      if (existing) {
        existing.amount += position.amount_invested;
        existing.currentValue += position.current_paper_value;
        existing.count += 1;
        existing.acceptedAmount += position.amount_invested;
        existing.exposureType = existing.pendingAmount > 0 ? "mixed" : "accepted";
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
          existing.exposureType = existing.acceptedAmount > 0 ? "mixed" : "pending";
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

    const sectorBreakdown = Array.from(sectorMap.values()).sort((a, b) => b.amount - a.amount);

    const activityMap = new Map<string, PaperPortfolioActivityItem>();

    (walletTransactions || []).forEach((transaction: Record<string, unknown>) => {
      const tx = transaction;
      const amount = toNumber(tx.amount);
      const baseItem = {
        id: `wallet-${tx.id as string}`,
        amount,
        created_at: tx.created_at as string,
      };

      if (tx.type === "add_funds" || tx.type === "initial_funding") {
        activityMap.set(baseItem.id, {
          ...baseItem,
          type: "add_funds",
          title: "Virtual funds added",
          description:
            (tx.description as string) || "Simulated funds were added to your wallet.",
        });
      } else if (tx.type === "investment_reserved") {
        activityMap.set(baseItem.id, {
          ...baseItem,
          type: "offer_submitted",
          title: "Investment offer submitted",
          description:
            (tx.description as string) || "Virtual funds were reserved for a pending offer.",
        });
      } else if (tx.type === "investment_finalized") {
        activityMap.set(baseItem.id, {
          ...baseItem,
          type: "offer_accepted",
          title: "Offer accepted",
          description:
            (tx.description as string) || "A startup accepted your simulated investment offer.",
        });
      } else if (tx.type === "investment_released") {
        activityMap.set(baseItem.id, {
          ...baseItem,
          type: "offer_cancelled",
          title: "Reserved funds released",
          description:
            (tx.description as string) || "Reserved simulated funds were returned to available cash.",
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

    const { data: valuationHistory, error: valuationHistoryError } = await supabase
      .from("startup_valuation_history")
      .select("*")
      .in("startup_id", startupIds)
      .order("created_at", { ascending: false })
      .limit(10);

    if (valuationHistoryError && !isRelationMissingError(valuationHistoryError))
      return { data: null, error: valuationHistoryError.message };

    (valuationHistory || []).forEach((entry: { id: string; startup_id: string; valuation: unknown; created_at: string }) => {
      const e = entry;
      const startup = startupMap.get(e.startup_id) as Startup | undefined;
      activityMap.set(`valuation-${e.id}`, {
        id: `valuation-${e.id}`,
        type: "valuation_changed",
        title: "Valuation updated",
        description: `${startup?.startup_name || "A startup"} now carries a simulated valuation of ${roundCurrency(
          toNumber(e.valuation)
        ).toLocaleString()} SAR.`,
        amount: toNumber(e.valuation),
        created_at: e.created_at,
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
        wallet: buildWalletSummary(walletResult.data, positions, pendingOffers),
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
          wallet: buildWalletSummary(walletResult.data, [], []),
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
      error: error instanceof Error ? error.message : "Failed to load portfolio",
    };
  }
}

export async function loadPaperInvestContext(params: {
  investorId: string;
  startupId: string;
}): Promise<{
  availableBalance: number;
  remainingFundingGoal: number | null;
  valuation: number;
  startupName: string;
  error: string | null;
}> {
  const [walletResult, fundingResult] = await Promise.all([
    getOrCreateWallet(params.investorId),
    getStartupFundingContext(params.startupId),
  ]);

  if (!walletResult.data)
    return {
      availableBalance: 0,
      remainingFundingGoal: null,
      valuation: 0,
      startupName: "",
      error: walletResult.error || "Wallet unavailable",
    };
  if (!fundingResult.data)
    return {
      availableBalance: walletResult.data.available_balance,
      remainingFundingGoal: null,
      valuation: 0,
      startupName: "",
      error: fundingResult.error || "Startup unavailable",
    };

  const s = fundingResult.data.startup;
  return {
    availableBalance: walletResult.data.available_balance,
    remainingFundingGoal: fundingResult.data.remainingFundingGoal,
    valuation: toNumber(s.pre_money_valuation),
    startupName: s.startup_name || s.name || "Startup",
    error: null,
  };
}
