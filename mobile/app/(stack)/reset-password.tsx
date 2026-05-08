import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useContext } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { setNewPassword } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!password) newErrors.password = t("common.required");
    else if (password.length < 8) newErrors.password = t("auth.passwordTooShort");
    if (password !== confirmPassword) newErrors.confirmPassword = t("auth.passwordMismatch");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await setNewPassword(password);
      Alert.alert(t("common.success"), "Password updated successfully!", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
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
          <Text
            className={`text-3xl font-black text-slate-900 mb-2 ${isRTL ? "text-right" : "text-left"}`}
          >
            {t("auth.newPassword")}
          </Text>
          <Text className={`text-slate-500 mb-10 ${isRTL ? "text-right" : "text-left"}`}>
            Choose a strong password for your account.
          </Text>

          <Input
            label={t("auth.newPassword")}
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
            title={t("auth.sendResetLink")}
            onPress={handleReset}
            loading={loading}
            className="mt-2"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
