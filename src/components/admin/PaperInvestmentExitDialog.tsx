import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { PaperVentureService } from "@/lib/paper-venture-service";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investmentId: string;
  originalAmount: number;
  startupName: string;
  onSuccess: () => void;
}

export const PaperInvestmentExitDialog = ({
  open,
  onOpenChange,
  investmentId,
  originalAmount,
  startupName,
  onSuccess,
}: Props) => {
  const [exitAmount, setExitAmount] = useState(originalAmount.toString());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExit = async () => {
    const amount = parseFloat(exitAmount);
    if (!amount || amount < 0) return;
    setLoading(true);
    const { success, error } = await PaperVentureService.exitInvestment(investmentId, amount);
    setLoading(false);
    if (!success) {
      toast({ title: "Error", description: error ?? "Failed to exit", variant: "destructive" });
      return;
    }
    const gain = amount - originalAmount;
    toast({
      title: "Investment exited",
      description: `Exit at SAR ${amount.toLocaleString()}. ${gain >= 0 ? "Gain" : "Loss"}: SAR ${Math.abs(gain).toLocaleString()}`,
    });
    onOpenChange(false);
    onSuccess();
  };

  const amount = parseFloat(exitAmount) || 0;
  const gain = amount - originalAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exit Investment — {startupName}</DialogTitle>
          <DialogDescription>
            Enter the exit value. This will close the position and return funds to the investor's wallet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Original Investment</Label>
            <p className="text-sm text-muted-foreground mt-1">SAR {originalAmount.toLocaleString()}</p>
          </div>
          <div>
            <Label htmlFor="exit-amount">Exit Value (SAR)</Label>
            <Input
              id="exit-amount"
              type="number"
              value={exitAmount}
              onChange={(e) => setExitAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          {amount > 0 && (
            <div className={`text-sm font-medium ${gain >= 0 ? "text-green-600" : "text-red-500"}`}>
              {gain >= 0 ? "Gain" : "Loss"}: SAR {Math.abs(gain).toLocaleString()} ({gain >= 0 ? "+" : ""}
              {((gain / originalAmount) * 100).toFixed(1)}%)
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExit} disabled={loading || !exitAmount}>
            {loading ? "Processing…" : "Confirm Exit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
