import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "expo-router";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Article } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = [
  "all",
  "news",
  "industry_insights",
  "startup_tips",
  "investment_guide",
  "company_updates",
  "market_analysis",
  "founder_stories",
  "investor_spotlight",
] as const;

type Category = (typeof CATEGORIES)[number];

function ArticleCard({
  item,
  onPress,
  isRTL,
  t,
}: {
  item: Article;
  onPress: () => void;
  isRTL: boolean;
  t: (k: string) => string;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card className="mb-3">
        {item.featured_image_url && (
          <Image
            source={{ uri: item.featured_image_url }}
            className="w-full h-40 rounded-xl mb-3"
            resizeMode="cover"
          />
        )}
        <View className={`flex-row items-center justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Badge label={t(`articles.${item.category}`)} variant="info" />
          {item.is_featured && <Badge label="Featured" variant="warning" />}
        </View>
        <Text
          className={`font-bold text-slate-900 text-base mb-1 leading-5 ${isRTL ? "text-right" : "text-left"}`}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {item.excerpt && (
          <Text
            className={`text-slate-500 text-sm leading-5 mb-3 ${isRTL ? "text-right" : "text-left"}`}
            numberOfLines={2}
          >
            {item.excerpt}
          </Text>
        )}
        <View className={`flex-row items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
          <Text className="text-xs text-slate-400">{item.author_name}</Text>
          <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
            <Ionicons name="eye-outline" size={13} color="#94a3b8" />
            <Text className="text-xs text-slate-400 ml-1">{item.views_count}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function ArticlesScreen() {
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState<Category>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchArticles = useCallback(async () => {
    try {
      let query = supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (category !== "all") {
        query = query.eq("category", category);
      }

      const { data } = await query;
      setArticles((data as Article[]) || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  useEffect(() => {
    setLoading(true);
    fetchArticles();
  }, [fetchArticles]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-4 pt-14 pb-0 border-b border-slate-100">
        <Text className={`text-2xl font-black text-slate-900 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
          {t("articles.title")}
        </Text>
        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              className={`mr-2 px-3 py-1.5 rounded-full ${
                category === cat ? "bg-slate-900" : "bg-slate-100"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  category === cat ? "text-white" : "text-slate-600"
                }`}
              >
                {t(`articles.${cat}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchArticles(); }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="newspaper-outline"
              title={t("articles.title")}
              description={t("common.noData")}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ArticleCard
            item={item}
            onPress={() =>
              router.push({ pathname: "/(stack)/article/[slug]", params: { slug: item.slug } })
            }
            isRTL={isRTL}
            t={t}
          />
        )}
      />
    </SafeAreaView>
  );
}
