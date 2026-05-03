import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  X,
  Eye,
  ExternalLink,
  Mail,
  Users,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Calendar,
  Settings,
  Archive,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Notification } from "@/lib/supabase";
import { NotificationService } from "@/lib/notification-service";
import { canBrowseContent } from "@/lib/auth-utils";
import { notificationTranslations } from "@/utils/language";

interface NotificationDropdownProps {
  onToggle?: (isOpen: boolean) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onToggle,
}) => {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  // Check if user is approved to see notifications
  const isApproved = profile
    ? profile.accountType === "admin" || canBrowseContent(profile)
    : false;

  // Use single hook without autoRefresh to avoid conflicts
  const {
    notifications,
    unreadCount,
    loading,
    refresh,
    markAsRead,
    markAllAsRead,
    archiveNotification,
  } = useNotifications(isApproved && user?.id ? user.id : null, {
    limit: 5,
    autoRefresh: true,
  });

  // State for all notifications modal
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allHasMore, setAllHasMore] = useState(true);

  // Helper function to get translated text
  const t = (key: keyof typeof notificationTranslations) => {
    return notificationTranslations[key][language];
  };

  // Helper function for notification types
  const getNotificationType = (type: string) => {
    const typeKey =
      type as keyof typeof notificationTranslations.notificationTypes;
    return (
      notificationTranslations.notificationTypes[typeKey]?.[language] || type
    );
  };

  // Helper function for priority levels
  const getPriorityText = (priority: string) => {
    const priorityKey =
      priority as keyof typeof notificationTranslations.priority;
    return (
      notificationTranslations.priority[priorityKey]?.[language] || priority
    );
  };

  // Helper function for pluralization
  const getPlural = (count: number, singular: string, plural?: string) => {
    if (language === "Arabic") {
      // Arabic has complex pluralization rules
      if (count === 0) return "";
      if (count === 1) return "";
      if (count === 2) return "ان";
      if (count >= 3 && count <= 10) return "ات";
      return "اً";
    }
    return count === 1 ? "" : "s";
  };

  // Helper function for unread count message
  const getUnreadMessage = (count: number) => {
    const plural = getPlural(count, "notification");
    if (language === "Arabic") {
      return `لديك ${count} إشعار${plural} غير مقروء${plural}`;
    }
    return `You have ${count} unread notification${plural}`;
  };

  // Helper function for notification count
  const getNotificationCount = (count: number) => {
    const plural = getPlural(count, "notification");
    if (language === "Arabic") {
      return `${count} إشعار${plural}`;
    }
    return `${count} notification${plural}`;
  };

  // Refresh data when dropdown is opened
  useEffect(() => {
    if (isOpen && isApproved && user?.id) {
      refresh();
    }
  }, [isOpen, user?.id, isApproved]); // Added isApproved dependency

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    onToggle?.(newIsOpen);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setSelectedNotification(notification);
  };

  const handleShowAll = async () => {
    setShowAllModal(true);
    if (isApproved && user?.id) {
      setAllLoading(true);
      try {
        const allNotificationData =
          await NotificationService.getUserNotifications(user.id, {
            limit: 20,
            offset: 0,
          });
        setAllNotifications(allNotificationData);
        setAllHasMore(allNotificationData.length === 20);
      } catch (error) {
        console.error("Failed to fetch all notifications:", error);
      } finally {
        setAllLoading(false);
      }
    }
  };

  const loadMoreAll = async () => {
    if (!allHasMore || allLoading || !isApproved || !user?.id) return;

    setAllLoading(true);
    try {
      const moreNotifications = await NotificationService.getUserNotifications(
        user.id,
        {
          limit: 20,
          offset: allNotifications.length,
        }
      );
      setAllNotifications((prev) => [...prev, ...moreNotifications]);
      setAllHasMore(moreNotifications.length === 20);
    } catch (error) {
      console.error("Failed to load more notifications:", error);
    } finally {
      setAllLoading(false);
    }
  };

  const refreshAll = async () => {
    if (isApproved && user?.id) {
      setAllLoading(true);
      try {
        const allNotificationData =
          await NotificationService.getUserNotifications(user.id, {
            limit: 20,
            offset: 0,
          });
        setAllNotifications(allNotificationData);
        setAllHasMore(allNotificationData.length === 20);
      } catch (error) {
        console.error("Failed to refresh all notifications:", error);
      } finally {
        setAllLoading(false);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "newsletter":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "admin_action":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "connection_request":
        return <Users className="h-4 w-4 text-green-500" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "investment_interest":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "meeting_request":
        return <Calendar className="h-4 w-4 text-indigo-500" />;
      case "system_update":
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatNotificationTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const truncateContent = (content: string, maxLength: number = 80) => {
    return content.length > maxLength
      ? `${content.substring(0, maxLength)}...`
      : content;
  };

  if (!user || !isApproved) return null;

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          className="flex items-center gap-2 text-sm relative"
          disabled={loading}
        >
          <Bell className="h-4 w-4" />
          {loading ? t("loading") : t("notifications")}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[1.25rem]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed sm:absolute top-16 sm:top-full left-4 right-4 sm:left-auto sm:right-0 mt-2 w-auto sm:w-96 bg-background border rounded-lg shadow-xl z-50"
            >
              <div className="p-3 sm:p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base sm:text-lg">
                    {t("notifications")}
                  </h3>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs px-2 sm:px-3"
                      >
                        <span className="hidden sm:inline">
                          {t("markAllRead")}
                        </span>
                        <span className="sm:hidden">{t("markRead")}</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggle}
                      className="text-xs p-1 sm:p-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {getUnreadMessage(unreadCount)}
                  </p>
                )}
              </div>

              <ScrollArea className="max-h-80">
                <div className="p-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {t("noNotificationsYet")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <Card
                          key={notification.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            !notification.is_read
                              ? "bg-blue-50/50 border-blue-200 hover:bg-blue-100/70"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm truncate">
                                    {notification.title}
                                  </h4>
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {truncateContent(notification.content)}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatNotificationTime(
                                    notification.created_at
                                  )}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {notifications.length > 0 && (
                <div className="p-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowAll}
                    className="w-full"
                  >
                    {t("viewAllNotifications")}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog
        open={!!selectedNotification}
        onOpenChange={() => setSelectedNotification(null)}
      >
        <DialogContent className="max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {getNotificationIcon(selectedNotification.type)}
                  <div>
                    <DialogTitle className="text-xl">
                      {selectedNotification.title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      {formatNotificationTime(selectedNotification.created_at)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {selectedNotification.content}
                  </p>
                </div>

                {selectedNotification.action_url && (
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        window.open(selectedNotification.action_url, "_blank");
                      }}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {selectedNotification.action_label || t("takeAction")}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-4xl mx-2 sm:mx-auto max-h-[95vh] w-[calc(100vw-1rem)] sm:w-auto overflow-hidden">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg sm:text-2xl">
              {t("allNotificationsTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("allNotificationsDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 sm:mt-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 px-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {getNotificationCount(allNotifications.length)}
                </Badge>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {language === "Arabic"
                      ? `${unreadCount} غير مقروء${getPlural(
                          unreadCount,
                          "notification"
                        )}`
                      : `${unreadCount} unread`}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAll}
                disabled={allLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {t("refresh")}
              </Button>
            </div>

            <ScrollArea className="h-[60vh] sm:h-96">
              <div className="space-y-2">
                {allLoading ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                  </div>
                ) : allNotifications.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Bell className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-base sm:text-lg text-muted-foreground">
                      {t("noNotificationsYet")}
                    </p>
                  </div>
                ) : (
                  allNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        !notification.is_read
                          ? "bg-blue-50/50 border-blue-200 hover:bg-blue-100/70"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm sm:text-base line-clamp-2 leading-5">
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Badge
                                  variant="outline"
                                  className="text-xs hidden sm:inline-flex"
                                >
                                  {getNotificationType(notification.type)}
                                </Badge>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 line-clamp-3 leading-4">
                              {notification.content.substring(0, 150)}
                              {notification.content.length > 150 && "..."}
                            </p>
                            <div className="flex items-center justify-between mt-2.5 sm:mt-3 gap-2">
                              <span className="text-xs text-muted-foreground truncate">
                                {formatNotificationTime(
                                  notification.created_at
                                )}
                              </span>
                              <Badge
                                variant={
                                  notification.priority === "urgent"
                                    ? "destructive"
                                    : notification.priority === "high"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs flex-shrink-0"
                              >
                                {getPriorityText(notification.priority)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {allHasMore && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMoreAll}
                    disabled={allLoading}
                  >
                    {t("loadMore")}
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationDropdown;
