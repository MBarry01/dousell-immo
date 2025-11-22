"use client";

import { useState } from "react";
import { Bell, Info, CheckCircle, AlertTriangle, XCircle, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications, type Notification } from "@/hooks/use-notifications";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/notifications/actions";
import { toast } from "sonner";

type NotificationBellProps = {
  userId: string | null;
};

const notificationIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const notificationColors = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
};

export function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter();
  const { notifications, unreadCount, loading, error, refetch } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);


  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lu si ce n'est pas déjà fait
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      // Le hook useNotifications mettra à jour automatiquement via Realtime
    }

    // Fermer le popover
    setIsOpen(false);

    // Rediriger vers le chemin de ressource si disponible
    if (notification.resource_path) {
      router.push(notification.resource_path);
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead();
    if (result.error) {
      toast.error("Erreur", {
        description: result.error,
      });
    } else {
      toast.success("Toutes les notifications ont été marquées comme lues");
      // Forcer un refetch car Realtime peut ne pas déclencher un UPDATE pour chaque notification
      // quand on marque toutes les notifications comme lues en masse
      setTimeout(() => {
        refetch();
      }, 500);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const result = formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
      });
      // Traduire les termes de base en français
      return result
        .replace("about ", "")
        .replace("less than a minute ago", "à l'instant")
        .replace("minute ago", "minute")
        .replace("minutes ago", "minutes")
        .replace("hour ago", "heure")
        .replace("hours ago", "heures")
        .replace("day ago", "jour")
        .replace("days ago", "jours")
        .replace("month ago", "mois")
        .replace("months ago", "mois")
        .replace("year ago", "an")
        .replace("years ago", "ans")
        .replace(" ago", "");
    } catch {
      return "Récemment";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center rounded-full p-2.5 transition-all active:scale-95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Notifications"
          onClick={() => {
            // Forcer un refetch quand on ouvre le popover
            if (!isOpen) {
              refetch();
            }
          }}
        >
          <Bell className="h-5 w-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[90vw] max-w-sm p-0 md:w-96 rounded-xl border border-white/10 bg-[#05080c] text-white shadow-xl z-[100]"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleMarkAllAsRead}
              >
                <Check className="mr-1 h-3 w-3" />
                Tout marquer comme lu
              </Button>
            )}
          </div>

          {/* Liste des notifications */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Bell className="mb-2 h-8 w-8 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Aucune nouvelle notification.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification, index) => {
                    const Icon = notificationIcons[notification.type];
                    const iconColor = notificationColors[notification.type];

                    return (
                      <motion.button
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                          delay: index * 0.03,
                        }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full px-4 py-3 text-left transition-colors hover:bg-accent/50",
                          !notification.is_read && "bg-accent/30"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 20,
                              delay: index * 0.03 + 0.1,
                            }}
                            className={cn(
                              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted",
                              iconColor
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={cn(
                                  "text-sm font-semibold",
                                  !notification.is_read && "font-bold"
                                )}
                              >
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 15,
                                    delay: index * 0.03 + 0.15,
                                  }}
                                  className="h-2 w-2 shrink-0 rounded-full bg-primary"
                                />
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

