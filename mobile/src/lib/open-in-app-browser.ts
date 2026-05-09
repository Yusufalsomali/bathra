import * as WebBrowser from "expo-web-browser";

/** Opens URL in an in-app browser (SFSafariViewController / Chrome Custom Tabs), not the external browser app. */
export function openInAppBrowser(url: string): void {
  void WebBrowser.openBrowserAsync(url);
}
