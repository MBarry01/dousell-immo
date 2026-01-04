"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  CheckCheck,
} from "lucide-react";
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
import { useNotifications, type Notification, type NotificationType } from "@/hooks/use-notifications";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/(vitrine)/notifications/actions";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type NotificationBellProps = {
  userId: string | null;
};

const notificationIcons: Record<NotificationType, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const notificationStyles: Record<NotificationType, string> = {
  info: "bg-blue-500/10 text-blue-400",
  success: "bg-green-500/10 text-green-400",
  warning: "bg-yellow-500/10 text-yellow-400",
  error: "bg-red-500/10 text-red-400",
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
        className="w-96 max-w-[90vw] p-0 rounded-2xl border border-white/10 bg-[#05080c] text-white shadow-2xl z-[100]"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              disabled={unreadCount === 0}
              className="h-auto gap-1 px-2 py-1 text-xs text-white/70 hover:text-white disabled:cursor-not-allowed disabled:text-white/30"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3" />
              Tout marquer
            </Button>
          </div>

          <ScrollArea className="h-[320px] w-full rounded-b-2xl">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <BellOff className="mb-3 h-8 w-8 text-white/40" />
                <p className="text-sm font-medium text-white">Vous êtes à jour</p>
                <p className="text-xs text-white/50">Revenez plus tard pour de nouvelles alertes.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification) => {
                    const Icon = notificationIcons[notification.type];
                    const iconClasses = notificationStyles[notification.type];

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className={cn(
                          "flex gap-4 p-4 transition-colors hover:bg-white/5 cursor-pointer relative border-b border-white/5 last:border-b-0",
                          !notification.is_read && "bg-white/5"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div
                          className={cn(
                            "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                            iconClasses
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium leading-tight text-white">
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-white/70 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-white/40">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

