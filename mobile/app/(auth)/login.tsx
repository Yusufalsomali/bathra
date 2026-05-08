import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useContext } from "react";
import { useRouter, Href } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const SIGNUP_URL = "https://bathra-ten.vercel.app/signup";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = t("common.required");
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = t("auth.invalidEmail");
    if (!password) newErrors.password = t("common.required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/" as Href);
    } catch {
      Alert.alert(t("common.error"), t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

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
            {/* Header */}
            <TouchableOpacity
              className="mb-8"
              onPress={() => router.back()}
            >
              <Text className="text-slate-500 text-sm">← {t("common.back")}</Text>
            </TouchableOpacity>

            <Text
              className={`text-xl font-black text-black mb-1 ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("auth.welcomeBack")}
            </Text>
            <Text
              className={`text-slate-500 mb-10 ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("auth.signIn")}
            </Text>

            {/* Form */}
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
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              isRTL={isRTL}
            />

            <TouchableOpacity
              className={`mb-8 ${isRTL ? "items-start" : "items-end"}`}
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text className="text-slate-500 text-sm">{t("auth.forgotPassword")}</Text>
            </TouchableOpacity>

            <Button
              title={t("auth.signIn")}
              onPress={handleLogin}
              loading={loading}
              className="mb-6"
            />

            <View className="flex-row justify-center items-center">
              <Text className="text-slate-500">{t("auth.noAccount")} </Text>
              <TouchableOpacity onPress={() => Linking.openURL(SIGNUP_URL)}>
                <Text className="text-black font-semibold">{t("auth.createAccount")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
