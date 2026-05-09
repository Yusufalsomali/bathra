import {
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useEffect, useState, useMemo, useContext } from "react";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { createInvestmentOffer, loadPaperInvestContext } from "@/lib/paper-venture";
import { Button } from "@/components/ui/Button";

type Props = {
  visible: boolean;
  onClose: () => void;
  startupId: string;
  startupDisplayName: string;
  onOfferSubmitted?: () => void;
};

export function PaperInvestModal({
  visible,
  onClose,
  startupId,
  startupDisplayName,
  onOfferSubmitted,
}: Props) {
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loadingCtx, setLoadingCtx] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [remainingGoal, setRemainingGoal] = useState<number | null>(null);
  const [valuation, setValuation] = useState(0);

  useEffect(() => {
    if (!visible || !user?.id || user.accountType !== "investor") return;

    let cancelled = false;
    setLoadingCtx(true);
    loadPaperInvestContext({ investorId: user.id, startupId })
      .then((ctx) => {
        if (cancelled) return;
        setAvailableBalance(ctx.availableBalance);
        setRemainingGoal(ctx.remainingFundingGoal);
        setValuation(ctx.valuation);
      })
      .finally(() => {
        if (!cancelled) setLoadingCtx(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, user?.id, user?.accountType, startupId]);

  useEffect(() => {
    if (!visible) {
      setAmount("");
      setNote("");
      setSubmitting(false);
    }
  }, [visible]);

  const numericAmount = Number(amount);
  const impliedEquity = useMemo(() => {
    if (!valuation || !numericAmount || numericAmount <= 0) return 0;
    return (numericAmount / valuation) * 100;
  }, [valuation, numericAmount]);

  const validationMessage = useMemo(() => {
    if (!amount) return "";
    if (!Number.isFinite(numericAmount) || numericAmount <= 0)
      return t("paperInvest.validationPositive");
    if (numericAmount > availableBalance) return t("paperInvest.validationBalance");
    if (remainingGoal !== null && numericAmount > remainingGoal)
      return t("paperInvest.validationGoal");
    return "";
  }, [amount, numericAmount, availableBalance, remainingGoal, t]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(n || 0);

  const submit = () => {
    if (!user?.id || validationMessage || !numericAmount) return;

    Alert.alert(t("paperInvest.confirmTitle"), t("paperInvest.confirmMessage", { amount: fmt(numericAmount), name: startupDisplayName }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("paperInvest.submitOffer"),
        onPress: async () => {
          setSubmitting(true);
          const result = await createInvestmentOffer({
            investorId: user.id,
            startupId,
            amount: numericAmount,
            note: note.trim() || undefined,
          });
          setSubmitting(false);
          if (!result.success) {
            Alert.alert(t("common.error"), result.error || t("common.error"));
            return;
          }
          Alert.alert(t("common.success"), t("paperInvest.successBody"));
          onOfferSubmitted?.();
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-black/50 justify-end"
      >
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          <View className="px-5 pt-4 pb-2 border-b border-slate-100">
            <Text className={`text-lg font-black text-black ${isRTL ? "text-right" : "text-left"}`}>
              {t("paperInvest.title")}
            </Text>
            <Text className={`text-xs text-slate-500 mt-1 ${isRTL ? "text-right" : "text-left"}`}>
              {t("paperInvest.subtitle")}
            </Text>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
          >
            <View className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 mb-4">
              <Text className={`font-semibold text-black ${isRTL ? "text-right" : "text-left"}`}>
                {startupDisplayName}
              </Text>
              <Text className={`text-xs text-slate-600 mt-1 ${isRTL ? "text-right" : "text-left"}`}>
                {t("paperInvest.valuationRef")}: {fmt(valuation)}
              </Text>
              <Text className={`text-xs text-slate-600 ${isRTL ? "text-right" : "text-left"}`}>
                {t("paperInvest.availableCash")}: {loadingCtx ? "…" : fmt(availableBalance)}
              </Text>
              {remainingGoal !== null && (
                <Text className={`text-xs text-slate-600 ${isRTL ? "text-right" : "text-left"}`}>
                  {t("paperInvest.remainingGoal")}: {fmt(remainingGoal)}
                </Text>
              )}
            </View>

            <Text className={`text-xs font-semibold text-slate-500 mb-1 ${isRTL ? "text-right" : "text-left"}`}>
              {t("paperInvest.amountLabel")}
            </Text>
            <TextInput
              className="border border-slate-200 rounded-xl px-3 py-3 text-black mb-1"
              placeholder="50000"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              textAlign={isRTL ? "right" : "left"}
            />
            {validationMessage ? (
              <Text className="text-xs text-red-500 mb-3">{validationMessage}</Text>
            ) : (
              <Text className={`text-xs text-slate-500 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                {t("paperInvest.impliedEquity")}: {impliedEquity.toFixed(2)}%
              </Text>
            )}

            <Text className={`text-xs font-semibold text-slate-500 mb-1 ${isRTL ? "text-right" : "text-left"}`}>
              {t("paperInvest.noteLabel")}
            </Text>
            <TextInput
              className="border border-slate-200 rounded-xl px-3 py-3 text-black mb-6 min-h-[88px]"
              placeholder={t("paperInvest.notePlaceholder")}
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
              textAlign={isRTL ? "right" : "left"}
            />

            <View className="flex-row gap-3">
              <Button title={t("common.cancel")} variant="outline" onPress={onClose} className="flex-1" />
              <Button
                title={t("paperInvest.reviewOffer")}
                onPress={submit}
                loading={submitting}
                disabled={Boolean(validationMessage) || !amount || loadingCtx}
                className="flex-1"
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
