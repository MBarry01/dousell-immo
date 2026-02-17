"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  BellOff,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  CheckCheck,
  MessageSquare,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications, type Notification, type NotificationType } from "@/hooks/use-notifications";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/(vitrine)/notifications/actions";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type NotificationBellProps = {
  userId: string | null;
  className?: string;
};

const notificationIcons: Record<NotificationType, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  message: MessageSquare,
  maintenance: Wrench,
};

const notificationStyles: Record<NotificationType, string> = {
  info: "bg-blue-500/10 text-blue-400",
  success: "text-green-500 bg-green-50 dark:bg-green-900/10",
  warning: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/10",
  error: "text-red-500 bg-red-50 dark:bg-red-900/10",
  message: "text-blue-500 bg-blue-50 dark:bg-blue-900/10",
  maintenance: "text-orange-500 bg-orange-50 dark:bg-orange-900/10",
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export function NotificationBell({ userId, className }: NotificationBellProps) {
  const router = useRouter();
  const { notifications, unreadCount, loading, refetch } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.resource_path) {
      router.push(notification.resource_path);
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead();
    if (result.error) {
      toast.error("Erreur", { description: result.error });
    } else {
      toast.success("Toutes les notifications ont été marquées comme lues");
      setTimeout(() => refetch(), 500);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const result = formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
      });
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

  const bellButton = (
    <button
      className={cn(
        "relative flex items-center justify-center rounded-full p-2.5 transition-all active:scale-95 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 text-foreground group",
        className
      )}
      aria-label="Notifications"
      onClick={() => {
        if (!isOpen) refetch();
        if (isMobile) setIsOpen(true);
      }}
    >
      <Bell className="h-5 w-5 transition-colors group-hover:text-inherit" />
      {unreadCount > 0 && (
        <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );

  const notificationList = (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <Button
          variant="ghost"
          size="sm"
          disabled={unreadCount === 0}
          className="h-auto gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:text-muted-foreground/50"
          onClick={handleMarkAllAsRead}
        >
          <CheckCheck className="h-3 w-3" />
          Tout marquer
        </Button>
      </div>

      <ScrollArea className={cn("w-full", isMobile ? "h-[60vh]" : "h-[320px] rounded-b-2xl")}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <BellOff className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Vous êtes à jour</p>
            <p className="text-xs text-muted-foreground">Revenez plus tard pour de nouvelles alertes.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
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
                      "flex gap-4 p-4 transition-colors hover:bg-muted/50 cursor-pointer relative",
                      !notification.is_read && "bg-muted/30"
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
                        <p className="text-sm font-medium leading-tight text-foreground">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
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
    </>
  );

  // Mobile : Sheet bottom
  if (isMobile) {
    return (
      <>
        {bellButton}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl bg-background p-0 pb-safe"
            hideClose
          >
            <SheetTitle className="sr-only">Notifications</SheetTitle>
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            {notificationList}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop : Popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {bellButton}
      </PopoverTrigger>
      <PopoverContent
        className="w-96 max-w-[90vw] p-0 rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl z-[100]"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col">
          {notificationList}
        </div>
      </PopoverContent>
    </Popover>
  );
}
