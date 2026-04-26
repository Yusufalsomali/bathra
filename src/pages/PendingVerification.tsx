import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, XCircle, Flag, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

const PendingVerification = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const getStatusInfo = () => {
    const status = profile?.status || "pending";

    switch (status) {
      case "pending":
        return {
          icon: <Clock className="h-8 w-8 text-yellow-500" />,
          title: "Account Pending Verification",
          description: "Your account is currently under review by our team.",
          message:
            "We'll notify you via email once your account has been verified. This process typically takes 1-2 business days.",
          badgeColor: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
        };
      case "rejected":
        return {
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          title: "Account Verification Rejected",
          description: "Your account verification was not approved.",
          message:
            "Please contact our support team if you believe this was an error or need clarification on the rejection.",
          badgeColor: "bg-red-500/20 text-red-700 border-red-500/30",
        };
      case "flagged":
        return {
          icon: <Flag className="h-8 w-8 text-orange-500" />,
          title: "Account Under Review",
          description: "Your account has been flagged for additional review.",
          message:
            "Our team is conducting an additional review of your account. We'll contact you if any additional information is needed.",
          badgeColor: "bg-orange-500/20 text-orange-700 border-orange-500/30",
        };
      case "approved":
        return {
          icon: <Check className="h-8 w-8 text-green-500" />,
          title: "Account Verified",
          description: "Your account has been successfully verified.",
          message: "You can now access all features of the platform.",
          badgeColor: "bg-green-500/20 text-green-700 border-green-500/30",
        };
      default:
        return {
          icon: <AlertCircle className="h-8 w-8 text-gray-500" />,
          title: "Account Status Unknown",
          description: "Unable to determine account status.",
          message: "Please contact support for assistance.",
          badgeColor: "bg-gray-500/20 text-gray-700 border-gray-500/30",
        };
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const statusInfo = getStatusInfo();
  const accountType =
    profile?.accountType === "startup" ? "Startup" : "Investor";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-16">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="neo-blur shadow-lg border-white/10">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  {statusInfo.icon}
                </div>
                <CardTitle className="text-2xl font-bold">
                  {statusInfo.title}
                </CardTitle>
                <div className="flex justify-center mt-2">
                  <Badge className={statusInfo.badgeColor}>
                    {accountType} Account - {profile?.status || "pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <p className="text-lg text-muted-foreground">
                  {statusInfo.description}
                </p>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    {statusInfo.message}
                  </p>
                </div>

                {profile?.adminNotes && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-700 mb-2">
                      Admin Note:
                    </h4>
                    <p className="text-sm text-blue-600">
                      {profile.adminNotes}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {profile?.status === "approved" && (
                    <Button
                      onClick={() =>
                        navigate(
                          profile.accountType === "startup"
                            ? "/startup-dashboard"
                            : "/investor-dashboard"
                        )
                      }
                      className="w-full"
                    >
                      Continue to Dashboard
                    </Button>
                  )}

                  {(profile?.status === "rejected" ||
                    profile?.status === "flagged") && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        (window.location.href =
                          "mailto:support@yourplatform.com")
                      }
                      className="w-full"
                    >
                      Contact Support
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PendingVerification;
