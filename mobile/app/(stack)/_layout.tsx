import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackButtonDisplayMode: "minimal",
        headerLargeTitle: false,
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#000000",
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "700", fontSize: 15 },
        contentStyle: { backgroundColor: "#ffffff" },
      }}
    >
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="connections" options={{ title: "Connections" }} />
      <Stack.Screen name="pitchdeck" options={{ title: "Pitch Deck" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="reset-password" options={{ title: "Reset Password", headerShown: false }} />
      <Stack.Screen name="interested-investors" options={{ title: "Interested Investors", headerShown: false }} />
      <Stack.Screen name="interested-startups" options={{ title: "Interested Startups", headerShown: false }} />
      <Stack.Screen name="portfolio" options={{ title: "Portfolio", headerShown: false }} />
      <Stack.Screen name="startup/[id]" options={{ title: "Startup" }} />
      <Stack.Screen name="investor/[id]" options={{ title: "Investor" }} />
      <Stack.Screen name="article/[slug]" options={{ title: "Article" }} />
    </Stack>
  );
}
