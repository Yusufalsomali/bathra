import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useState, useEffect, useContext } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Investor } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Ionicons } from "@expo/vector-icons";

function InfoRow({ label, value, isRTL }: { label: string; value: string | number | boolean | undefined; isRTL: boolean }) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return (
    <View className={`mb-3 ${isRTL ? "items-end" : "items-start"}`}>
      <Text className="text-xs font-medium text-slate-400 mb-0.5">{label}</Text>
      <Text className="text-sm text-slate-800">{display}</Text>
    </View>
  );
}

export default function InvestorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("investors")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        const investor = data as unknown as Investor;
        setInvestor(investor);
        if (investor) navigation.setOptions({ title: investor.name });
        setLoading(false);
      });
  }, [id, navigation]);

  if (loading || !investor) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View className="bg-white px-6 pt-8 pb-6 border-b border-slate-100">
          <View className={`flex-row items-center mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Avatar name={investor.name} size={64} />
            <View className={`flex-1 ${isRTL ? "mr-4" : "ml-4"}`}>
              <Text className={`text-xl font-black text-slate-900 ${isRTL ? "text-right" : "text-left"}`}>
                {investor.name}
              </Text>
              <Text className={`text-slate-500 text-sm ${isRTL ? "text-right" : "text-left"}`}>
                {investor.role}{investor.company ? ` · ${investor.company}` : ""}
              </Text>
              <Text className={`text-slate-400 text-xs mt-0.5 ${isRTL ? "text-right" : "text-left"}`}>
                {investor.city}, {investor.country}
              </Text>
            </View>
          </View>
          <View className={`flex-row flex-wrap gap-2 ${isRTL ? "justify-end" : "justify-start"}`}>
            {investor.secured_lead_investor && <Badge label="Lead Investor" variant="success" />}
            {investor.participated_as_advisor && <Badge label="Advisor" variant="info" />}
          </View>
        </View>

        <View className="px-4 pt-4">
          {/* Investment preferences */}
          <Card className="mb-3">
            <Text className={`font-bold text-slate-900 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              {t("profile.investmentPrefs")}
            </Text>
            <InfoRow label={t("profile.preferredIndustries")} value={investor.preferred_industries} isRTL={isRTL} />
            <InfoRow label={t("profile.preferredStage")} value={investor.preferred_company_stage} isRTL={isRTL} />
            <InfoRow label={t("profile.numberOfInvestments")} value={investor.number_of_investments} isRTL={isRTL} />
            <InfoRow label={t("profile.averageTicket")} value={investor.average_ticket_size} isRTL={isRTL} />
          </Card>

          {/* Background */}
          {investor.strong_candidate_reason && (
            <Card className="mb-3">
              <Text className={`font-bold text-slate-900 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                Background
              </Text>
              <InfoRow label={t("profile.whyStrongCandidate")} value={investor.strong_candidate_reason} isRTL={isRTL} />
              <InfoRow label={t("profile.hasLedInvestment")} value={investor.secured_lead_investor} isRTL={isRTL} />
              <InfoRow label={t("profile.hasBeenAdvisor")} value={investor.participated_as_advisor} isRTL={isRTL} />
            </Card>
          )}

          {/* Links */}
          {(investor.linkedin_profile || investor.calendly_link) && (
            <Card className="mb-3">
              <Text className={`font-bold text-slate-900 mb-3 ${isRTL ? "text-right" : "text-left"}`}>Links</Text>
              {investor.linkedin_profile && (
                <TouchableOpacity
                  className={`flex-row items-center py-2 ${isRTL ? "flex-row-reverse" : ""}`}
                  onPress={() => Linking.openURL(investor.linkedin_profile!)}
                >
                  <Ionicons name="logo-linkedin" size={16} color="#0f172a" />
                  <Text className="text-slate-700 ml-2 text-sm">LinkedIn Profile</Text>
                </TouchableOpacity>
              )}
              {investor.calendly_link && (
                <TouchableOpacity
                  className={`flex-row items-center py-2 ${isRTL ? "flex-row-reverse" : ""}`}
                  onPress={() => Linking.openURL(investor.calendly_link!)}
                >
                  <Ionicons name="calendar-outline" size={16} color="#0f172a" />
                  <Text className="text-slate-700 ml-2 text-sm">Book a meeting</Text>
                </TouchableOpacity>
              )}
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
