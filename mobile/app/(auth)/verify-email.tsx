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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const { verifyOTP, resendOTP } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const email = params.email || "";

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      setError(t("common.required"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyOTP(email, otp);
      router.replace("/");
    } catch {
      setError(t("auth.otpFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOTP(email);
      Alert.alert(t("common.success"), `${t("auth.otpSent")} ${email}`);
    } catch {
      Alert.alert(t("common.error"), t("common.error"));
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-5 pb-10">
          <TouchableOpacity className="mb-10" onPress={() => router.back()}>
            <Text className="text-slate-500 text-sm">← {t("common.back")}</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View className="w-16 h-16 rounded-2xl bg-slate-100 items-center justify-center mb-6">
            <Text className="text-3xl">✉️</Text>
          </View>

          <Text
            className={`text-2xl font-black text-black mb-2 ${isRTL ? "text-right" : "text-left"}`}
          >
            {t("auth.verifyEmail")}
          </Text>
          <Text className={`text-slate-500 mb-1 ${isRTL ? "text-right" : "text-left"}`}>
            {t("auth.otpSent")}
          </Text>
          <Text
            className={`text-black font-semibold mb-10 ${isRTL ? "text-right" : "text-left"}`}
          >
            {email}
          </Text>

          <Input
            label={t("auth.enterOtp")}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            error={error}
            isRTL={isRTL}
          />

          <Button
            title={t("common.confirm")}
            onPress={handleVerify}
            loading={loading}
            className="mb-4"
          />

          <TouchableOpacity
            className="items-center py-3"
            onPress={handleResend}
            disabled={resending}
          >
            <Text className="text-slate-500 text-sm">
              {resending ? t("common.loading") : t("auth.resendCode")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
