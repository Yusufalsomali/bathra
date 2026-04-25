import { Redirect } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (user && user.status === "approved") return <Redirect href="/(tabs)" />;
  if (user) return <Redirect href="/(auth)/pending" />;
  return <Redirect href="/(auth)" />;
}
