import { motion } from "framer-motion";
import AdminNavbar from "@/components/AdminNavbar";
import DashboardStats from "@/components/admin/DashboardStats";
import UserManagement from "@/components/admin/UserManagement";
import BlogManagement from "@/components/admin/BlogManagement";
import AdminBrowseStartups from "@/components/admin/AdminBrowseStartups";
import AdminBrowseInvestors from "@/components/admin/AdminBrowseInvestors";
import NewsletterManagement from "@/components/admin/NewsletterManagement";
import AdminManagement from "@/components/admin/AdminManagement";
import UserInvitesManagement from "@/components/admin/UserInvitesManagement";
import ConnectionsManagement from "@/components/admin/ConnectionsManagement";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import AdminPaperInvestments from "@/components/admin/AdminPaperInvestments";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Building,
  Mail,
  FileText,
  Shield,
  UserPlus,
  Network,
  TrendingUp,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { adminService } from "@/lib/admin-service";
import { useAuth } from "@/context/AuthContext";
import Footer from "@/components/Footer";

const Admin = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkSuperAdminStatus();
    }
  }, [user]);

  const checkSuperAdminStatus = async () => {
    if (!user?.id) return;
    try {
      const isSuper = await adminService.isSuperAdmin(user.id);
      setIsSuperAdmin(isSuper);
    } catch (error) {
      console.error("Error checking super admin status:", error);
    }
  };

  // Determine initial tab based on current path or query parameter
  const getInitialTab = ():
    | "dashboard"
    | "users"
    | "blog"
    | "startups"
    | "investors"
    | "newsletter"
    | "admins"
    | "invites"
    | "connections"
    | "analytics"
    | "investments" => {
    const path = window.location.pathname;
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");

    if (tabParam === "startups") return "startups";
    if (tabParam === "investors") return "investors";
    if (tabParam === "users") return "users";
    if (tabParam === "blog") return "blog";
    if (tabParam === "newsletter") return "newsletter";
    if (tabParam === "admins") return "admins";
    if (tabParam === "invites") return "invites";
    if (tabParam === "connections") return "connections";
    if (tabParam === "analytics") return "analytics";
    if (tabParam === "investments") return "investments";

    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/blog")) return "blog";
    if (path.includes("/admin/startups")) return "startups";
    if (path.includes("/admin/investors")) return "investors";
    if (path.includes("/admin/newsletter")) return "newsletter";
    if (path.includes("/admin/admins")) return "admins";
    if (path.includes("/admin/invites")) return "invites";
    if (path.includes("/admin/connections")) return "connections";
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "users"
    | "blog"
    | "startups"
    | "investors"
    | "newsletter"
    | "admins"
    | "invites"
    | "connections"
    | "analytics"
    | "investments"
  >(getInitialTab());

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />

      {/* Admin Dashboard Content */}
      <div className="pt-28 pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your startup-investor platform from here
            </p>

            {/* Tab Navigation */}
            <div className="flex gap-2 mt-6 flex-wrap">
              <Button
                variant={activeTab === "dashboard" ? "default" : "outline"}
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant={activeTab === "startups" ? "default" : "outline"}
                onClick={() => setActiveTab("startups")}
                className="flex items-center gap-2"
              >
                <Building className="h-4 w-4" />
                Startups
              </Button>
              <Button
                variant={activeTab === "investors" ? "default" : "outline"}
                onClick={() => setActiveTab("investors")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Investors
              </Button>
              <Button
                variant={activeTab === "users" ? "default" : "outline"}
                onClick={() => setActiveTab("users")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                User Management
              </Button>
              <Button
                variant={activeTab === "blog" ? "default" : "outline"}
                onClick={() => setActiveTab("blog")}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Blog Management
              </Button>
              <Button
                variant={activeTab === "newsletter" ? "default" : "outline"}
                onClick={() => setActiveTab("newsletter")}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Newsletter
              </Button>
              <Button
                variant={activeTab === "connections" ? "default" : "outline"}
                onClick={() => setActiveTab("connections")}
                className="flex items-center gap-2"
              >
                <Network className="h-4 w-4" />
                Connections
              </Button>
              <Button
                variant={activeTab === "analytics" ? "default" : "outline"}
                onClick={() => setActiveTab("analytics")}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
              <Button
                variant={activeTab === "investments" ? "default" : "outline"}
                onClick={() => setActiveTab("investments")}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Investments
              </Button>
              {isSuperAdmin && (
                <>
                  <Button
                    variant={activeTab === "admins" ? "default" : "outline"}
                    onClick={() => setActiveTab("admins")}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Admins
                  </Button>
                  <Button
                    variant={activeTab === "invites" ? "default" : "outline"}
                    onClick={() => setActiveTab("invites")}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    User Invites
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "dashboard" ? (
              <DashboardStats />
            ) : activeTab === "startups" ? (
              <AdminBrowseStartups />
            ) : activeTab === "investors" ? (
              <AdminBrowseInvestors />
            ) : activeTab === "users" ? (
              <UserManagement />
            ) : activeTab === "newsletter" ? (
              <NewsletterManagement />
            ) : activeTab === "connections" ? (
              <ConnectionsManagement />
            ) : activeTab === "admins" ? (
              <AdminManagement />
            ) : activeTab === "invites" ? (
              <UserInvitesManagement />
            ) : activeTab === "analytics" ? (
              <AnalyticsDashboard />
            ) : activeTab === "investments" ? (
              <AdminPaperInvestments />
            ) : (
              <BlogManagement />
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
