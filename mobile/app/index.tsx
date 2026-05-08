import { Redirect } from "expo-router";
import { useAuth, useRouteUser } from "@/context/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function Index() {
  const { isLoading } = useAuth();
  const routeUser = useRouteUser();

  if (!isSupabaseConfigured) return <Redirect href="/not-configured" />;
  if (isLoading) return <LoadingScreen />;
  if (routeUser && routeUser.status === "approved") return <Redirect href="/(tabs)" />;
  if (routeUser) return <Redirect href="/(auth)/pending" />;
  return <Redirect href="/(auth)" />;
}
