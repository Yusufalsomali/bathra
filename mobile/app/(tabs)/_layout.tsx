import { Tabs, Redirect } from "expo-router";
import { useContext } from "react";
import { Text } from "react-native";
import { Home, Compass, GitMerge, Newspaper, Bell } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, useRouteUser } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function TabsLayout() {
  const { isLoading } = useAuth();
  const routeUser = useRouteUser();
  const { t } = useContext(I18nContext);
  const { bottom: tabBarBottomInset } = useSafeAreaInsets();
  const tabBarPaddingBottom = 8 + tabBarBottomInset;
  const tabBarHeight = 72 + tabBarBottomInset;

  if (isLoading) return <LoadingScreen />;
  if (!routeUser) return <Redirect href="/(auth)" />;
  if (routeUser.status !== "approved") return <Redirect href="/(auth)/pending" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#f1f5f9",
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: tabBarPaddingBottom,
          height: tabBarHeight,
        },
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
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
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? "#000000" : "#94a3b8",
                fontSize: 10,
                fontWeight: "600",
                textAlign: "center",
                marginTop: 2,
                maxWidth: 76,
              }}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {t("nav.matchmaking")}
            </Text>
          ),
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
