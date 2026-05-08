import { Tabs, Redirect } from "expo-router";
import { useContext } from "react";
import { Home, Compass, GitMerge, Newspaper, Bell } from "lucide-react-native";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const { t } = useContext(I18nContext);

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect href="/(auth)" />;
  if (user.status !== "approved") return <Redirect href="/(auth)/pending" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#f1f5f9",
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          tabBarIcon: ({ focused }) => (
            <Home size={22} stroke={focused ? "#000000" : "#94a3b8"} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t("nav.explore"),
          tabBarIcon: ({ focused }) => (
            <Compass size={22} stroke={focused ? "#000000" : "#94a3b8"} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="matchmaking"
        options={{
          title: t("nav.matchmaking"),
          tabBarIcon: ({ focused }) => (
            <GitMerge size={22} stroke={focused ? "#000000" : "#94a3b8"} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="articles"
        options={{
          title: t("nav.articles"),
          tabBarIcon: ({ focused }) => (
            <Newspaper size={22} stroke={focused ? "#000000" : "#94a3b8"} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t("nav.notifications"),
          tabBarIcon: ({ focused }) => (
            <Bell size={22} stroke={focused ? "#000000" : "#94a3b8"} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
    </Tabs>
  );
}
