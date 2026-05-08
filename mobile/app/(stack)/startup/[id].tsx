import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useContext } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Startup } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Globe, Calendar, ChevronLeft, ChevronRight } from "lucide-react-native";

function InfoRow({ label, value, isRTL }: { label: string; value: string | number | undefined; isRTL: boolean }) {
  if (!value) return null;
  return (
    <View className={`mb-3 ${isRTL ? "items-end" : "items-start"}`}>
      <Text className="text-xs font-medium text-slate-400 mb-0.5">{label}</Text>
      <Text className="text-sm text-slate-800">{String(value)}</Text>
    </View>
  );
}

export default function StartupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    supabase
      .from("startups")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }: { data: unknown }) => {
        const startup = data as unknown as Startup;
        setStartup(startup);
        if (startup) navigation.setOptions({ title: startup.startup_name || startup.name });
        setLoading(false);
      });
  }, [id, navigation]);

  const handleConnect = async (type: "interested" | "info_request") => {
    if (!user || !startup) return;
    setConnecting(true);
    try {
      const { error } = await supabase.from("investor_startup_connections").insert([{
        investor_id: user.id,
        startup_id: startup.id,
        connection_type: type,
        investor_name: user.name,
        investor_email: user.email,
        startup_name: startup.startup_name || startup.name,
        startup_email: startup.email,
        status: "active",
      }] as unknown[]);
      if (error) throw error;
      Alert.alert(
        t("common.success"),
        type === "interested" ? t("explore.interestedSent") : t("explore.infoRequestSent")
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      Alert.alert(t("common.error"), msg);
    } finally {
      setConnecting(false);
    }
  };

  if (loading || !startup) return <LoadingScreen />;

  const isInvestor = user?.accountType === "investor";

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View className="bg-white px-6 pt-8 pb-6 border-b border-slate-100">
          <View className={`flex-row items-center mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Avatar name={startup.startup_name || startup.name} uri={startup.logo} size={64} />
            <View className={`flex-1 ${isRTL ? "mr-4" : "ml-4"}`}>
              <Text className={`text-xl font-black text-slate-900 ${isRTL ? "text-right" : "text-left"}`}>
                {startup.startup_name || startup.name}
              </Text>
              <Text className={`text-slate-500 text-sm ${isRTL ? "text-right" : "text-left"}`}>
                {startup.industry}
              </Text>
            </View>
          </View>
          <View className={`flex-row flex-wrap gap-2 ${isRTL ? "justify-end" : "justify-start"}`}>
            {startup.stage && <Badge label={startup.stage} variant="info" />}
            {startup.has_received_funding && <Badge label="Funded" variant="success" />}
          </View>
        </View>

        <View className="px-4 pt-4">
          {/* Problem & Solution */}
          <Card className="mb-3">
            <Text className={`font-bold text-slate-900 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              Problem & Solution
            </Text>
            <InfoRow label={t("profile.problem")} value={startup.problem_solving} isRTL={isRTL} />
            <InfoRow label={t("profile.solution")} value={startup.solution} isRTL={isRTL} />
            <InfoRow label={t("profile.uniqueness")} value={startup.uniqueness} isRTL={isRTL} />
          </Card>

          {/* Financials */}
          <Card className="mb-3">
            <Text className={`font-bold text-slate-900 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              Financials
            </Text>
            <InfoRow label={t("profile.capitalSeeking")} value={startup.capital_seeking ? `${startup.capital_seeking.toLocaleString()} SAR` : undefined} isRTL={isRTL} />
            <InfoRow label={t("profile.fundingRaised")} value={startup.funding_already_raised ? `${startup.funding_already_raised.toLocaleString()} SAR` : undefined} isRTL={isRTL} />
            <InfoRow label={t("profile.preMoneyValuation")} value={startup.pre_money_valuation ? `${startup.pre_money_valuation.toLocaleString()} SAR` : undefined} isRTL={isRTL} />
            <InfoRow label={t("profile.investmentInstrument")} value={startup.investment_instrument} isRTL={isRTL} />
          </Card>

          {/* Team */}
          <Card className="mb-3">
            <Text className={`font-bold text-slate-900 mb-3 ${isRTL ? "text-right" : "text-left"}`}>Team</Text>
            <InfoRow label={t("profile.teamSize")} value={startup.team_size} isRTL={isRTL} />
            <InfoRow label={t("profile.exitStrategy")} value={startup.exit_strategy} isRTL={isRTL} />
          </Card>

          {/* Links */}
          {(startup.website || startup.calendly_link) && (
            <Card className="mb-3">
              <Text className={`font-bold text-slate-900 mb-3 ${isRTL ? "text-right" : "text-left"}`}>Links</Text>
              {startup.website && (
                <TouchableOpacity
                  className={`flex-row items-center py-2 ${isRTL ? "flex-row-reverse" : ""}`}
                  onPress={() => Linking.openURL(startup.website!)}
                >
                  <Globe size={16} stroke="#0f172a" strokeWidth={1.5} />
                  <Text className="text-slate-700 ml-2 text-sm">{startup.website}</Text>
                </TouchableOpacity>
              )}
              {startup.calendly_link && (
                <TouchableOpacity
                  className={`flex-row items-center py-2 ${isRTL ? "flex-row-reverse" : ""}`}
                  onPress={() => Linking.openURL(startup.calendly_link!)}
                >
                  <Calendar size={16} stroke="#0f172a" strokeWidth={1.5} />
                  <Text className="text-slate-700 ml-2 text-sm">Book a meeting</Text>
                </TouchableOpacity>
              )}
            </Card>
          )}
        </View>
      </ScrollView>

      {/* CTA — investors only */}
      {isInvestor && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-4 flex-row gap-3">
          <Button
            title={t("explore.expressInterest")}
            onPress={() => handleConnect("interested")}
            loading={connecting}
            className="flex-1"
          />
          <Button
            title={t("explore.requestInfo")}
            variant="outline"
            onPress={() => handleConnect("info_request")}
            loading={connecting}
            className="flex-1"
          />
        </View>
      )}
    </SafeAreaView>
  );
}
