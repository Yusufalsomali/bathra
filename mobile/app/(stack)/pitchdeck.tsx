import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useState, useEffect, useContext, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { I18nContext } from "@/context/i18n-context";
import { useRTL } from "@/hooks/useRTL";
import { supabase } from "@/lib/supabase/client";
import * as DocumentPicker from "expo-document-picker";
import { File as FSFile } from "expo-file-system";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FileText, ExternalLink, CloudUpload } from "lucide-react-native";

const MAX_FILE_SIZE_MB = 10;

export default function PitchDeckScreen() {
  const { user } = useAuth();
  const { t } = useContext(I18nContext);
  const { isRTL } = useRTL();

  const [pitchDeckUrl, setPitchDeckUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchPitchDeck = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("startups")
      .select("pitch_deck")
      .eq("id", user.id)
      .single();
    const row = data as unknown as { pitch_deck?: string } | null;
    if (row?.pitch_deck) setPitchDeckUrl(row.pitch_deck);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPitchDeck();
  }, [fetchPitchDeck]);

  const handlePickAndUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];

      setUploading(true);

      // Read file using new expo-file-system File class API
      const fsFile = new FSFile(file.uri);
      const arrayBuffer = await fsFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Basic size check
      const sizeMB = bytes.byteLength / (1024 * 1024);
      if (sizeMB > MAX_FILE_SIZE_MB) {
        setUploading(false);
        Alert.alert(
          t("common.error"),
          `File too large. Max ${MAX_FILE_SIZE_MB}MB allowed.`
        );
        return;
      }

      const fileName = `${user?.id}/${Date.now()}_pitchdeck.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("pitchdecks")
        .upload(fileName, bytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("pitchdecks")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("startups")
        .update({ pitch_deck: publicUrl } as Record<string, string>)
        .eq("id", user?.id ?? "");

      if (updateError) throw updateError;

      setPitchDeckUrl(publicUrl);
      Alert.alert(t("common.success"), t("pitchdeck.uploadSuccess"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("pitchdeck.uploadError");
      Alert.alert(t("common.error"), msg);
    } finally {
      setUploading(false);
    }
  };

  const handleViewPdf = () => {
    if (pitchDeckUrl) Linking.openURL(pitchDeckUrl);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 px-4 pt-6">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0f172a" />
          </View>
        ) : (
          <>
            {pitchDeckUrl ? (
              <Card className="mb-4">
                <View className={`flex-row items-center mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <View className="w-12 h-12 rounded-xl bg-red-50 items-center justify-center mr-3">
                    <FileText size={24} stroke="#ef4444" strokeWidth={1.5} />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-bold text-slate-900 ${isRTL ? "text-right" : "text-left"}`}>
                      Pitch Deck
                    </Text>
                    <Text className={`text-xs text-slate-400 ${isRTL ? "text-right" : "text-left"}`}>
                      PDF uploaded
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <Button
                    title={t("pitchdeck.viewPdf")}
                    onPress={handleViewPdf}
                    icon={<ExternalLink size={16} stroke="white" strokeWidth={1.5} />}
                    className="flex-1"
                  />
                  <Button
                    title={t("pitchdeck.upload")}
                    variant="outline"
                    onPress={handlePickAndUpload}
                    loading={uploading}
                    className="flex-1"
                  />
                </View>
              </Card>
            ) : (
              <View className="flex-1 items-center justify-center">
                <View className="w-24 h-24 rounded-full bg-slate-100 items-center justify-center mb-6">
                  <FileText size={44} stroke="#94a3b8" strokeWidth={1} />
                </View>
                <Text className={`text-xl font-bold text-slate-800 mb-2 ${isRTL ? "text-right" : "text-center"}`}>
                  {t("pitchdeck.noPitchDeck")}
                </Text>
                <Text className="text-slate-500 text-sm text-center mb-10">
                  {t("pitchdeck.uploadDesc")}
                </Text>
                <Button
                  title={uploading ? t("pitchdeck.uploading") : t("pitchdeck.upload")}
                  onPress={handlePickAndUpload}
                  loading={uploading}
                  icon={<CloudUpload size={18} stroke="white" strokeWidth={1.5} />}
                  className="w-full"
                />
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
