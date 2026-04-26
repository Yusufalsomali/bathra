import { createClient } from "@supabase/supabase-js";

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const investorEmail =
  process.env.DEMO_INVESTOR_EMAIL ||
  process.env.VITE_DEMO_INVESTOR_EMAIL ||
  "demo-investor@bathra.demo";
const startupEmail =
  process.env.DEMO_STARTUP_EMAIL ||
  process.env.VITE_DEMO_STARTUP_EMAIL ||
  "demo-startup@bathra.demo";
const adminEmail = process.env.DEMO_ADMIN_EMAIL || "demo-admin@bathra.demo";
const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "BathraAdmin123!";

const startupValuation = Number(process.env.DEMO_STARTUP_VALUATION || 2000000);
const startupFundingGoal = Number(process.env.DEMO_STARTUP_FUNDING_GOAL || 500000);
const pendingOfferAmount = Number(process.env.DEMO_PENDING_OFFER_AMOUNT || 50000);
const seedPendingOffer =
  (process.env.SEED_PENDING_PAPER_OFFER || "true").toLowerCase() !== "false";

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const users = data?.users || [];
    const matchedUser = users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );

    if (matchedUser) {
      return matchedUser;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function createOrUpdateAuthUser({ email, password, userMetadata }) {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          ...existingUser.user_metadata,
          ...userMetadata,
        },
      }
    );

    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (error) throw error;
  if (!data.user) throw new Error(`Supabase did not return a user for ${email}`);
  return data.user;
}

