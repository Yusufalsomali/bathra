import {
  View,
  Text,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useContext } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import { Article } from "@/types/database";
import { Badge } from "@/components/ui/Badge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Eye } from "lucide-react-native";

export default function ArticleDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const navigation = useNavigation();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single()
      .then(async ({ data }: { data: unknown }) => {
        const article = data as unknown as Article;
        setArticle(article);
        if (article) {
          navigation.setOptions({ title: article.title });
          await supabase.rpc("increment_article_views", { article_id: article.id });
        }
        setLoading(false);
      });
  }, [slug, navigation]);

  if (loading || !article) return <LoadingScreen />;

  const publishDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {article.featured_image_url && (
          <Image
            source={{ uri: article.featured_image_url }}
            className="w-full h-52"
            resizeMode="cover"
          />
        )}

        <View className="px-5 pt-6">
          {/* Category + meta */}
          <View className={`flex-row items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Badge label={t(`articles.${article.category}`)} variant="info" />
            <View className={`flex-row items-center ${isRTL ? "flex-row-reverse" : ""}`}>
              <Eye size={14} stroke="#94a3b8" strokeWidth={1.5} />
              <Text className="text-xs text-slate-400 ml-1">
                {article.views_count} {t("articles.views")}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text
            className={`text-2xl font-black text-slate-900 leading-8 mb-3 ${isRTL ? "text-right" : "text-left"}`}
          >
            {article.title}
          </Text>

          {/* Author + date */}
          <View className={`flex-row items-center mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Text className="text-sm text-slate-500">{article.author_name}</Text>
            {publishDate && (
              <>
                <Text className="text-slate-300 mx-2">·</Text>
                <Text className="text-sm text-slate-400">{publishDate}</Text>
              </>
            )}
          </View>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <View className={`flex-row flex-wrap gap-2 mb-6 ${isRTL ? "justify-end" : "justify-start"}`}>
              {article.tags.map((tag) => (
                <View key={tag} className="bg-slate-100 px-2.5 py-1 rounded-full">
                  <Text className="text-xs text-slate-600">#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Content — plain text render */}
          <Text
            className={`text-base text-slate-700 leading-7 ${isRTL ? "text-right" : "text-left"}`}
          >
            {article.content}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
