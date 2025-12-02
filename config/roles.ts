export type Role = "admin" | "moderateur" | "agent" | "superadmin";

export const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    moderateur: "Modérateur",
    agent: "Agent",
    superadmin: "Super Admin",
};

export const ROLE_COLORS: Record<string, string> = {
    admin: "bg-red-500/20 text-red-300 border-red-500/30",
    moderateur: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    agent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    superadmin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};
