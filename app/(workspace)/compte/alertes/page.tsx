"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ArrowLeft,
  Settings,
  Plus,
  Search,
  X,
  MapPin,
  DollarSign,
  Home,
  Filter,
  Trash2,
  Check,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkspaceSwitch as Switch } from "@/components/ui/workspace-switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationBell } from "@/components/layout/notification-bell";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { deleteSearchAlert, updateSearchAlert } from "./actions";

interface SearchAlert {
  id: string;
  user_id: string;
  name: string;
  filters: {
    category?: "vente" | "location";
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    rooms?: number;
    bedrooms?: number;
    type?: "Appartement" | "Maison" | "Studio";
  };
  is_active: boolean;
  created_at: string;
}

interface NotificationPreferences {
  new_properties: boolean;
  property_updates: boolean;
  price_drops: boolean;
  matching_alerts: boolean;
}

export default function AlertesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notifications, unreadCount, loading: notificationsLoading } = useNotifications(user?.id || null);
  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    new_properties: true,
    property_updates: true,
    price_drops: true,
    matching_alerts: true,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    loadAlerts();
    loadPreferences();
  }, [user, authLoading, router]);

  const loadAlerts = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("search_alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Si la table n'existe pas, utiliser un tableau vide (silencieux)
      if (error) {
        if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
          setAlerts([]);
          return;
        }
        // Erreur de permission ou autre - utiliser un tableau vide (silencieux)
        setAlerts([]);
        return;
      }

      setAlerts(data || []);
    } catch (error) {
      // Erreur silencieuse - utiliser un tableau vide
      // Ne pas logger car c'est normal si la table n'existe pas
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { getNotificationPreferences } = await import("./actions");
      const result = await getNotificationPreferences();

      if (result.error) {
        // Erreur silencieuse - utiliser les valeurs par défaut
        return;
      }

      if (result.data) {
        setPreferences(result.data);
      }
      // Sinon, les valeurs par défaut sont déjà définies
    } catch (error) {
      // Erreur silencieuse - utiliser les valeurs par défaut
      // Ne pas logger car c'est normal si la table n'existe pas
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    if (!user) return;

    try {
      const { saveNotificationPreferences } = await import("./actions");
      const result = await saveNotificationPreferences(newPreferences);

      if (result.error) {
        toast.error("Erreur", {
          description: result.error,
        });
        return;
      }

      setPreferences(newPreferences);
      toast.success("Préférences mises à jour");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Erreur lors de la sauvegarde des préférences");
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    savePreferences(newPreferences);
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const result = await deleteSearchAlert(alertId);

      if (result.error) {
        toast.error("Erreur", {
          description: result.error,
        });
        return;
      }

      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success("Alerte supprimée");
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Erreur lors de la suppression de l'alerte");
    }
  };

  const toggleAlert = async (alert: SearchAlert) => {
    try {
      const result = await updateSearchAlert(alert.id, {
        is_active: !alert.is_active,
      });

      if (result.error) {
        toast.error("Erreur", {
          description: result.error,
        });
        return;
      }

      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, is_active: !a.is_active } : a))
      );
      toast.success(`Alerte ${!alert.is_active ? "activée" : "désactivée"}`);
    } catch (error) {
      console.error("Error toggling alert:", error);
      toast.error("Erreur lors de la modification de l'alerte");
    }
  };

  const formatAlertFilters = (filters: SearchAlert["filters"]) => {
    const parts: string[] = [];
    if (filters.category) parts.push(filters.category === "vente" ? "Achat" : "Location");
    if (filters.city) parts.push(filters.city);
    if (filters.minPrice || filters.maxPrice) {
      const priceRange = [filters.minPrice, filters.maxPrice].filter(Boolean).join(" - ");
      parts.push(`${priceRange} FCFA`);
    }
    if (filters.type) parts.push(filters.type);
    if (filters.rooms) parts.push(`${filters.rooms} pièces`);
    if (filters.bedrooms) parts.push(`${filters.bedrooms} chambres`);
    return parts.join(" • ") || "Aucun filtre";
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

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 py-6">
      <FadeIn>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/compte">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mes Alertes</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gérez vos notifications et alertes de recherche
              </p>
            </div>
          </div>
        </div>

        {/* Notifications récentes */}
        <Card className="border-border bg-card backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Notifications récentes</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Aucune nouvelle notification"}
                </CardDescription>
              </div>
              {notifications.length > 0 && (
                <Link href="/compte/alertes#notifications">
                  <Button
                    size="sm"
                    className="bg-[#0F172A] text-white hover:bg-[#0F172A]/90 dark:bg-[#F4C430] dark:text-black dark:hover:bg-[#F4C430]/90"
                  >
                    Voir tout
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground">Aucune notification</p>
                <p className="text-sm text-muted-foreground/60 mt-2">
                  Vous serez notifié quand de nouveaux biens correspondent à vos critères
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border p-3 transition-colors ${!notification.is_read
                      ? "border-primary/20 bg-primary/5"
                      : "border-border bg-card/50 opacity-60"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary ml-3 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertes de recherche */}
        <Card className="border-border bg-card backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Alertes de recherche</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Créez des alertes pour être notifié des nouveaux biens correspondant à vos critères
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  router.push("/recherche?alert=create");
                }}
                className="bg-[#0F172A] text-white hover:bg-[#0F172A]/90 dark:bg-[#F4C430] dark:text-black dark:hover:bg-[#F4C430]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle alerte
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground">Aucune alerte de recherche</p>
                <p className="text-sm text-muted-foreground/60 mt-2">
                  Créez une alerte pour être notifié automatiquement des nouveaux biens
                </p>
                <Button
                  onClick={() => router.push("/recherche?alert=create")}
                  className="mt-4 bg-[#0F172A] text-white hover:bg-[#0F172A]/90 dark:bg-[#F4C430] dark:text-black dark:hover:bg-[#F4C430]/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer ma première alerte
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-border bg-card/50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-foreground">{alert.name}</h4>
                          <Badge
                            variant={alert.is_active ? "default" : "secondary"}
                            className={alert.is_active ? "bg-amber-500 text-black dark:bg-amber-500 dark:text-black" : "bg-muted text-muted-foreground"}
                          >
                            {alert.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Filter className="h-4 w-4" />
                          <span>{formatAlertFilters(alert.filters)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Créée {formatTimeAgo(alert.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleAlert(alert)}
                          className="text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                          {alert.is_active ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAlert(alert.id)}
                          className="text-red-500/60 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paramètres d'alertes */}
        <Card className="border-border bg-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Paramètres de notifications
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Configurez vos préférences de notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Nouveaux biens</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Recevez une notification pour chaque nouveau bien publié
                </p>
              </div>
              <Switch
                checked={preferences.new_properties}
                onCheckedChange={() => togglePreference("new_properties")}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Mises à jour de vos annonces</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Alertes sur l'état de vos biens déposés (approuvé, refusé, etc.)
                </p>
              </div>
              <Switch
                checked={preferences.property_updates}
                onCheckedChange={() => togglePreference("property_updates")}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Baisse de prix</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Soyez notifié quand un bien de vos favoris baisse de prix
                </p>
              </div>
              <Switch
                checked={preferences.price_drops}
                onCheckedChange={() => togglePreference("price_drops")}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Alertes de recherche</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Notifications quand de nouveaux biens correspondent à vos alertes de recherche
                </p>
              </div>
              <Switch
                checked={preferences.matching_alerts}
                onCheckedChange={() => togglePreference("matching_alerts")}
              />
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
