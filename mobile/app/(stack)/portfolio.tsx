import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "expo-router";
import Svg, { Polyline, Line } from "react-native-svg";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import {
  addVirtualFunds,
  cancelInvestorOffer,
  getInvestorPortfolioSummary,
  getPortfolioValueTimeline,
  type InvestorPortfolioSummary,
  type PaperInvestmentOfferView,
  type PaperPortfolioActivityItem,
  type PaperPortfolioPosition,
  type PaperSectorBreakdown,
} from "@/lib/paper-venture";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  Briefcase as BriefcaseIcon,
  PieChart,
  Activity,
} from "lucide-react-native";

const SECTOR_COLORS = ["#0f766e", "#0891b2", "#2563eb", "#9333ea", "#ea580c", "#ca8a04"];

function formatSAR(n: number, currency = "SAR") {
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function PortfolioTrendChart({
  timeline,
  width,
  height,
}: {
  timeline: { date: string; value: number }[];
  width: number;
  height: number;
}) {
  if (timeline.length < 2) return null;
  const values = timeline.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 12;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const pts = timeline
    .map((p, i) => {
      const x = pad + (i / (timeline.length - 1)) * innerW;
      const denom = max - min || 1;
      const y = pad + innerH - ((p.value - min) / denom) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e2e8f0" strokeWidth={1} />
      <Polyline points={pts} fill="none" stroke="#000000" strokeWidth={2} />
    </Svg>
  );
}

function StatMini({
  label,
  value,
  caption,
  isRTL,
}: {
  label: string;
  value: string;
  caption?: string;
  isRTL: boolean;
}) {
  return (
    <View className="flex-1 min-w-[46%] bg-slate-50 rounded-xl p-3 border border-slate-100">
      <Text className={`text-[10px] font-semibold text-slate-400 uppercase ${isRTL ? "text-right" : "text-left"}`}>
        {label}
      </Text>
      <Text className={`text-lg font-black text-black mt-1 ${isRTL ? "text-right" : "text-left"}`}>{value}</Text>
      {caption ? (
        <Text className={`text-[10px] text-slate-500 mt-0.5 ${isRTL ? "text-right" : "text-left"}`}>{caption}</Text>
      ) : null}
    </View>
  );
}

function SectorRow({
  row,
  maxAmount,
  color,
  isRTL,
  t,
}: {
  row: PaperSectorBreakdown;
  maxAmount: number;
  color: string;
  isRTL: boolean;
  t: (k: string) => string;
}) {
  const pct = maxAmount > 0 ? Math.min(100, Math.round((row.amount / maxAmount) * 100)) : 0;
  return (
    <View className="mb-3">
      <View className={`flex-row justify-between mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
        <Text className={`text-xs font-semibold text-black flex-1 ${isRTL ? "text-right" : "text-left"}`}>
          {row.sector}
        </Text>
        <Text className="text-xs text-slate-600">{formatSAR(row.amount)}</Text>
      </View>
      <View className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <View style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded-full" />
      </View>
      <Text className={`text-[10px] text-slate-400 mt-0.5 ${isRTL ? "text-right" : "text-left"}`}>
        {row.pendingAmount > 0 && row.acceptedAmount > 0
          ? t("portfolio.sectorExposureDesc")
          : row.pendingAmount > 0
            ? t("portfolio.reservedCaption")
            : t("portfolio.deployedCaption")}
      </Text>
    </View>
  );
}

function PendingOfferCard({
  offer,
  onCancel,
  t,
  isRTL,
}: {
  offer: PaperInvestmentOfferView;
  onCancel: (id: string) => void;
  t: (k: string) => string;
  isRTL: boolean;
}) {
  const pending = offer.status === "pending";
  return (
    <Card className="mb-3">
      <View className={`flex-row items-center mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
        <Avatar name={offer.startup_name} size={40} />
        <View className={`flex-1 ${isRTL ? "mr-3 items-end" : "ml-3"}`}>
          <Text className="font-bold text-black">{offer.startup_name}</Text>
          <Text className="text-xs text-slate-500">{offer.startup_sector}</Text>
        </View>
        <Badge label={offer.status} variant={pending ? "warning" : "default"} />
      </View>
      <View className={`flex-row mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
        <View className="flex-1 pr-1">
          <Text className="text-xs text-slate-400">{t("portfolio.entryAmount")}</Text>
          <Text className="font-semibold text-black text-sm">{formatSAR(offer.offered_amount)}</Text>
        </View>
        <View className="flex-1 pl-1">
          <Text className="text-xs text-slate-400">{t("portfolio.impliedAtOffer")}</Text>
          <Text className="font-semibold text-black text-sm">{offer.implied_equity_percentage.toFixed(2)}%</Text>
        </View>
      </View>
      {pending && (
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

function PositionCard({
  position,
  t,
  isRTL,
}: {
  position: PaperPortfolioPosition;
  t: (k: string) => string;
  isRTL: boolean;
}) {
  return (
    <Card className="mb-3">
      <View className={`flex-row items-center mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
        <Avatar name={position.startup_name} size={40} />
        <View className={`flex-1 ${isRTL ? "mr-3 items-end" : "ml-3"}`}>
          <Text className="font-bold text-black">{position.startup_name}</Text>
          <Text className="text-xs text-slate-500">{position.sector}</Text>
        </View>
      </View>
      <View className={`flex-row flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
        <View className="w-[32%] pr-1 mb-2">
          <Text className="text-[10px] text-slate-400">{t("portfolio.entryAmount")}</Text>
          <Text className="text-sm font-semibold">{formatSAR(position.amount_invested)}</Text>
        </View>
        <View className="w-[32%] px-1 mb-2">
          <Text className="text-[10px] text-slate-400">{t("portfolio.currentValue")}</Text>
          <Text className="text-sm font-semibold">{formatSAR(position.current_paper_value)}</Text>
        </View>
        <View className="w-[32%] pl-1 mb-2">
          <Text className="text-[10px] text-slate-400">{t("portfolio.returnPct")}</Text>
          <Text
            className={`text-sm font-semibold ${position.return_percentage >= 0 ? "text-emerald-700" : "text-red-600"}`}
          >
            {position.return_percentage.toFixed(1)}%
          </Text>
        </View>
        <View className="w-[48%] pr-1">
          <Text className="text-[10px] text-slate-400">{t("portfolio.equity")}</Text>
          <Text className="text-sm">{position.equity_percentage.toFixed(2)}%</Text>
        </View>
        <View className="w-[48%] pl-1">
          <Text className="text-[10px] text-slate-400">{t("portfolio.gain")}</Text>
          <Text className={`text-sm font-semibold ${position.gain_loss >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {formatSAR(position.gain_loss)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function ActivityRow({
  item,
  isRTL,
}: {
  item: PaperPortfolioActivityItem;
  isRTL: boolean;
}) {
  return (
    <View className={`flex-row gap-2 py-2 border-b border-slate-100 ${isRTL ? "flex-row-reverse" : ""}`}>
      <Activity size={14} stroke="#64748b" strokeWidth={1.5} />
      <View className="flex-1">
        <Text className={`text-sm font-medium text-black ${isRTL ? "text-right" : "text-left"}`}>{item.title}</Text>
        <Text className={`text-xs text-slate-500 ${isRTL ? "text-right" : "text-left"}`}>{item.description}</Text>
      </View>
    </View>
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
          <Text className={`font-black text-black text-xl mb-4 ${isRTL ? "text-right" : "text-left"}`}>
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
  const chartWidth = Dimensions.get("window").width - 32;

  const [summary, setSummary] = useState<InvestorPortfolioSummary | null>(null);
  const [timeline, setTimeline] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addFundsVisible, setAddFundsVisible] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user?.id) return;
    const [sumRes, tl] = await Promise.all([
      getInvestorPortfolioSummary(user.id),
      getPortfolioValueTimeline(user.id),
    ]);
    if (sumRes.data) setSummary(sumRes.data);
    setTimeline(tl);
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCancelOffer = (offerId: string) => {
    Alert.alert(t("portfolio.cancelOffer"), t("portfolio.cancelOfferConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.confirm"),
        style: "destructive",
        onPress: async () => {
          const result = await cancelInvestorOffer(offerId);
          if (!result.success) {
            Alert.alert(t("common.error"), result.error || t("common.error"));
            return;
          }
          loadAll();
        },
      },
    ]);
  };

  const handleAddFunds = async (amount: number) => {
    if (!user) return;
    setAddFundsVisible(false);
    const result = await addVirtualFunds(user.id, amount);
    if (!result.success) {
      Alert.alert(t("common.error"), result.error || t("common.error"));
      return;
    }
    Alert.alert(t("common.success"), formatSAR(amount));
    loadAll();
  };

  const wallet = summary?.wallet;
  const pendingList = summary?.pendingOffers.filter((o) => o.status === "pending") ?? [];
  const maxSector = Math.max(0, ...(summary?.sectorBreakdown.map((s) => s.amount) ?? []));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-white px-4 pt-2 pb-2 border-b border-slate-100">
        <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
          <TouchableOpacity onPress={() => router.back()} className="mr-3" activeOpacity={0.7}>
            {isRTL ? (
              <ChevronRight size={24} stroke="#000000" strokeWidth={1.5} />
            ) : (
              <ChevronLeft size={24} stroke="#000000" strokeWidth={1.5} />
            )}
          </TouchableOpacity>
          <Text className={`text-xl font-black text-black flex-1 ${isRTL ? "text-right" : "text-left"}`}>
            {t("portfolio.title")}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-500">{t("common.loading")}</Text>
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAll();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet + add funds */}
        <Card className="mb-4">
          <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ${isRTL ? "text-right" : "text-left"}`}>
            {t("portfolio.title")}
          </Text>
          <View className="flex-row mb-4">
            <View className="flex-1 items-center">
              <Text className="text-xl font-black text-black">
                {wallet ? formatSAR(wallet.available_balance) : "—"}
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">{t("portfolio.availableBalance")}</Text>
            </View>
            <View className="flex-1 items-center border-x border-slate-100">
              <Text className="text-xl font-black text-black">
                {wallet ? formatSAR(wallet.total_pending_offers) : "—"}
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">{t("portfolio.reservedBalance")}</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xl font-black text-black">
                {wallet ? formatSAR(wallet.total_accepted_investments) : "—"}
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">{t("portfolio.investedBalance")}</Text>
            </View>
          </View>
          <TouchableOpacity
            className="border border-slate-200 rounded-xl py-3 items-center flex-row justify-center"
            onPress={() => setAddFundsVisible(true)}
            activeOpacity={0.8}
          >
            <PlusCircle size={18} stroke="#000000" strokeWidth={1.5} />
            <Text className="text-black font-semibold text-sm ml-2">{t("portfolio.addFunds")}</Text>
          </TouchableOpacity>
        </Card>

        {/* Summary stats */}
        {wallet && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            <StatMini
              label={t("portfolio.portfolioValue")}
              value={formatSAR(wallet.total_portfolio_value)}
              caption={t("portfolio.paperPnL") + `: ${formatSAR(wallet.current_gain_loss)}`}
              isRTL={isRTL}
            />
            <StatMini
              label={t("portfolio.activeDeals")}
              value={String(wallet.active_deals_count)}
              isRTL={isRTL}
            />
          </View>
        )}

        {/* Trend */}
        {timeline.length >= 2 && (
          <Card className="mb-4">
            <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              {t("portfolio.portfolioTrend")}
            </Text>
            <PortfolioTrendChart timeline={timeline} width={chartWidth - 32} height={140} />
          </Card>
        )}

        {/* Sectors */}
        <Card className="mb-4">
          <View className={`flex-row items-center gap-2 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <PieChart size={16} stroke="#000000" strokeWidth={1.5} />
            <Text className={`font-bold text-black flex-1 ${isRTL ? "text-right" : "text-left"}`}>
              {t("portfolio.sectorExposure")}
            </Text>
          </View>
          {summary?.sectorBreakdown && summary.sectorBreakdown.length > 0 ? (
            summary.sectorBreakdown.map((row, i) => (
              <SectorRow
                key={row.sector + i}
                row={row}
                maxAmount={maxSector}
                color={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                isRTL={isRTL}
                t={t}
              />
            ))
          ) : (
            <Text className={`text-sm text-slate-500 ${isRTL ? "text-right" : "text-left"}`}>{t("portfolio.noSectorData")}</Text>
          )}
        </Card>

        {/* Pending */}
        {pendingList.length > 0 && (
          <>
            <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              {t("portfolio.pendingOffers")} ({pendingList.length})
            </Text>
            {pendingList.map((offer) => (
              <PendingOfferCard key={offer.id} offer={offer} onCancel={handleCancelOffer} t={t} isRTL={isRTL} />
            ))}
          </>
        )}

        {/* Positions */}
        {summary && summary.positions.length > 0 && (
          <>
            <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 mt-2 ${isRTL ? "text-right" : "text-left"}`}>
              {t("portfolio.positions")} ({summary.positions.length})
            </Text>
            {summary.positions.map((p) => (
              <PositionCard key={p.investment_id} position={p} t={t} isRTL={isRTL} />
            ))}
          </>
        )}

        {/* Activity */}
        {summary && summary.recentActivity.length > 0 && (
          <Card className="mb-4">
            <Text className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ${isRTL ? "text-right" : "text-left"}`}>
              {t("portfolio.recentActivity")}
            </Text>
            {summary.recentActivity.map((item) => (
              <ActivityRow key={item.id} item={item} isRTL={isRTL} />
            ))}
          </Card>
        )}

        {!loading &&
          (!summary ||
            (pendingList.length === 0 && summary.positions.length === 0 && summary.sectorBreakdown.length === 0)) && (
            <EmptyState
              icon={BriefcaseIcon}
              title={t("portfolio.noPositions")}
              description={t("portfolio.noPositionsDesc")}
            />
          )}

        <TouchableOpacity
          className="mt-4 border border-slate-200 rounded-2xl py-4 items-center"
          onPress={() => router.push("/(tabs)/explore")}
          activeOpacity={0.8}
        >
          <Text className="text-slate-700 font-semibold text-sm">{t("dashboard.browseStartups")}</Text>
        </TouchableOpacity>
      </ScrollView>
      )}

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
