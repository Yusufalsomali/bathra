import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  X, Mail, Phone, Calendar, Link2, MapPin,
  Layers, Banknote, ChevronRight, ChevronLeft, Heart,
} from "lucide-react-native";

interface InterestedInvestor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  city?: string;
  country?: string;
  preferred_industries?: string;
  preferred_company_stage?: string;
  average_ticket_size?: string;
  number_of_investments?: number;
  linkedin_profile?: string;
  calendly_link?: string;
  connection_date: string;
}

function InvestorDetailModal({
  investor,
  visible,
  onClose,
  t,
  isRTL,
}: {
  investor: InterestedInvestor | null;
  visible: boolean;
  onClose: () => void;
  t: (k: string) => string;
  isRTL: boolean;
}) {
  if (!investor) return null;

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert(t("common.error"), "Could not open link")
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <View className={`flex-row items-center justify-between px-4 py-4 border-b border-slate-100 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Text className="font-black text-slate-900 text-lg">{investor.name}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <X size={24} stroke="#64748b" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Investor header */}
          <View className={`flex-row items-center mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Avatar name={investor.name} size={56} />
            <View className={`flex-1 ${isRTL ? "mr-4 items-end" : "ml-4"}`}>
              <Text className="font-bold text-slate-900 text-base">{investor.name}</Text>
              {investor.role && (
                <Text className="text-slate-500 text-sm">
                  {investor.role}{investor.company ? ` · ${investor.company}` : ""}
                </Text>
              )}
              <Text className="text-xs text-slate-400 mt-1">
                {t("interestedInvestors.interestedOn")} {new Date(investor.connection_date).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Contact info */}
          <View className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
            <Text className={`font-bold text-slate-900 text-sm mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              {t("interestedInvestors.contactInfo")}
            </Text>
            <View className="space-y-3">
              <TouchableOpacity
                className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}
                onPress={() => openLink(`mailto:${investor.email}`)}
                activeOpacity={0.7}
              >
                <View className="w-8 h-8 bg-white rounded-lg items-center justify-center mr-3">
                  <Mail size={16} stroke="#0f172a" strokeWidth={1.5} />
                </View>
                <Text className="text-blue-600 text-sm font-medium flex-1" numberOfLines={1}>
                  {investor.email}
                </Text>
              </TouchableOpacity>

              {investor.phone && (
                <TouchableOpacity
                  className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}
                  onPress={() => openLink(`tel:${investor.phone}`)}
                  activeOpacity={0.7}
                >
                  <View className="w-8 h-8 bg-white rounded-lg items-center justify-center mr-3">
                    <Phone size={16} stroke="#0f172a" strokeWidth={1.5} />
                  </View>
                  <Text className="text-blue-600 text-sm font-medium">{investor.phone}</Text>
                </TouchableOpacity>
              )}

              {investor.calendly_link && (
                <TouchableOpacity
                  className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}
                  onPress={() => openLink(investor.calendly_link!)}
                  activeOpacity={0.7}
                >
                  <View className="w-8 h-8 bg-white rounded-lg items-center justify-center mr-3">
                    <Calendar size={16} stroke="#0f172a" strokeWidth={1.5} />
                  </View>
                  <Text className="text-blue-600 text-sm font-medium">Book a time slot</Text>
                </TouchableOpacity>
              )}

              {investor.linkedin_profile && (
                <TouchableOpacity
                  className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}
                  onPress={() => openLink(investor.linkedin_profile!)}
                  activeOpacity={0.7}
                >
                  <View className="w-8 h-8 bg-white rounded-lg items-center justify-center mr-3">
                    <Link2 size={16} stroke="#0f172a" strokeWidth={1.5} />
                  </View>
                  <Text className="text-blue-600 text-sm font-medium">LinkedIn Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Investment preferences */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100">
            <Text className={`font-bold text-slate-900 text-sm mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              {t("interestedInvestors.investmentPrefs")}
            </Text>
            <View className="space-y-2">
              {investor.preferred_industries && (
                <View>
                  <Text className="text-xs text-slate-500">Industries</Text>
                  <Text className="text-sm text-slate-800 mt-0.5">{investor.preferred_industries}</Text>
                </View>
              )}
              {investor.preferred_company_stage && (
                <View>
                  <Text className="text-xs text-slate-500">Preferred Stage</Text>
                  <Text className="text-sm text-slate-800 mt-0.5">{investor.preferred_company_stage}</Text>
                </View>
              )}
              {investor.average_ticket_size && (
                <View>
                  <Text className="text-xs text-slate-500">Ticket Size</Text>
                  <Text className="text-sm text-slate-800 mt-0.5">{investor.average_ticket_size}</Text>
                </View>
              )}
              {investor.number_of_investments !== undefined && (
                <View>
                  <Text className="text-xs text-slate-500">Previous Investments</Text>
                  <Text className="text-sm text-slate-800 mt-0.5">{investor.number_of_investments}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Location */}
          {(investor.city || investor.country) && (
            <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100">
              <Text className={`font-bold text-slate-900 text-sm mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                {t("interestedInvestors.location")}
              </Text>
              <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                <MapPin size={16} stroke="#64748b" strokeWidth={1.5} />
                <Text className="text-slate-600 text-sm ml-2">
                  {[investor.city, investor.country].filter(Boolean).join(", ")}
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View className="gap-3">
            <Button
              title={t("interestedInvestors.sendEmail")}
              onPress={() => openLink(`mailto:${investor.email}`)}
              icon={<Mail size={16} stroke="white" strokeWidth={1.5} />}
            />
            {investor.calendly_link && (
              <Button
                title={t("interestedInvestors.scheduleCall")}
                variant="outline"
                onPress={() => openLink(investor.calendly_link!)}
                icon={<Calendar size={16} stroke="#0f172a" strokeWidth={1.5} />}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function InvestorCard({
  item,
  onPress,
  isRTL,
  t,
}: {
  item: InterestedInvestor;
  onPress: () => void;
  isRTL: boolean;
  t: (k: string) => string;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card className="mb-3">
        <View className={`flex-row items-center mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Avatar name={item.name} size={44} />
          <View className={`flex-1 ${isRTL ? "mr-3 items-end" : "ml-3"}`}>
            <Text className="font-bold text-slate-900">{item.name}</Text>
            {item.role && (
              <Text className="text-xs text-slate-500">
                {item.role}{item.company ? ` · ${item.company}` : ""}
              </Text>
            )}
          </View>
          <Badge
            label={new Date(item.connection_date).toLocaleDateString()}
            variant="info"
          />
        </View>

        <View className="space-y-1">
          {item.preferred_industries && (
            <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
              <Layers size={13} stroke="#94a3b8" strokeWidth={1.5} />
              <Text className="text-xs text-slate-500 ml-1 flex-1" numberOfLines={1}>
                {item.preferred_industries}
              </Text>
            </View>
          )}
          {item.average_ticket_size && (
            <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
              <Banknote size={13} stroke="#94a3b8" strokeWidth={1.5} />
              <Text className="text-xs text-slate-500 ml-1">{item.average_ticket_size}</Text>
            </View>
          )}
        </View>

        <View className={`flex-row mt-3 gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <TouchableOpacity
            className="flex-1 bg-slate-900 rounded-xl py-2 items-center"
            onPress={onPress}
            activeOpacity={0.8}
          >
            <Text className="text-white text-xs font-semibold">{t("interestedInvestors.viewDetails")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 border border-slate-200 rounded-xl items-center justify-center"
            onPress={() => Linking.openURL(`mailto:${item.email}`)}
            activeOpacity={0.8}
          >
            <Mail size={16} stroke="#64748b" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function InterestedInvestorsScreen() {
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();
  const router = useRouter();

  const [investors, setInvestors] = useState<InterestedInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<InterestedInvestor | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchInvestors = useCallback(async () => {
    if (!user) return;
    try {
      const { data: connectionsRaw } = await supabase
        .from("investor_startup_connections")
        .select("investor_id,created_at")
        .eq("startup_id", user.id)
        .eq("connection_type", "interested")
        .eq("status", "active");

      const connections = (connectionsRaw || []) as Array<{ investor_id: string; created_at: string }>;

      if (connections.length === 0) {
        setInvestors([]);
        return;
      }

      const ids = connections.map((c: { investor_id: string; created_at: string }) => c.investor_id);
      const { data: investorsData } = await supabase
        .from("investors")
        .select(
          "id,name,email,phone,company,role,city,country,preferred_industries,preferred_company_stage,average_ticket_size,number_of_investments,linkedin_profile,calendly_link"
        )
        .in("id", ids);

      const enriched: InterestedInvestor[] = (investorsData || []).map((inv: Record<string, unknown>) => {
        const conn = connections.find((c: { investor_id: string; created_at: string }) => c.investor_id === (inv.id as string));
        return { ...(inv as unknown as InterestedInvestor), connection_date: conn?.created_at || new Date().toISOString() };
      });

      enriched.sort(
        (a, b) =>
          new Date(b.connection_date).getTime() - new Date(a.connection_date).getTime()
      );
      setInvestors(enriched);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-slate-100">
        <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
          <TouchableOpacity onPress={() => router.back()} className="mr-3" activeOpacity={0.7}>
            {isRTL ? <ChevronRight size={24} stroke="#0f172a" strokeWidth={1.5} /> : <ChevronLeft size={24} stroke="#0f172a" strokeWidth={1.5} />}
          </TouchableOpacity>
          <Text className={`text-xl font-black text-slate-900 flex-1 ${isRTL ? "text-right" : "text-left"}`}>
            {t("interestedInvestors.title")}
          </Text>
          {investors.length > 0 && (
            <Badge label={String(investors.length)} variant="success" />
          )}
        </View>
      </View>

      <FlatList
        data={investors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchInvestors();
            }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon={Heart}
              title={t("interestedInvestors.noInvestors")}
              description={t("interestedInvestors.noInvestorsDesc")}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <InvestorCard
            item={item}
            isRTL={isRTL}
            t={t}
            onPress={() => {
              setSelected(item);
              setModalVisible(true);
            }}
          />
        )}
      />

      <InvestorDetailModal
        investor={selected}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        t={t}
        isRTL={isRTL}
      />
    </SafeAreaView>
  );
}
