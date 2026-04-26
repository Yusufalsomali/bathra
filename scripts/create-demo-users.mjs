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
const investorPassword =
  process.env.DEMO_INVESTOR_PASSWORD ||
  process.env.VITE_DEMO_INVESTOR_PASSWORD ||
  "BathraDemo123!";

const startupEmail =
  process.env.DEMO_STARTUP_EMAIL ||
  process.env.VITE_DEMO_STARTUP_EMAIL ||
  "demo-startup@bathra.demo";
const startupPassword =
  process.env.DEMO_STARTUP_PASSWORD ||
  process.env.VITE_DEMO_STARTUP_PASSWORD ||
  "BathraDemo123!";

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

async function createOrUpdateAuthUser({
  email,
  password,
  userMetadata,
}) {
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

    if (error) {
      throw error;
    }

    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error(`Supabase did not return a user for ${email}`);
  }

  return data.user;
}

async function upsertInvestorProfile(user) {
  const investorRow = {
    id: user.id,
    name: "Demo Investor",
    email: investorEmail,
    phone: "",
    company: "Bathra Demo Capital",
    role: "Angel Investor",
    country: "Saudi Arabia",
    city: "Riyadh",
    preferred_industries: "SaaS,AI,Fintech",
    preferred_company_stage: "MVP",
    linkedin_profile: "",
    other_social_media_profile: "[]",
    heard_about_us: "Bathra demo seed script",
    number_of_investments: 3,
    average_ticket_size: "25,000-50,000 SAR",
    secured_lead_investor: false,
    participated_as_advisor: true,
    strong_candidate_reason:
      "Seeded demo investor account for simulated venture investing flows.",
    newsletter_subscribed: false,
    verified: true,
    status: "approved",
    visibility_status: "normal",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("investors")
    .upsert(investorRow, { onConflict: "id" });

  if (error) {
    throw error;
  }
}

async function upsertStartupProfile(user) {
  const startupRow = {
    id: user.id,
    logo: "",
    name: "Demo Startup Founder",
    founder_info: "Demo Startup Founder",
    email: startupEmail,
    phone: "",
    startup_name: "Demo Startup",
    website: "https://example.com",
    industry: "SaaS",
    stage: "MVP",
    social_media_accounts: "[]",
    problem_solving:
      "Founders need a clean demo environment to simulate investor-startup venture flows.",
    solution:
      "Bathra provides paper venture offers, portfolio tracking, and startup offer review using simulated money only.",
    uniqueness:
      "This seeded startup is configured specifically for Bathra's university demo environment.",
    previous_financial_year_revenue: 0,
    current_financial_year_revenue: 25000,
    has_received_funding: false,
    monthly_burn_rate: 8000,
    investment_instrument: "SAFE",
    capital_seeking: 500000,
    pre_money_valuation: 2000000,
    funding_already_raised: 0,
    team_size: 3,
    co_founders: "[]",
    calendly_link: "",
    video_link: "",
    pitch_deck: "",
    additional_files: "[]",
    additional_video_url: "",
    achievements: "Pilot customers acquired and MVP launched.",
    risks: "Early-stage execution risk.",
    risk_mitigation: "Tight customer feedback loop and monthly milestone reviews.",
    exit_strategy: "Company buyout",
    participated_in_accelerator: false,
    newsletter_subscribed: false,
    verified: true,
    status: "approved",
    visibility_status: "normal",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("startups")
    .upsert(startupRow, { onConflict: "id" });

  if (error) {
    throw error;
  }
}

async function upsertInvestorWallet(investorId) {
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

  if (error) {
    throw error;
  }

  const { data: existingInitialFunding, error: transactionLookupError } =
    await supabase
      .from("paper_wallet_transactions")
      .select("id")
      .eq("investor_id", investorId)
      .eq("type", "initial_funding")
      .limit(1);

  if (transactionLookupError) {
    throw transactionLookupError;
  }

  if (!existingInitialFunding || existingInitialFunding.length === 0) {
    const { error: transactionInsertError } = await supabase
      .from("paper_wallet_transactions")
      .insert({
        investor_id: investorId,
        type: "initial_funding",
        amount: 100000,
        description: "Initial simulated venture wallet funding",
        metadata: {
          seeded_by: "scripts/create-demo-users.mjs",
        },
      });

    if (transactionInsertError) {
      throw transactionInsertError;
    }
  }
}

async function main() {
  console.log("Creating/updating Bathra demo auth users...");

  const investorUser = await createOrUpdateAuthUser({
    email: investorEmail,
    password: investorPassword,
    userMetadata: {
      name: "Demo Investor",
      account_type: "investor",
    },
  });

  const startupUser = await createOrUpdateAuthUser({
    email: startupEmail,
    password: startupPassword,
    userMetadata: {
      name: "Demo Startup Founder",
      account_type: "startup",
      startup_name: "Demo Startup",
    },
  });

  console.log("Syncing public profile rows...");
  await upsertInvestorProfile(investorUser);
  await upsertStartupProfile(startupUser);

  console.log("Ensuring investor paper wallet exists...");
  await upsertInvestorWallet(investorUser.id);

  console.log("");
  console.log("Demo users are ready:");
  console.log(
    JSON.stringify(
      {
        investor: {
          id: investorUser.id,
          email: investorEmail,
          password: investorPassword,
        },
        startup: {
          id: startupUser.id,
          email: startupEmail,
          password: startupPassword,
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Failed to create demo users.");
  console.error(error);
  process.exit(1);
});
