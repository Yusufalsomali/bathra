import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useContext, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Startup, Investor } from "@/types/database";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Pencil } from "lucide-react-native";

function SectionTitle({ title, isRTL }: { title: string; isRTL: boolean }) {
  return (
    <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 mt-5 ${isRTL ? "text-right" : "text-left"}`}>
      {title}
    </Text>
  );
}

function BoolField({
  label,
  value,
  onChange,
  isRTL,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isRTL: boolean;
}) {
  return (
    <View className={`flex-row items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
      <Text className="text-sm text-slate-700 flex-1">{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: "#000000" }} />
    </View>
  );
}

export default function ProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const [profile, setProfile] = useState<Partial<Startup & Investor>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Valuation update state (startup only)
  const [valuationInput, setValuationInput] = useState("");
  const [valuationReason, setValuationReason] = useState("");
  const [updatingValuation, setUpdatingValuation] = useState(false);

  const isStartup = user?.accountType === "startup";

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const table = isStartup ? "startups" : "investors";
    const { data } = await supabase.from(table).select("*").eq("id", user.id).single();
    if (data) setProfile(data as Partial<Startup & Investor>);
    setLoading(false);
  }, [user, isStartup]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const table = isStartup ? "startups" : "investors";
      const { error } = await supabase
        .from(table)
        .update(profile as Record<string, unknown>)
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      setEditing(false);
      Alert.alert(t("common.success"), t("profile.profileSaved"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      Alert.alert(t("common.error"), msg);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: unknown) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  const handleValuationUpdate = async () => {
    const amount = parseFloat(valuationInput.replace(/,/g, ""));
    if (!amount || amount <= 0 || !user?.id) {
      Alert.alert(t("common.error"), "Please enter a valid positive amount.");
      return;
    }
    setUpdatingValuation(true);
    try {
      const { error } = await supabase
        .from("startups")
        .update({ pre_money_valuation: amount } as Record<string, unknown>)
        .eq("id", user.id);
      if (error) throw error;
      // Log valuation history if the table exists
      await supabase.from("startup_valuations").insert([{
        startup_id: user.id,
        valuation: amount,
        reason: valuationReason || "Self-reported valuation update",
      }] as unknown[]).throwOnError().catch(() => {/* table may not exist, ignore */});
      Alert.alert(t("common.success"), t("profile.valuationUpdated"));
      setValuationInput("");
      setValuationReason("");
      fetchProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      Alert.alert(t("common.error"), msg);
    } finally {
      setUpdatingValuation(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="bg-white px-6 pt-8 pb-6 border-b border-slate-100">
            <View className="items-center">
              <Avatar name={user?.name || "?"} size={72} className="mb-3" />
              <Text className="text-xl font-black text-black">{user?.name}</Text>
              <Text className="text-slate-500 text-sm">{user?.email}</Text>
              <View className="flex-row gap-2 mt-2">
                <Badge
                  label={isStartup ? t("auth.startup") : t("auth.investor")}
                  variant="info"
                />
                <Badge
                  label={user?.status || "pending"}
                  variant={user?.status === "approved" ? "success" : "warning"}
                />
              </View>
            </View>
          </View>

          <View className="px-4">
            {isStartup ? (
              <>
                <SectionTitle title={t("profile.personalInfo")} isRTL={isRTL} />
                <Input label={t("profile.phone")} value={profile.phone || ""} onChangeText={(v) => update("phone", v)} isRTL={isRTL} editable={editing} />
                <Input label={t("profile.country")} value={profile.country || ""} onChangeText={(v) => update("country", v)} isRTL={isRTL} editable={editing} />
                <Input label={t("profile.city")} value={(profile as Investor).city || ""} onChangeText={(v) => update("city", v)} isRTL={isRTL} editable={editing} />

                <SectionTitle title={t("profile.companyInfo")} isRTL={isRTL} />
                <Input label="Startup Name" value={(profile as Startup).startup_name || ""} onChangeText={(v) => update("startup_name", v)} isRTL={isRTL} editable={editing} />
                <Input label={t("profile.industry")} value={(profile as Startup).industry || ""} onChangeText={(v) => update("industry", v)} isRTL={isRTL} editable={editing} />
                <Input label={t("profile.website")} value={(profile as Startup).website || ""} onChangeText={(v) => update("website", v)} isRTL={isRTL} editable={editing} keyboardType="url" autoCapitalize="none" />
                <Input label={t("profile.teamSize")} value={String((profile as Startup).team_size || "")} onChangeText={(v) => update("team_size", parseInt(v) || undefined)} isRTL={isRTL} editable={editing} keyboardType="number-pad" />

                <SectionTitle title="Problem & Solution" isRTL={isRTL} />
                <Input label={t("profile.problem")} value={(profile as Startup).problem_solving || ""} onChangeText={(v) => update("problem_solving", v)} isRTL={isRTL} editable={editing} multiline numberOfLines={3} />
                <Input label={t("profile.solution")} value={(profile as Startup).solution || ""} onChangeText={(v) => update("solution", v)} isRTL={isRTL} editable={editing} multiline numberOfLines={3} />
                <Input label={t("profile.uniqueness")} value={(profile as Startup).uniqueness || ""} onChangeText={(v) => update("uniqueness", v)} isRTL={isRTL} editable={editing} multiline numberOfLines={3} />

                <SectionTitle title="Financials" isRTL={isRTL} />
                <Input label={t("profile.capitalSeeking")} value={String((profile as Startup).capital_seeking || "")} onChangeText={(v) => update("capital_seeking", parseInt(v) || undefined)} isRTL={isRTL} editable={editing} keyboardType="number-pad" />
                <Input label={t("profile.fundingRaised")} value={String((profile as Startup).funding_already_raised || "")} onChangeText={(v) => update("funding_already_raised", parseInt(v) || undefined)} isRTL={isRTL} editable={editing} keyboardType="number-pad" />
                <Input label={t("profile.preMoneyValuation")} value={String((profile as Startup).pre_money_valuation || "")} onChangeText={(v) => update("pre_money_valuation", parseFloat(v) || undefined)} isRTL={isRTL} editable={editing} keyboardType="decimal-pad" />
                <Input label={t("profile.burnRate")} value={String((profile as Startup).monthly_burn_rate || "")} onChangeText={(v) => update("monthly_burn_rate", parseInt(v) || undefined)} isRTL={isRTL} editable={editing} keyboardType="number-pad" />
                <Input label={t("profile.investmentInstrument")} value={(profile as Startup).investment_instrument || ""} onChangeText={(v) => update("investment_instrument", v)} isRTL={isRTL} editable={editing} />
                <Input label="Previous Year Revenue (SAR)" value={String((profile as Startup).previous_financial_year_revenue || "")} onChangeText={(v) => update("previous_financial_year_revenue", parseInt(v) || undefined)} isRTL={isRTL} editable={editing} keyboardType="number-pad" />
                <Input label="Current Year Revenue (SAR)" value={String((profile as Startup).current_financial_year_revenue || "")} onChangeText={(v) => update("current_financial_year_revenue", parseInt(v) || undefined)} isRTL={isRTL} editable={editing} keyboardType="number-pad" />
                {editing && (
                  <BoolField
                    label={t("profile.hasReceivedFunding")}
                    value={(profile as Startup).has_received_funding || false}
                    onChange={(v) => update("has_received_funding", v)}
                    isRTL={isRTL}
                  />
                )}

                <SectionTitle title="Traction & Growth" isRTL={isRTL} />
                <Input label={t("profile.achievements")} value={(profile as Startup).achievements || ""} onChangeText={(v) => update("achievements", v)} isRTL={isRTL} editable={editing} multiline numberOfLines={3} />
                <Input label={t("profile.risks")} value={(profile as Startup).risks || ""} onChangeText={(v) => update("risks", v)} isRTL={isRTL} editable={editing} multiline numberOfLines={3} />
                <Input label={t("profile.riskMitigation")} value={(profile as Startup).risk_mitigation || ""} onChangeText={(v) => update("risk_mitigation", v)} isRTL={isRTL} editable={editing} multiline numberOfLines={3} />
                <Input label={t("profile.exitStrategy")} value={(profile as Startup).exit_strategy || ""} onChangeText={(v) => update("exit_strategy", v)} isRTL={isRTL} editable={editing} multiline numberOfLines={3} />
                {editing && (
                  <BoolField
                    label={t("profile.participatedAccelerator")}
                    value={(profile as Startup).participated_in_accelerator || false}
                    onChange={(v) => update("participated_in_accelerator", v)}
                    isRTL={isRTL}
                  />
                )}

                <SectionTitle title={t("profile.contactInfo")} isRTL={isRTL} />
                <Input label={t("profile.calendly")} value={(profile as Startup).calendly_link || ""} onChangeText={(v) => update("calendly_link", v)} isRTL={isRTL} editable={editing} autoCapitalize="none" keyboardType="url" />
                <Input label="Video Link" value={(profile as Startup).video_link || ""} onChangeText={(v) => update("video_link", v)} isRTL={isRTL} editable={editing} autoCapitalize="none" keyboardType="url" />
              </>
            ) : (
              <>
                <SectionTitle title={t("profile.personalInfo")} isRTL={isRTL} />
                <Input label={t("profile.phone")} value={(profile as Investor).phone || ""} onChangeText={(v) => update("phone", v)} isRTL={isRTL} editable={editing} />
                <Input label={t("profile.birthday")} value={(profile as Investor).birthday || ""} onChangeText={(v) => update("birthday", v)} isRTL={isRTL} editable={editing} placeholder="YYYY-MM-DD" />
                <Input label={t("profile.country")} value={(profile as Investor).country || ""} onChangeText={(v) => update("country", v)} isRTL={isRTL} editable={editing} />
                <Input label={t("profile.city")} value={(profile as Investor).city || ""} onChangeText={(v) => update("city", v)} isRTL={isRTL} editable={editing} />

                <SectionTitle title={t("profile.companyInfo")} isRTL={isRTL} />
                <Input label={t("profile.company")} value={(profile as Investor).company || ""} onChangeText={(v) => update("company", v)} isRTL={isRTL} editable={editing} />
                <Input label={t("profile.role")} value={(profile as Investor).role || ""} onChangeText={(v) => update("role", v)} isRTL={isRTL} editable={editing} />

                <SectionTitle title={t("profile.investmentPrefs")} isRTL={isRTL} />
                <Input label={t("profile.preferredIndustries")} value={(profile as Investor).preferred_industries || ""} onChangeText={(v) => update("preferred_industries", v)} isRTL={isRTL} editable={editing} />
                <Input label={t("profile.preferredStage")} value={(profile as Investor).preferred_company_stage || ""} onChangeText={(v) => update("preferred_company_stage", v)} isRTL={isRTL} editable={editing} />
                <Input label={t("profile.averageTicket")} value={(profile as Investor).average_ticket_size || ""} onChangeText={(v) => update("average_ticket_size", v)} isRTL={isRTL} editable={editing} />
                <Input label={t("profile.numberOfInvestments") || "# Investments"} value={String((profile as Investor).number_of_investments || "")} onChangeText={(v) => update("number_of_investments", parseInt(v) || undefined)} isRTL={isRTL} editable={editing} keyboardType="number-pad" />
                {editing && (
                  <>
                    <BoolField label={t("profile.hasLedInvestment")} value={(profile as Investor).secured_lead_investor || false} onChange={(v) => update("secured_lead_investor", v)} isRTL={isRTL} />
                    <BoolField label={t("profile.hasBeenAdvisor")} value={(profile as Investor).participated_as_advisor || false} onChange={(v) => update("participated_as_advisor", v)} isRTL={isRTL} />
                  </>
                )}
                <Input label={t("profile.whyStrongCandidate")} value={(profile as Investor).strong_candidate_reason || ""} onChangeText={(v) => update("strong_candidate_reason", v)} isRTL={isRTL} editable={editing} multiline numberOfLines={3} />

                <SectionTitle title={t("profile.contactInfo")} isRTL={isRTL} />
                <Input label={t("profile.linkedin")} value={(profile as Investor).linkedin_profile || ""} onChangeText={(v) => update("linkedin_profile", v)} isRTL={isRTL} editable={editing} autoCapitalize="none" keyboardType="url" />
                <Input label={t("profile.calendly")} value={(profile as Investor).calendly_link || ""} onChangeText={(v) => update("calendly_link", v)} isRTL={isRTL} editable={editing} autoCapitalize="none" keyboardType="url" />
              </>
            )}
          </View>
        </ScrollView>

        {/* Valuation update card — startup only, always visible */}
        {isStartup && (
          <View className="mx-4 mb-4 bg-white rounded-2xl p-4 border border-slate-100">
            <View className={`flex-row items-center mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <TrendingUp size={18} stroke="#000000" strokeWidth={1.5} />
              <Text className={`font-bold text-black text-sm ${isRTL ? "mr-2 text-right" : "ml-2"}`}>
                {t("profile.updateValuation")}
              </Text>
            </View>
            {(profile as Startup).pre_money_valuation ? (
              <Text className={`text-xs text-slate-500 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                {t("profile.currentValuation")}: SAR {Number((profile as Startup).pre_money_valuation).toLocaleString()}
              </Text>
            ) : null}
            <TextInput
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-black text-sm mb-2"
              placeholder={t("profile.newValuationPlaceholder")}
              keyboardType="numeric"
              value={valuationInput}
              onChangeText={setValuationInput}
              textAlign={isRTL ? "right" : "left"}
            />
            <TextInput
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-black text-sm mb-3"
              placeholder={t("profile.valuationReason")}
              value={valuationReason}
              onChangeText={setValuationReason}
              multiline
              numberOfLines={2}
              textAlign={isRTL ? "right" : "left"}
            />
            <TouchableOpacity
              className={`rounded-xl py-3 items-center ${!valuationInput || updatingValuation ? "bg-slate-200" : "bg-black"}`}
              onPress={handleValuationUpdate}
              disabled={!valuationInput || updatingValuation}
              activeOpacity={0.8}
            >
              <Text className={`font-semibold text-sm ${!valuationInput || updatingValuation ? "text-slate-400" : "text-white"}`}>
                {updatingValuation ? t("profile.updatingValuation") : t("profile.updateValuationBtn")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom action bar */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-4">
          {editing ? (
            <View className="flex-row gap-3">
              <Button
                title={t("common.cancel")}
                variant="outline"
                onPress={() => { setEditing(false); fetchProfile(); }}
                className="flex-1"
              />
              <Button
                title={t("common.save")}
                onPress={handleSave}
                loading={saving}
                className="flex-1"
              />
            </View>
          ) : (
            <Button
              title={t("profile.editProfile")}
              onPress={() => setEditing(true)}
              icon={<Pencil size={16} stroke="white" strokeWidth={1.5} />}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
