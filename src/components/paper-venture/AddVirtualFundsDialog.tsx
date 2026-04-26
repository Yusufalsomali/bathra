import { useEffect, useState } from "react";
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

interface AddVirtualFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number) => Promise<void>;
  currencyCode?: string;
}

const QUICK_AMOUNTS = [10_000, 25_000, 50_000, 100_000];

const AddVirtualFundsDialog = ({
  open,
  onOpenChange,
  onSubmit,
  currencyCode = "SAR",
}: AddVirtualFundsDialogProps) => {
  const [amount, setAmount] = useState("10000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("10000");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(numericAmount);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Virtual Funds</DialogTitle>
          <DialogDescription>
            This adds simulated venture capital only. No real payment or transfer
            happens in Bathra.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="virtual-funds-amount">Amount ({currencyCode})</Label>
            <Input
              id="virtual-funds-amount"
              type="number"
              min="1"
              step="1000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="10000"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Quick add
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  onClick={() => setAmount(String(quickAmount))}
                >
                  {quickAmount.toLocaleString()} {currencyCode}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Virtual Funds"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVirtualFundsDialog;
