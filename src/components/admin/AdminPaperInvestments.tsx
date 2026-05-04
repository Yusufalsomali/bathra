import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, TrendingUp } from "lucide-react";
import { PaperInvestmentExitDialog } from "./PaperInvestmentExitDialog";

interface ActiveInvestment {
  id: string;
  amount: number;
  instrument: string | null;
  created_at: string;
  investor_name: string;
  startup_name: string;
}

const AdminPaperInvestments = () => {
  const [investments, setInvestments] = useState<ActiveInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exitTarget, setExitTarget] = useState<ActiveInvestment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("paper_investments")
      .select(`
        id,
        amount,
        instrument,
        created_at,
        investors ( name ),
        startups ( name )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    setInvestments(
      (data ?? []).map((row: any) => ({
        id: row.id,
        amount: row.amount,
        instrument: row.instrument ?? null,
        created_at: row.created_at,
        investor_name: row.investors?.name ?? "Unknown investor",
        startup_name: row.startups?.name ?? "Unknown startup",
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading investments…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Active Paper Investments</h2>
        <p className="text-muted-foreground">All live positions — exit any investment from here</p>
      </div>

      {investments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No active investments</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Investments ({investments.length})</CardTitle>
            <CardDescription>Click "Exit" to simulate an exit event for a position</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {investments.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                  <div className="space-y-1">
                    <p className="font-medium">{inv.startup_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Investor: {inv.investor_name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">SAR {inv.amount.toLocaleString()}</span>
                      {inv.instrument && (
                        <Badge variant="secondary" className="text-xs">{inv.instrument}</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setExitTarget(inv)}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Exit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {exitTarget && (
        <PaperInvestmentExitDialog
          open={!!exitTarget}
          onOpenChange={(open) => { if (!open) setExitTarget(null); }}
          investmentId={exitTarget.id}
          originalAmount={exitTarget.amount}
          startupName={exitTarget.startup_name}
          onSuccess={() => { setExitTarget(null); load(); }}
        />
      )}
    </div>
  );
};

export default AdminPaperInvestments;
