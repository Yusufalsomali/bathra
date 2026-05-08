import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { ChevronRight, ChevronLeft, PlusCircle, Briefcase as BriefcaseIcon } from "lucide-react-native";

interface Wallet {
  available_balance: number;
  reserved_balance: number;
  invested_balance: number;
  currency_code: string;
}

interface Offer {
  id: string;
  startup_id: string;
  startup_name?: string;
  startup_industry?: string;
  offered_amount: number;
  status: string;
  implied_equity_percentage?: number;
  valuation_at_offer?: number;
  created_at: string;
  note?: string;
}

function WalletCard({
  wallet,
  onAddFunds,
  t,
  isRTL,
}: {
  wallet: Wallet | null;
  onAddFunds: () => void;
  t: (k: string) => string;
  isRTL: boolean;
}) {
  const currency = wallet?.currency_code || "SAR";
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;

  return (
    <Card className="mb-4">
      <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ${isRTL ? "text-right" : "text-left"}`}>
        {t("portfolio.title")}
      </Text>
      <View className="flex-row mb-4">
        <View className="flex-1 items-center">
          <Text className="text-xl font-black text-black">
            {wallet ? fmt(wallet.available_balance) : "—"}
          </Text>
          <Text className="text-xs text-slate-500 mt-0.5">{t("portfolio.availableBalance")}</Text>
        </View>
        <View className="flex-1 items-center border-x border-slate-100">
          <Text className="text-xl font-black text-black">
            {wallet ? fmt(wallet.reserved_balance) : "—"}
          </Text>
          <Text className="text-xs text-slate-500 mt-0.5">{t("portfolio.reservedBalance")}</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-xl font-black text-black">
            {wallet ? fmt(wallet.invested_balance) : "—"}
          </Text>
          <Text className="text-xs text-slate-500 mt-0.5">{t("portfolio.investedBalance")}</Text>
        </View>
      </View>
      <TouchableOpacity
        className="border border-slate-200 rounded-xl py-3 items-center flex-row justify-center"
        onPress={onAddFunds}
        activeOpacity={0.8}
      >
        <PlusCircle size={18} stroke="#000000" strokeWidth={1.5} />
        <Text className="text-black font-semibold text-sm ml-2">{t("portfolio.addFunds")}</Text>
      </TouchableOpacity>
    </Card>
  );
}

function OfferCard({
  offer,
  onCancel,
  t,
  isRTL,
}: {
  offer: Offer;
  onCancel: (id: string) => void;
  t: (k: string) => string;
  isRTL: boolean;
}) {
  const isPending = offer.status === "pending";
  const isAccepted = offer.status === "accepted";

  return (
    <Card className="mb-3">
      <View className={`flex-row items-center mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
        <Avatar name={offer.startup_name || "S"} size={40} />
        <View className={`flex-1 ${isRTL ? "mr-3 items-end" : "ml-3"}`}>
          <Text className="font-bold text-black">{offer.startup_name || offer.startup_id}</Text>
          {offer.startup_industry && (
            <Text className="text-xs text-slate-500">{offer.startup_industry}</Text>
          )}
        </View>
        <Badge
          label={offer.status}
          variant={isAccepted ? "success" : isPending ? "warning" : "default"}
        />
      </View>

      <View className="flex-row mb-2">
        <View className="flex-1">
          <Text className="text-xs text-slate-400">Amount</Text>
          <Text className="font-bold text-black text-sm">
            SAR {offer.offered_amount.toLocaleString()}
          </Text>
        </View>
        {offer.implied_equity_percentage !== undefined && (
          <View className="flex-1">
            <Text className="text-xs text-slate-400">{t("portfolio.equity")}</Text>
            <Text className="font-bold text-black text-sm">
              {offer.implied_equity_percentage.toFixed(2)}%
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-xs text-slate-400">Date</Text>
          <Text className="text-xs text-slate-600 mt-0.5">
            {new Date(offer.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {offer.note && (
        <Text className={`text-xs text-slate-500 italic mb-2 ${isRTL ? "text-right" : "text-left"}`}>
          {offer.note}
        </Text>
      )}

      {isPending && (
        <TouchableOpacity
          className="border border-red-200 rounded-xl py-2 items-center mt-1"
          onPress={() => onCancel(offer.id)}
          activeOpacity={0.8}
        >
          <Text className="text-red-500 text-xs font-semibold">{t("portfolio.cancelOffer")}</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

function AddFundsModal({
  visible,
  onClose,
  onSubmit,
  t,
  isRTL,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  t: (k: string) => string;
  isRTL: boolean;
}) {
  const [amount, setAmount] = useState("");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full">
          <Text className={`font-black text-black text-lg mb-4 ${isRTL ? "text-right" : "text-left"}`}>
            {t("portfolio.addFundsTitle")}
          </Text>
          <TextInput
            className="border border-slate-200 rounded-xl px-3 py-3 text-black mb-4"
            placeholder={t("portfolio.enterAmount")}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            textAlign={isRTL ? "right" : "left"}
            autoFocus
          />
          <View className="flex-row gap-3">
            <Button title={t("common.cancel")} variant="outline" onPress={onClose} className="flex-1" />
            <Button
              title={t("portfolio.addFunds")}
              onPress={() => {
                const n = parseFloat(amount);
                if (!n || n <= 0) return;
                onSubmit(n);
                setAmount("");
              }}
              className="flex-1"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function PortfolioScreen() {
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();
  const router = useRouter();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [pendingOffers, setPendingOffers] = useState<Offer[]>([]);
  const [acceptedOffers, setAcceptedOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addFundsVisible, setAddFundsVisible] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [walletRes, offersRes] = await Promise.all([
        supabase
          .from("paper_wallets")
          .select("available_balance,reserved_balance,invested_balance,currency_code")
          .eq("investor_id", user.id)
          .maybeSingle(),
        supabase
          .from("paper_investment_offers")
          .select("id,startup_id,offered_amount,status,implied_equity_percentage,valuation_at_offer,created_at,note,startups(startup_name,industry)")
          .eq("investor_id", user.id)
          .in("status", ["pending", "accepted"])
          .order("created_at", { ascending: false }),
      ]);

      setWallet(walletRes.data as Wallet | null);

      const rawOffers = (offersRes.data || []) as Array<
        Record<string, unknown> & { startups?: { startup_name?: string; industry?: string } | null }
      >;
      const mapped: Offer[] = rawOffers.map((o) => ({
        id: o.id as string,
        startup_id: o.startup_id as string,
        startup_name: o.startups?.startup_name,
        startup_industry: o.startups?.industry,
        offered_amount: o.offered_amount as number,
        status: o.status as string,
        implied_equity_percentage: o.implied_equity_percentage as number | undefined,
        valuation_at_offer: o.valuation_at_offer as number | undefined,
        created_at: o.created_at as string,
        note: o.note as string | undefined,
      }));

      setPendingOffers(mapped.filter((o) => o.status === "pending"));
      setAcceptedOffers(mapped.filter((o) => o.status === "accepted"));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelOffer = (offerId: string) => {
    Alert.alert("Cancel Offer", "Are you sure you want to cancel this investment offer?", [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: "Cancel Offer",
        style: "destructive",
        onPress: async () => {
          try {
            await supabase
              .from("paper_investment_offers")
              .update({ status: "cancelled" } as Record<string, unknown>)
              .eq("id", offerId);
            setPendingOffers((prev) => prev.filter((o) => o.id !== offerId));
            fetchData();
          } catch {
            Alert.alert(t("common.error"), t("common.error"));
          }
        },
      },
    ]);
  };

  const handleAddFunds = async (amount: number) => {
    if (!user) return;
    setAddFundsVisible(false);
    try {
      await supabase.from("paper_wallet_transactions").insert([{
        investor_id: user.id,
        amount,
        type: "add_funds",
        currency_code: wallet?.currency_code || "SAR",
      }] as unknown[]);
      Alert.alert(t("common.success"), `SAR ${amount.toLocaleString()} added to your portfolio.`);
      fetchData();
    } catch {
      Alert.alert(t("common.error"), "Could not add funds. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-4 pt-2 pb-2 border-b border-slate-100">
        <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
          <TouchableOpacity onPress={() => router.back()} className="mr-3" activeOpacity={0.7}>
            {isRTL ? <ChevronRight size={24} stroke="#000000" strokeWidth={1.5} /> : <ChevronLeft size={24} stroke="#000000" strokeWidth={1.5} />}
          </TouchableOpacity>
          <Text className={`text-lg font-black text-black flex-1 ${isRTL ? "text-right" : "text-left"}`}>
            {t("portfolio.title")}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet */}
        <WalletCard
          wallet={wallet}
          onAddFunds={() => setAddFundsVisible(true)}
          t={t}
          isRTL={isRTL}
        />

        {/* Pending offers */}
        {pendingOffers.length > 0 && (
          <>
            <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              {t("portfolio.pendingOffers")} ({pendingOffers.length})
            </Text>
            {pendingOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onCancel={handleCancelOffer}
                t={t}
                isRTL={isRTL}
              />
            ))}
          </>
        )}

        {/* Accepted positions */}
        {acceptedOffers.length > 0 && (
          <>
            <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 mt-2 ${isRTL ? "text-right" : "text-left"}`}>
              {t("portfolio.positions")} ({acceptedOffers.length})
            </Text>
            {acceptedOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onCancel={handleCancelOffer}
                t={t}
                isRTL={isRTL}
              />
            ))}
          </>
        )}

        {/* Empty state */}
        {!loading && pendingOffers.length === 0 && acceptedOffers.length === 0 && (
          <EmptyState
            icon={BriefcaseIcon}
            title={t("portfolio.noPositions")}
            description={t("portfolio.noPositionsDesc")}
          />
        )}

        {/* Browse startups CTA */}
        {!loading && (
          <TouchableOpacity
            className="mt-4 border border-slate-200 rounded-2xl py-4 items-center"
            onPress={() => router.push("/(tabs)/explore")}
            activeOpacity={0.8}
          >
            <Text className="text-slate-700 font-semibold text-sm">{t("dashboard.browseStartups")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <AddFundsModal
        visible={addFundsVisible}
        onClose={() => setAddFundsVisible(false)}
        onSubmit={handleAddFunds}
        t={t}
        isRTL={isRTL}
      />
    </SafeAreaView>
  );
}
