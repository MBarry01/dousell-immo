export type Role = "admin" | "moderateur" | "agent" | "superadmin";

export const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    moderateur: "Modérateur",
    agent: "Agent",
    superadmin: "Super Admin",
};

export const ROLE_COLORS: Record<string, string> = {
    admin: "bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30",
    moderateur: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
    agent: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
    superadmin: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
};
