import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { PaperVentureService } from "@/lib/paper-venture-service";
import { InvestorPortfolioSummary } from "@/lib/paper-venture-types";
import InvestorPortfolioSection from "@/components/paper-venture/InvestorPortfolioSection";
import AddVirtualFundsDialog from "@/components/paper-venture/AddVirtualFundsDialog";
import { toast } from "@/hooks/use-toast";

const InvestorPortfolio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<InvestorPortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  const loadSummary = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    const result = await PaperVentureService.getInvestorPortfolioSummary(user.id);
    if (result.error) {
      toast({
        title: "Unable to load paper portfolio",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setSummary(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadSummary();
  }, [user?.id]);

  const handleAddFunds = async (amount: number) => {
    if (!user?.id) return;

    const result = await PaperVentureService.addVirtualFunds(user.id, amount);
    if (result.error) {
      toast({
        title: "Could not add virtual funds",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Virtual funds added",
      description:
        "Your simulated investor wallet has been topped up for venture testing.",
    });
    loadSummary();
  };

  const handleCancelOffer = async (offerId: string) => {
    const result = await PaperVentureService.updateOfferStatus(
      offerId,
      "cancelled"
    );

    if (result.error) {
      toast({
        title: "Could not cancel offer",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Offer cancelled",
      description:
        "The startup can no longer accept it, and the reserved virtual funds were released.",
    });
    loadSummary();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            {isLoading ? null : (
              <InvestorPortfolioSection
                summary={summary}
                onAddFunds={() => setIsAddFundsOpen(true)}
                onOpenPortfolio={() => navigate("/startups")}
                onCancelOffer={handleCancelOffer}
              />
            )}
          </motion.div>
        </div>
      </section>
      <Footer />

      <AddVirtualFundsDialog
        open={isAddFundsOpen}
        onOpenChange={setIsAddFundsOpen}
        onSubmit={handleAddFunds}
        currencyCode={summary?.wallet.currency_code || "SAR"}
      />
    </div>
  );
};

export default InvestorPortfolio;
