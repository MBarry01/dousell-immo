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
import { useRouter, usePathname } from "next/navigation";
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
  info: "bg-white/5 text-[#F4C430]",
  success: "bg-white/5 text-[#F4C430]",
  warning: "bg-white/5 text-[#F4C430]",
  error: "text-red-500 bg-red-500/10",
  message: "bg-white/5 text-[#F4C430]",
  maintenance: "bg-white/5 text-[#F4C430]",
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
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

  const pathname = usePathname();
  const isWorkspace = pathname?.startsWith("/gestion") || pathname?.startsWith("/admin") || pathname?.startsWith("/compte") || pathname?.startsWith("/locataire");

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

  // Render a static bell during SSR / before hydration to avoid mismatch
  // (Radix Popover injects aria-controls with generated IDs that differ server vs client)
  if (isMobile === null) {
    return (
      <button
        className={cn(
          "relative flex items-center justify-center rounded-full p-2.5 transition-all active:scale-95 hover:scale-110 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring/20 text-foreground group",
          className
        )}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 transition-colors group-hover:text-inherit" />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  const bellButton = (
    <button
      className={cn(
        "relative flex items-center justify-center rounded-full p-2.5 transition-all active:scale-95 hover:scale-110 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring/20 text-foreground group",
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
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
        <h3 className="text-sm font-bold text-foreground">Notifications</h3>
        <Button
          variant="ghost"
          size="sm"
          disabled={unreadCount === 0}
          className="h-auto gap-1.5 px-2 py-1 text-xs font-medium text-[#F4C430] hover:text-[#F4C430]/80 hover:bg-[#F4C430]/10 disabled:cursor-not-allowed disabled:opacity-30 rounded-lg transition-all"
          onClick={handleMarkAllAsRead}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Tout marquer
        </Button>
      </div>

      <ScrollArea className={cn("w-full transition-all", isMobile ? "h-[calc(96dvh-120px)]" : "h-[320px] rounded-b-2xl")}>
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
                const Icon = notificationIcons[notification.type as NotificationType] || Info;
                const iconClasses = notificationStyles[notification.type as NotificationType] || notificationStyles.info;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={cn(
                      "flex gap-4 p-4 transition-all hover:bg-white/[0.08] cursor-pointer relative",
                      !notification.is_read ? "bg-white/[0.03]" : "bg-transparent"
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
                      <p className="text-[11px] text-muted-foreground/60 font-medium italic">
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
            className={cn(
              "p-0 pb-safe overflow-hidden border-none bg-transparent shadow-none z-[150]",
              isMobile ? "h-[96dvh]" : "h-auto"
            )}
            hideClose
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.y > 150 || info.velocity.y > 500) {
                  setIsOpen(false);
                }
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "flex flex-col h-full w-full rounded-t-[32px] border-t border-white/10 shadow-2xl relative",
                !isWorkspace ? "dark bg-[#05080c]/95 backdrop-blur-2xl text-white" : "bg-background/95 backdrop-blur-2xl"
              )}
            >
              <SheetTitle className="sr-only">Notifications</SheetTitle>
              {/* Drag handle area */}
              <div className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing group">
                <div className="h-1.5 w-12 rounded-full bg-white/20 transition-colors group-hover:bg-white/40" />
              </div>
              {notificationList}
            </motion.div>
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
        className={cn(
          "w-96 max-w-[90vw] p-0 rounded-2xl shadow-2xl z-[100] border-white/10 bg-black/60 backdrop-blur-2xl ring-1 ring-white/5",
          !isWorkspace && "dark bg-black/60"
        )}
        align="end"
        sideOffset={12}
      >
        <div className="flex flex-col">
          {notificationList}
        </div>
      </PopoverContent>
    </Popover>
  );
}