async function getSingleRow(table, column, value) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq(column, value)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function ensureAdminUser() {
  const adminUser = await createOrUpdateAuthUser({
    email: adminEmail,
    password: adminPassword,
    userMetadata: {
      name: "Demo Admin",
      account_type: "admin",
    },
  });

  const { error } = await supabase.from("admins").upsert(
    {
      id: adminUser.id,
      email: adminEmail,
      name: "Demo Admin",
      admin_level: "super",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) throw error;
  return adminUser;
}

async function ensureStartupFundingContext(startupId) {
  const startup = await getSingleRow("startups", "id", startupId);

  if (!startup) {
    throw new Error(
      "Demo startup profile row was not found. Run npm run seed:demo-users first."
    );
  }

  const updates = {};

  if (!startup.pre_money_valuation || Number(startup.pre_money_valuation) <= 0) {
    updates.pre_money_valuation = startupValuation;
  }

  if (!startup.capital_seeking || Number(startup.capital_seeking) <= 0) {
    updates.capital_seeking = startupFundingGoal;
  }

  if (
    startup.funding_already_raised === null ||
    startup.funding_already_raised === undefined
  ) {
    updates.funding_already_raised = 0;
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("startups")
      .update(updates)
      .eq("id", startupId);

    if (error) throw error;
  }

  return {
    ...startup,
    ...updates,
  };
}

async function ensureMatchmaking({ investor, startup, admin }) {
  const { data: existing, error: existingError } = await supabase
    .from("matchmakings")
    .select("*")
    .eq("investor_id", investor.id)
    .eq("startup_id", startup.id)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw existingError;
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 90);

  if (existing) {
    const { data, error } = await supabase
      .from("matchmakings")
      .update({
        investor_name: investor.name,
        investor_email: investor.email,
        startup_name: startup.startup_name,
        startup_email: startup.email,
        expiry_date: expiryDate.toISOString(),
        is_archived: false,
        matched_by: admin.id,
        comment: "Seeded demo matchmaking record",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("matchmakings")
    .insert({
      investor_id: investor.id,
      investor_name: investor.name,
      investor_email: investor.email,
      startup_id: startup.id,
      startup_name: startup.startup_name,
      startup_email: startup.email,
      expiry_date: expiryDate.toISOString(),
      is_interested: false,
      is_archived: false,
      matched_by: admin.id,
      comment: "Seeded demo matchmaking record",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function ensureWallet(investorId) {
  const existingWallet = await getSingleRow("paper_wallets", "investor_id", investorId);

  const walletRow = {
    investor_id: investorId,
    currency_code: "SAR",
    starting_balance: 100000,
    total_added: 0,
    available_balance: 100000,
    reserved_balance: 0,
    invested_balance: 0,
    realized_pnl: 0,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("paper_wallets")
    .upsert(walletRow, { onConflict: "investor_id" });

  if (error) throw error;

  if (!existingWallet) {
    const { error: transactionError } = await supabase
      .from("paper_wallet_transactions")
      .insert({
        investor_id: investorId,
        type: "initial_funding",
        amount: 100000,
        description: "Initial simulated venture wallet funding",
        metadata: { seeded_by: "scripts/seed-demo-paper-data.mjs" },
      });

    if (transactionError) throw transactionError;
  }
}

async function ensurePendingOffer({ investor, startup, matchmaking }) {
  if (!seedPendingOffer) {
    return null;
  }

  const valuationAtOffer =
    Number(startup.pre_money_valuation) > 0
      ? Number(startup.pre_money_valuation)
      : startupValuation;
  const impliedEquityPercentage =
    Math.round(((pendingOfferAmount / valuationAtOffer) * 100) * 10000) / 10000;

  const { data: existingOffer, error: existingOfferError } = await supabase
    .from("paper_investment_offers")
    .select("*")
    .eq("investor_id", investor.id)
    .eq("startup_id", startup.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existingOfferError && existingOfferError.code !== "PGRST116") {
    throw existingOfferError;
  }

  if (existingOffer) {
    const { data, error } = await supabase
      .from("paper_investment_offers")
      .update({
        matchmaking_id: matchmaking.id,
        amount: pendingOfferAmount,
        valuation_at_offer: valuationAtOffer,
        implied_equity_percentage: impliedEquityPercentage,
        note: "Seeded demo pending paper investment offer",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingOffer.id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  const wallet = await getSingleRow("paper_wallets", "investor_id", investor.id);

  if (!wallet) {
    throw new Error("Demo investor wallet was not found.");
  }

  const availableBalance = Number(wallet.available_balance || 0);
  const reservedBalance = Number(wallet.reserved_balance || 0);

  if (availableBalance < pendingOfferAmount) {
    throw new Error(
      `Demo investor wallet has insufficient available balance for the seeded pending offer.`
    );
  }

  const { data, error } = await supabase
    .from("paper_investment_offers")
    .insert({
      investor_id: investor.id,
      startup_id: startup.id,
      matchmaking_id: matchmaking.id,
      amount: pendingOfferAmount,
      valuation_at_offer: valuationAtOffer,
      implied_equity_percentage: impliedEquityPercentage,
      status: "pending",
      note: "Seeded demo pending paper investment offer",
    })
    .select("*")
    .single();

  if (error) throw error;

  const { error: walletError } = await supabase
    .from("paper_wallets")
    .update({
      available_balance: availableBalance - pendingOfferAmount,
      reserved_balance: reservedBalance + pendingOfferAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("investor_id", investor.id);

  if (walletError) throw walletError;

  const { error: transactionError } = await supabase
    .from("paper_wallet_transactions")
    .insert({
      investor_id: investor.id,
      type: "investment_reserved",
      amount: pendingOfferAmount,
      description: "Reserved simulated funds for seeded demo paper offer",
      metadata: {
        seeded_by: "scripts/seed-demo-paper-data.mjs",
        startup_id: startup.id,
      },
    });

  if (transactionError) throw transactionError;

  return data;
}

async function main() {
  console.log("Seeding Bathra demo paper data...");

  const investor = await getSingleRow("investors", "email", investorEmail);
  const startup = await getSingleRow("startups", "email", startupEmail);

  if (!investor) {
    throw new Error(
      "Demo investor profile row was not found. Run npm run seed:demo-users first."
    );
  }

  if (!startup) {
    throw new Error(
      "Demo startup profile row was not found. Run npm run seed:demo-users first."
    );
  }

  const adminUser = await ensureAdminUser();
  const admin = await getSingleRow("admins", "id", adminUser.id);

  if (!admin) {
    throw new Error("Demo admin public row could not be created.");
  }

  await ensureWallet(investor.id);
  const fundedStartup = await ensureStartupFundingContext(startup.id);
  const matchmaking = await ensureMatchmaking({
    investor,
    startup: fundedStartup,
    admin,
  });
  const pendingOffer = await ensurePendingOffer({
    investor,
    startup: fundedStartup,
    matchmaking,
  });

  console.log("");
  console.log(
    JSON.stringify(
      {
        admin: {
          id: admin.id,
          email: admin.email,
          password: adminPassword,
        },
        matchmaking: {
          id: matchmaking.id,
          investor_id: investor.id,
          startup_id: startup.id,
        },
        startupFundingContext: {
          startup_id: fundedStartup.id,
          pre_money_valuation: fundedStartup.pre_money_valuation,
          capital_seeking: fundedStartup.capital_seeking,
        },
        pendingOffer: pendingOffer
          ? {
              id: pendingOffer.id,
              amount: pendingOffer.amount,
              status: pendingOffer.status,
            }
          : null,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Failed to seed demo paper data.");
  console.error(error);
  process.exit(1);
});
