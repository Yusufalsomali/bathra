import { AccountType } from "./account-types";

export interface DemoAccountConfig {
  accountType: Exclude<AccountType, "admin">;
  email: string;
  password: string;
}

const buildDemoAccount = (
  accountType: Exclude<AccountType, "admin">,
  email: string | undefined,
  password: string | undefined
): DemoAccountConfig | null => {
  if (!email || !password) {
    return null;
  }

  return {
    accountType,
    email,
    password,
  };
};

export const demoAccounts = [
  buildDemoAccount(
    "investor",
    import.meta.env.VITE_DEMO_INVESTOR_EMAIL,
    import.meta.env.VITE_DEMO_INVESTOR_PASSWORD
  ),
  buildDemoAccount(
    "startup",
    import.meta.env.VITE_DEMO_STARTUP_EMAIL,
    import.meta.env.VITE_DEMO_STARTUP_PASSWORD
  ),
].filter((account): account is DemoAccountConfig => Boolean(account));

export const hasConfiguredDemoAccounts = demoAccounts.length > 0;

export const getDemoAccountTypeByEmail = (
  email: string | undefined
): DemoAccountConfig["accountType"] | null => {
  if (!email) {
    return null;
  }

  const matchedAccount = demoAccounts.find(
    (account) => account.email.toLowerCase() === email.toLowerCase()
  );

  return matchedAccount?.accountType ?? null;
};
