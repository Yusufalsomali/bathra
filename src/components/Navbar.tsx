import { useState, useEffect } from "react";
import { Menu, X, LogIn, Home, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { canBrowseContent } from "@/lib/auth-utils";
import NotificationDropdown from "@/components/NotificationDropdown";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";
import { homeTranslations } from "@/utils/language/home";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { language } = useLanguage();

  const accountType = profile?.accountType;

  useEffect(() => {
    // Detect iOS Safari
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigation = (path: string) => {
    // Check if user is trying to access browsing features
    const browsingPaths = [
      "/startups",
      "/investor-dashboard",
      //"/investors",
      "/startup-dashboard",
    ];

    if (browsingPaths.includes(path) && !canBrowseContent(profile)) {
      navigate("/pending-verification");
      window.scrollTo(0, 0);
      setIsMobileMenuOpen(false);
      return;
    }

    if (path.startsWith("/#")) {
      const elementId = path.substring(2);
      // If we're not on the home page, navigate to home first
      if (window.location.pathname !== "/") {
        navigate("/");
        // Wait for navigation to complete before scrolling
        setTimeout(() => {
          const element = document.getElementById(elementId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        // We're already on home page, just scroll
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      navigate(path);
      // Scroll to top for regular page navigation
      window.scrollTo(0, 0);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get navigation items based on user type and authentication status
  const getNavItems = () => {
    const publicItems = [
      {
        label: homeTranslations.navHome[language],
        path: "/",
      },
      {
        label: homeTranslations.navHowItWorks[language],
        path: "/#how-it-works",
      },
      {
        label: homeTranslations.navArticles[language],
        path: "/articles",
      },
    ];

    if (!user) return publicItems;

    // For admin users, show public items (what non-logged-in users see)
    if (accountType === "admin") {
      return publicItems;
    }

    // When logged in, don't show "How It Works" for a cleaner experience
    if (accountType === "startup") {
      return [
        {
          label: homeTranslations.navDashboard[language],
          path: "/startup-dashboard",
        },
        {
          label: homeTranslations.navProfile[language],
          path: "/startup-profile",
        },
        {
          label: homeTranslations.navArticles[language],
          path: "/articles",
        },
      ];
    } else {
      // For investors (individual or VC)
      return [
        {
          label: homeTranslations.navDashboard[language],
          path: "/investor-dashboard",
        },
        {
          label: "Portfolio",
          path: "/portfolio",
        },
        {
          label: homeTranslations.navProfile[language],
          path: "/investor-profile",
        },
        {
          label: homeTranslations.navArticles[language],
          path: "/articles",
        },
      ];
    }
  };

  // Get navigation items
  const navItems = getNavItems();

  const renderAuthButtons = () => {
    if (!user) {
      return (
        <Button
          size="sm"
          onClick={() => {
            navigate("/login");
            window.scrollTo(0, 0);
          }}
          className="flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          {homeTranslations.navSignIn[language]}
        </Button>
      );
    }

    // Render admin buttons when user is admin
    if (accountType === "admin") {
      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Main Site
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Admin
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      );
    }

    // Render different buttons based on account type
    if (accountType === "startup") {
      return (
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            {homeTranslations.navSignOut[language]}
          </Button>
        </div>
      );
    } else {
      // For investors (individual or VC)
      return (
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            {homeTranslations.navSignOut[language]}
          </Button>
        </div>
      );
    }
  };

  const renderMobileAuthButtons = () => {
    if (!user) {
      return (
        <button
          onClick={() => {
            navigate("/login");
            window.scrollTo(0, 0);
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors duration-200 py-2 text-left"
        >
          <LogIn className="w-4 h-4" />
          {homeTranslations.navSignIn[language]}
        </button>
      );
    }

    // Render admin buttons for mobile when user is admin
    if (accountType === "admin") {
      return (
        <>
          <button
            onClick={() => handleNavigation("/")}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors duration-200 py-2 text-left"
          >
            <Home className="w-4 h-4" />
            Main Site
          </button>
          <button
            onClick={() => handleNavigation("/admin")}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors duration-200 py-2 text-left"
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
          <button
            onClick={() => {
              handleLogout();
              setIsMobileMenuOpen(false);
            }}
            className="text-foreground hover:text-primary transition-colors duration-200 py-2 text-left"
          >
            Sign Out
          </button>
        </>
      );
    }

    // Only show the Sign Out button for startup accounts, as the My Startup link is already in navItems
    if (accountType === "startup") {
      return (
        <button
          onClick={() => {
            handleLogout();
            setIsMobileMenuOpen(false);
          }}
          className="text-foreground hover:text-primary transition-colors duration-200 py-2 text-left"
        >
          {homeTranslations.navSignOut[language]}
        </button>
      );
    } else {
      return (
        <>
          <button
            onClick={() => {
              handleLogout();
              setIsMobileMenuOpen(false);
            }}
            className="text-foreground hover:text-primary transition-colors duration-200 py-2 text-left"
          >
            {homeTranslations.navSignOut[language]}
          </button>
        </>
      );
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled
            ? isIOS
              ? "bg-background/95 shadow-lg py-2"
              : "bg-background/80 backdrop-blur-lg shadow-lg py-2"
            : "bg-transparent py-4"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNavigation("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
            >
              <img src="/Logo.svg" alt="Bathra Logo" className="h-5 w-auto" />
            </button>

            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  className="text-foreground hover:text-primary transition-colors duration-200"
                >
                  {item.label}
                </button>
              ))}

              {/* Language Selector */}
              <LanguageSelector />

              {/* Notifications for logged in users */}
              {user &&
                (profile?.accountType === "admin" ||
                  canBrowseContent(profile)) && <NotificationDropdown />}

              {renderAuthButtons()}
            </div>

            <div className="md:hidden flex items-center">
              <button
                className="text-foreground hover:text-primary transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-[60px] left-0 right-0 shadow-lg z-40 md:hidden ${
              isIOS ? "bg-background/95" : "bg-background/80 backdrop-blur-lg"
            }`}
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.path)}
                    className="text-foreground hover:text-primary transition-colors duration-200 py-2 text-left"
                  >
                    {item.label}
                  </button>
                ))}

                {/* Language Selector for mobile */}
                <div className="py-2 flex justify-start">
                  <LanguageSelector />
                </div>

                {/* Notifications for logged in users on mobile */}
                {user &&
                  (profile?.accountType === "admin" ||
                    canBrowseContent(profile)) && (
                    <div className="py-2 flex justify-start">
                      <NotificationDropdown />
                    </div>
                  )}

                {renderMobileAuthButtons()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
