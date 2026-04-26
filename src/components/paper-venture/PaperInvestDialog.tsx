import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { StartupBasicInfo } from "@/lib/startup-types";

interface PaperInvestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startup: StartupBasicInfo | null;
  availableBalance: number;
  remainingFundingGoal: number | null;
  onConfirm: (amount: number, note?: string) => Promise<void>;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const PaperInvestDialog = ({
  open,
  onOpenChange,
  startup,
  availableBalance,
  remainingFundingGoal,
  onConfirm,
}: PaperInvestDialogProps) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setNote("");
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  }, [open]);

  const numericAmount = Number(amount);
  const currentValuation = startup?.valuation_amount || 0;
  const impliedEquity = useMemo(() => {
    if (!currentValuation || !numericAmount || numericAmount <= 0) {
      return 0;
    }

    return (numericAmount / currentValuation) * 100;
  }, [currentValuation, numericAmount]);

  const validationMessage = useMemo(() => {
    if (!amount) return "";
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return "Enter a positive simulated investment amount.";
    }
    if (numericAmount > availableBalance) {
      return "This exceeds your available simulated balance.";
    }
    if (
      remainingFundingGoal !== null &&
      numericAmount > remainingFundingGoal
    ) {
      return "This exceeds the startup's remaining simulated funding goal.";
    }
    return "";
  }, [amount, availableBalance, numericAmount, remainingFundingGoal]);

  const handleFinalConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(numericAmount, note || undefined);
      setShowConfirmation(false);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invest With Virtual Funds</DialogTitle>
            <DialogDescription>
              This creates a simulated venture offer. Pending offers reserve your
              virtual funds until the startup accepts, rejects, or you cancel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
              <div className="font-medium">
                {startup?.startup_name || startup?.name}
              </div>
              <div className="mt-1 text-muted-foreground">
                Current valuation: {formatCurrency(currentValuation)}
              </div>
              <div className="text-muted-foreground">
                Available simulated cash: {formatCurrency(availableBalance)}
              </div>
              {remainingFundingGoal !== null && (
                <div className="text-muted-foreground">
                  Remaining funding goal: {formatCurrency(remainingFundingGoal)}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paper-invest-amount">Investment amount (SAR)</Label>
              <Input
                id="paper-invest-amount"
                type="number"
                min="1"
                step="1000"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="50000"
              />
              {validationMessage ? (
                <p className="text-sm text-red-500">{validationMessage}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Implied ownership at today's valuation: {impliedEquity.toFixed(2)}
                  %
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paper-invest-note">Offer note (optional)</Label>
              <Textarea
                id="paper-invest-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Explain why this startup fits your paper venture thesis"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => setShowConfirmation(true)}
              disabled={Boolean(validationMessage) || !amount}
            >
              Review Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm simulated venture offer</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to reserve {formatCurrency(numericAmount)} of virtual
              funds for {startup?.startup_name || startup?.name}. No real money,
              legal transfer, or securities issuance occurs in Bathra.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-lg border border-white/10 bg-background/60 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Offer amount</span>
              <strong>{formatCurrency(numericAmount)}</strong>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Implied ownership</span>
              <strong>{impliedEquity.toFixed(2)}%</strong>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Valuation reference</span>
              <strong>{formatCurrency(currentValuation)}</strong>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalConfirm} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Offer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PaperInvestDialog;
