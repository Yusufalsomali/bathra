import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useContext } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { Ionicons } from "@expo/vector-icons";

const APP_VERSION = "1.0.0";

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive = false,
  isRTL,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  isRTL: boolean;
}) {
  return (
    <TouchableOpacity
      className={`flex-row items-center px-4 py-4 bg-white border-b border-slate-50 ${isRTL ? "flex-row-reverse" : ""}`}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center ${isRTL ? "ml-3" : "mr-3"} ${destructive ? "bg-red-50" : "bg-slate-100"}`}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? "#ef4444" : "#0f172a"}
        />
      </View>
      <Text
        className={`flex-1 text-sm font-medium ${destructive ? "text-red-500" : "text-slate-800"} ${isRTL ? "text-right" : "text-left"}`}
      >
        {label}
      </Text>
      {value && (
        <Text className="text-sm text-slate-400 mr-1">{value}</Text>
      )}
      {onPress && (
        <Ionicons
          name={isRTL ? "chevron-back" : "chevron-forward"}
          size={16}
          color="#94a3b8"
        />
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title, isRTL }: { title: string; isRTL: boolean }) {
  return (
    <Text
      className={`text-xs font-bold text-slate-400 uppercase tracking-widest px-4 py-3 ${isRTL ? "text-right" : "text-left"}`}
    >
      {title}
    </Text>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { t, locale, changeLocale } = useContext(I18nContext);
  const { isRTL } = useRTL();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert(t("settings.signOut"), "Are you sure you want to sign out?", [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.signOut"),
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)");
        },
      },
    ]);
  };

  const handleLanguageToggle = () => {
    changeLocale(locale === "en" ? "ar" : "en");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Account info */}
        <View className="bg-white px-4 py-5 mb-4 border-b border-slate-100 border-t">
          <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
            <View className="w-14 h-14 rounded-full bg-slate-900 items-center justify-center mr-3">
              <Text className="text-white text-xl font-black">
                {(user?.name || "?")[0].toUpperCase()}
              </Text>
            </View>
            <View className={`flex-1 ${isRTL ? "items-end ml-0 mr-3" : "items-start"}`}>
              <Text className="font-bold text-slate-900 text-base">{user?.name}</Text>
              <Text className="text-slate-500 text-xs mt-0.5">{user?.email}</Text>
              <Text className="text-slate-400 text-xs mt-0.5 capitalize">
                {user?.accountType}
              </Text>
            </View>
          </View>
        </View>

        {/* Language */}
        <SectionHeader title={t("settings.language")} isRTL={isRTL} />
        <View className="mb-4">
          <SettingsRow
            icon="language-outline"
            label={t("settings.language")}
            value={locale === "en" ? t("settings.english") : t("settings.arabic")}
            onPress={handleLanguageToggle}
            isRTL={isRTL}
          />
        </View>

        {/* Account */}
        <SectionHeader title={t("settings.account")} isRTL={isRTL} />
        <View className="mb-4">
          <SettingsRow
            icon="person-outline"
            label={t("profile.editProfile")}
            onPress={() => router.push("/(stack)/profile")}
            isRTL={isRTL}
          />
          {user?.accountType === "startup" && (
            <SettingsRow
              icon="document-text-outline"
              label={t("nav.pitchDeck")}
              onPress={() => router.push("/(stack)/pitchdeck")}
              isRTL={isRTL}
            />
          )}
          <SettingsRow
            icon="people-outline"
            label={t("nav.connections")}
            onPress={() => router.push("/(stack)/connections")}
            isRTL={isRTL}
          />
        </View>

        {/* About */}
        <SectionHeader title="About" isRTL={isRTL} />
        <View className="mb-4">
          <SettingsRow
            icon="information-circle-outline"
            label={t("settings.appVersion")}
            value={APP_VERSION}
            isRTL={isRTL}
          />
          <SettingsRow
            icon="document-text-outline"
            label={t("settings.termsAndConditions")}
            isRTL={isRTL}
          />
          <SettingsRow
            icon="shield-outline"
            label={t("settings.privacyPolicy")}
            isRTL={isRTL}
          />
        </View>

        {/* Sign out */}
        <SectionHeader title="" isRTL={isRTL} />
        <View>
          <SettingsRow
            icon="log-out-outline"
            label={t("settings.signOut")}
            onPress={handleSignOut}
            destructive
            isRTL={isRTL}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
