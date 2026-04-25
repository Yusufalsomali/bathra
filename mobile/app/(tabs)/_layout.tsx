import { Tabs, Redirect } from "expo-router";
import { useContext } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
      size={24}
      color={focused ? "#0f172a" : "#94a3b8"}
    />
  );
}

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
        tabBarActiveTintColor: "#0f172a",
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
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t("nav.explore"),
          tabBarIcon: ({ focused }) => <TabIcon name="compass" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="matchmaking"
        options={{
          title: t("nav.matchmaking"),
          tabBarIcon: ({ focused }) => <TabIcon name="git-merge" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="articles"
        options={{
          title: t("nav.articles"),
          tabBarIcon: ({ focused }) => <TabIcon name="newspaper" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t("nav.notifications"),
          tabBarIcon: ({ focused }) => <TabIcon name="notifications" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
