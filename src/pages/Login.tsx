import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";
import UserTypeSelectionModal from "@/components/auth/UserTypeSelectionModal";
import { signupTranslations } from "@/utils/language";
import { demoAccounts, hasConfiguredDemoAccounts } from "@/lib/demo-auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Helper function to get translated text
  const t = (key: keyof typeof signupTranslations) => {
    return signupTranslations[key][language];
  };

  const formSchema = z.object({
    email: z.string().email(t("loginInvalidEmailError")),
    password: z.string().min(1, t("passwordRequiredError")),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoggingIn(true);
      setLoginError("");

      const result = await signIn({
        email: values.email,
        password: values.password,
      });

      if (result.success && result.user) {
        // After successful login, redirect based on account type using the returned user data
        const accountType = result.user.accountType;

        if (accountType === "investor") {
          navigate("/investor-dashboard");
        } else if (accountType === "startup") {
          navigate("/startup-dashboard");
        } else if (accountType === "admin") {
          navigate("/admin");
        } else {
          // Default fallback
          navigate("/");
        }
      } else {
        // Error will be handled by signIn function via toast, but we should also set local error
        setLoginError(t("loginFailedError"));
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(
        error instanceof Error ? error.message : t("unexpectedLoginError")
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const useDemoAccount = (email: string, password: string) => {
    form.setValue("email", email, { shouldDirty: true, shouldValidate: true });
    form.setValue("password", password, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setLoginError("");
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      return;
    }

    try {
      setIsSendingReset(true);
      const success = await resetPassword({ email: forgotPasswordEmail });
      if (success) {
        setResetEmailSent(true);
      }
    } catch (error) {
      console.error("Password reset error:", error);
    } finally {
      setIsSendingReset(false);
    }
  };

  const resetForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
    setResetEmailSent(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-40">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="neo-blur">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  {t("signInTitle")}
                </CardTitle>
                <CardDescription>{t("signInDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {hasConfiguredDemoAccounts && (
                  <Alert className="mb-4">
                    <AlertDescription className="space-y-3">
                      <div className="font-medium">
                        Demo accounts are enabled for this environment.
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Use these seeded logins instead of creating new users
                        when Supabase rate limits signup.
                      </div>
                      <div className="space-y-2">
                        {demoAccounts.map((account) => (
                          <div
                            key={account.accountType}
                            className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/60 p-3"
                          >
                            <div className="min-w-0 text-sm">
                              <div className="font-medium capitalize">
                                {account.accountType} demo
                              </div>
                              <div className="truncate text-muted-foreground">
                                {account.email}
                              </div>
                              <div className="text-muted-foreground">
                                {account.password}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                useDemoAccount(account.email, account.password)
                              }
                              disabled={isLoggingIn}
                            >
                              Use
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {loginError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("emailLabel").replace(" *", "")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="your@email.com"
                              {...field}
                              disabled={isLoggingIn}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("passwordLabel").replace(" *", "")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              disabled={isLoggingIn}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:underline bg-transparent border-none cursor-pointer"
                      >
                        {t("forgotPasswordLink")}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          {t("signingIn")}
                        </>
                      ) : (
                        t("signInButton")
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex-col">
                <div className="mt-4 text-center text-sm">
                  {t("noAccountText")}{" "}
                  <button
                    onClick={() => navigate("/signup")}
                    className="text-primary hover:underline bg-transparent border-none cursor-pointer"
                  >
                    {t("registerHereLink")}
                  </button>
                </div>
                {hasConfiguredDemoAccounts && (
                  <div className="mt-3 text-center text-xs text-muted-foreground">
                    Demo login is the recommended path for local QA and sales
                    demos.
                  </div>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>

      <UserTypeSelectionModal
        open={showUserTypeModal}
        onOpenChange={setShowUserTypeModal}
      />

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg shadow-lg w-full max-w-md p-6"
          >
            {!resetEmailSent ? (
              <>
                <h2 className="text-xl font-semibold mb-2">
                  {t("forgotPasswordTitle")}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("forgotPasswordDescription")}
                </p>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-sm font-medium mb-1"
                    >
                      {t("emailLabel").replace(" *", "")}
                    </label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your@email.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      disabled={isSendingReset}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={resetForgotPasswordModal}
                      disabled={isSendingReset}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleForgotPassword}
                      disabled={isSendingReset || !forgotPasswordEmail}
                      className="flex-1"
                    >
                      {isSendingReset ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          {t("sendingResetLink")}
                        </>
                      ) : (
                        t("sendResetLinkButton")
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-2">
                  {t("resetLinkSentTitle")}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("resetLinkSentDescription")}
                </p>
                <Button onClick={resetForgotPasswordModal} className="w-full">
                  {t("backToLogin")}
                </Button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Login;
