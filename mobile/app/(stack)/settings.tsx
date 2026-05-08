import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import {
  Globe, User, FileText, Users, Info, Shield, LogOut,
  ChevronRight, ChevronLeft, LucideIcon,
} from "lucide-react-native";

const APP_VERSION = "1.0.0";

function SettingsRow({
  icon: IconComponent,
  label,
  value,
  onPress,
  destructive = false,
  isRTL,
}: {
  icon: LucideIcon;
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
        <IconComponent
          size={18}
          color={destructive ? "#ef4444" : "#000000"}
          strokeWidth={1.5}
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
        isRTL
          ? <ChevronLeft size={16} stroke="#94a3b8" strokeWidth={1.5} />
          : <ChevronRight size={16} stroke="#94a3b8" strokeWidth={1.5} />
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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Account info */}
        <View className="bg-white px-4 py-5 mb-4 border-b border-slate-100 border-t">
          <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
            <View className="w-14 h-14 rounded-full bg-black items-center justify-center mr-3">
              <Text className="text-white text-xl font-black">
                {(user?.name || "?")[0].toUpperCase()}
              </Text>
            </View>
            <View className={`flex-1 ${isRTL ? "items-end ml-0 mr-3" : "items-start"}`}>
              <Text className="font-bold text-black text-base">{user?.name}</Text>
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
            icon={Globe}
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
            icon={User}
            label={t("profile.editProfile")}
            onPress={() => router.push("/(stack)/profile")}
            isRTL={isRTL}
          />
          {user?.accountType === "startup" && (
            <SettingsRow
              icon={FileText}
              label={t("nav.pitchDeck")}
              onPress={() => router.push("/(stack)/pitchdeck")}
              isRTL={isRTL}
            />
          )}
          <SettingsRow
            icon={Users}
            label={t("nav.connections")}
            onPress={() => router.push("/(stack)/connections")}
            isRTL={isRTL}
          />
        </View>

        {/* About */}
        <SectionHeader title="About" isRTL={isRTL} />
        <View className="mb-4">
          <SettingsRow
            icon={Info}
            label={t("settings.appVersion")}
            value={APP_VERSION}
            isRTL={isRTL}
          />
          <SettingsRow
            icon={FileText}
            label={t("settings.termsAndConditions")}
            onPress={() => Linking.openURL("https://bathra-ten.vercel.app/terms-and-conditions")}
            isRTL={isRTL}
          />
          <SettingsRow
            icon={Shield}
            label={t("settings.privacyPolicy")}
            onPress={() => Linking.openURL("https://bathra-ten.vercel.app/terms-and-conditions")}
            isRTL={isRTL}
          />
        </View>

        {/* Sign out */}
        <SectionHeader title="" isRTL={isRTL} />
        <View>
          <SettingsRow
            icon={LogOut}
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
