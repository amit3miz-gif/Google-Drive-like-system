import { Redirect } from "expo-router";
import { useAuth } from "../src/hooks/useAuth";

export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  return isAuthenticated ? <Redirect href="/(tabs)/drive" /> : <Redirect href="/login" />;
}
