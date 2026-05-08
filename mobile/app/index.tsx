import { Redirect } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (!isSupabaseConfigured) return <Redirect href="/not-configured" />;
  if (isLoading) return <LoadingScreen />;
  if (user && user.status === "approved") return <Redirect href="/(tabs)" />;
  if (user) return <Redirect href="/(auth)/pending" />;
  return <Redirect href="/(auth)" />;
}
