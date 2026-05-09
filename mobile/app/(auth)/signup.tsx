import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useContext } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AccountType } from "@/types/database";

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role: AccountType }>();
  const { signUp } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const role = (params.role as AccountType) || "startup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t("common.required");
    if (!email) newErrors.email = t("common.required");
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = t("auth.invalidEmail");
    if (!password) newErrors.password = t("common.required");
    else if (password.length < 8) newErrors.password = t("auth.passwordTooShort");
    if (password !== confirmPassword) newErrors.confirmPassword = t("auth.passwordMismatch");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp({ email: email.trim(), password, name: name.trim(), accountType: role });
      router.push({ pathname: "/(auth)/verify-email", params: { email: email.trim() } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("auth.signupFailed");
      Alert.alert(t("common.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = role === "startup" ? t("auth.startup") : t("auth.investor");

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-5 pb-10">
            <TouchableOpacity className="mb-8" onPress={() => router.back()}>
              <Text className="text-slate-500 text-sm">← {t("common.back")}</Text>
            </TouchableOpacity>

            <View className={`mb-2 ${isRTL ? "items-end" : "items-start"}`}>
              <View className="bg-slate-100 px-3 py-1 rounded-full mb-4">
                <Text className="text-slate-600 text-xs font-medium">{roleLabel}</Text>
              </View>
            </View>

            <Text
              className={`text-xl font-black text-black mb-1 ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("auth.createAccount")}
            </Text>
            <Text className={`text-slate-500 mb-8 ${isRTL ? "text-right" : "text-left"}`}>
              {t("auth.signUp")}
            </Text>

            <Input
              label={t("auth.name")}
              placeholder={isRTL ? "الاسم الكامل" : "John Smith"}
              autoComplete="name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              isRTL={isRTL}
            />

            <Input
              label={t("auth.email")}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              isRTL={isRTL}
            />

            <Input
              label={t("auth.password")}
              placeholder="••••••••"
              secureToggle
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              isRTL={isRTL}
            />

            <Input
              label={t("auth.confirmPassword")}
              placeholder="••••••••"
              secureToggle
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              isRTL={isRTL}
            />

            <Button
              title={t("auth.createAccount")}
              onPress={handleSignup}
              loading={loading}
              className="mt-2 mb-6"
            />

            <View className="flex-row justify-center items-center">
              <Text className="text-slate-500">{t("auth.haveAccount")} </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text className="text-black font-semibold">{t("auth.signIn")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
