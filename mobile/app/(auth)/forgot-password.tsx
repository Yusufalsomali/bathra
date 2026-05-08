import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useContext } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError(t("auth.invalidEmail"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      Alert.alert(t("common.error"), msg);
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
        <View className="flex-1 px-6 pt-14 pb-10">
          <TouchableOpacity className="mb-10" onPress={() => router.back()}>
            <Text className="text-slate-500 text-sm">← {t("common.back")}</Text>
          </TouchableOpacity>

          <View className="w-16 h-16 rounded-2xl bg-slate-100 items-center justify-center mb-6">
            <Text className="text-3xl">🔑</Text>
          </View>

          <Text
            className={`text-3xl font-black text-slate-900 mb-2 ${isRTL ? "text-right" : "text-left"}`}
          >
            {t("auth.resetPassword")}
          </Text>
          <Text className={`text-slate-500 mb-10 ${isRTL ? "text-right" : "text-left"}`}>
            {t("auth.resetPasswordDesc")}
          </Text>

          {sent ? (
            <View className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <Text className="text-green-700 font-semibold text-center">
                ✓ Reset link sent to {email}
              </Text>
              <Text className="text-green-600 text-sm text-center mt-1">
                Check your inbox and follow the link.
              </Text>
            </View>
          ) : (
            <>
              <Input
                label={t("auth.email")}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                error={error}
                isRTL={isRTL}
              />
              <Button
                title={t("auth.sendResetLink")}
                onPress={handleReset}
                loading={loading}
                className="mt-2"
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
