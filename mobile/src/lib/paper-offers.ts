import { supabase } from "@/lib/supabase/client";

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const calculateOwnershipPercentage = (amount: number, valuation: number) => {
  if (valuation <= 0) return 0;
  return Math.round(((amount / valuation) * 100 + Number.EPSILON) * 10000) / 10000;
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
  try {
    await supabase.from("paper_wallet_transactions").insert({
      investor_id: investorId,
      type,
      amount: roundCurrency(amount),
      description,
      metadata: metadata ?? {},
    } as Record<string, unknown>);
  } catch {
    /* non-fatal */
  }
}

async function getOrCreateWallet(investorId: string): Promise<{
  data: {
    available_balance: number;
    reserved_balance: number;
    invested_balance: number;
  } | null;
  error: string | null;
}> {
  const DEFAULT = 100_000;
  const { data, error } = await supabase
    .from("paper_wallets")
    .select("available_balance,reserved_balance,invested_balance")
    .eq("investor_id", investorId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (data) {
    return {
      data: {
        available_balance: toNumber(data.available_balance, DEFAULT),
        reserved_balance: toNumber(data.reserved_balance),
        invested_balance: toNumber(data.invested_balance),
      },
      error: null,
    };
  }

  const { data: inserted, error: insErr } = await supabase
    .from("paper_wallets")
    .insert({
      investor_id: investorId,
      currency_code: "SAR",
      starting_balance: DEFAULT,
      total_added: 0,
      available_balance: DEFAULT,
      reserved_balance: 0,
      invested_balance: 0,
      realized_pnl: 0,
    } as Record<string, unknown>)
    .select("available_balance,reserved_balance,invested_balance")
    .single();

  if (insErr || !inserted) return { data: null, error: insErr?.message ?? "Wallet" };
  await insertWalletTransaction(
    investorId,
    "initial_funding",
    DEFAULT,
    "Initial simulated venture fund balance"
  );
  return {
    data: {
      available_balance: toNumber(inserted.available_balance, DEFAULT),
      reserved_balance: toNumber(inserted.reserved_balance),
      invested_balance: toNumber(inserted.invested_balance),
    },
    error: null,
  };
}

/** Startup rejects a pending paper offer (releases investor reserved funds). */
export async function rejectStartupOffer(offerId: string): Promise<{ error: string | null }> {
  const { data: offer, error: offerError } = await supabase
    .from("paper_investment_offers")
    .select("*")
    .eq("id", offerId)
    .single();

  if (offerError || !offer) return { error: offerError?.message ?? "Offer not found" };
  if (offer.status !== "pending") return { error: "Only pending offers can be updated" };

  const walletResult = await getOrCreateWallet(offer.investor_id as string);
  if (!walletResult.data) return { error: walletResult.error || "Wallet not found" };

  const wallet = walletResult.data;
  const amt = toNumber(offer.amount);

  const { error: walletError } = await supabase
    .from("paper_wallets")
    .update({
      available_balance: roundCurrency(wallet.available_balance + amt),
      reserved_balance: roundCurrency(Math.max(wallet.reserved_balance - amt, 0)),
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("investor_id", offer.investor_id as string);

  if (walletError) return { error: walletError.message };

  await insertWalletTransaction(
    offer.investor_id as string,
    "investment_released",
    amt,
    "Released reserved simulated funds for rejected offer",
    { offer_id: offerId, startup_id: offer.startup_id }
  );

  const { error: statusError } = await supabase
    .from("paper_investment_offers")
    .update({ status: "rejected", updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq("id", offerId);

  if (statusError) return { error: statusError.message };

  return { error: null };
}

/** Startup accepts a pending paper offer (creates paper_investment, updates wallet). */
export async function acceptStartupOffer(offerId: string): Promise<{ error: string | null }> {
  const { data: offer, error: offerError } = await supabase
    .from("paper_investment_offers")
    .select("*")
    .eq("id", offerId)
    .single();

  if (offerError || !offer) return { error: offerError?.message ?? "Offer not found" };
  if (offer.status !== "pending") return { error: "Only pending offers can be accepted" };

  const [walletResult, startupRes] = await Promise.all([
    getOrCreateWallet(offer.investor_id as string),
    supabase.from("startups").select("*").eq("id", offer.startup_id as string).single(),
  ]);

  if (!walletResult.data) return { error: walletResult.error || "Wallet not found" };
  const startup = startupRes.data as Record<string, unknown> | null;
  if (startupRes.error || !startup) {
    return { error: startupRes.error?.message ?? "Startup not found" };
  }

  const wallet = walletResult.data;
  const amt = toNumber(offer.amount);
  const valuationAtInvestment = toNumber(startup.pre_money_valuation);

  if (valuationAtInvestment <= 0) {
    return {
      error: "Startup valuation must be set before accepting an offer. Update it in your profile.",
    };
  }

  const ownershipPct = calculateOwnershipPercentage(amt, valuationAtInvestment);

  const { error: investmentError } = await supabase.from("paper_investments").insert({
    investor_id: offer.investor_id,
    startup_id: offer.startup_id,
    offer_id: offer.id,
    matchmaking_id: offer.matchmaking_id,
    amount: amt,
    valuation_at_investment: valuationAtInvestment,
    ownership_pct: ownershipPct,
    instrument: (startup.investment_instrument as string) || "Equity",
    notes: offer.note ?? null,
    status: "active",
  } as Record<string, unknown>);

  if (investmentError) return { error: investmentError.message };

  const { error: walletError } = await supabase
    .from("paper_wallets")
    .update({
      reserved_balance: roundCurrency(Math.max(wallet.reserved_balance - amt, 0)),
      invested_balance: roundCurrency(wallet.invested_balance + amt),
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("investor_id", offer.investor_id as string);

  if (walletError) return { error: walletError.message };

  await insertWalletTransaction(
    offer.investor_id as string,
    "investment_finalized",
    amt,
    `Finalized simulated investment in ${String(startup.startup_name || startup.name || "startup")}`,
    { offer_id: offer.id, startup_id: offer.startup_id }
  );

  const { error: offerUpdateError } = await supabase
    .from("paper_investment_offers")
    .update({ status: "accepted", updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq("id", offer.id);

  if (offerUpdateError) return { error: offerUpdateError.message };

  return { error: null };
}
