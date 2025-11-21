/**
 * Script de diagnostic pour les notifications
 * 
 * Usage: npx tsx scripts/test-notifications.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Charger les variables d'environnement
dotenv.config({ path: join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || "barrymohamadou98@gmail.com";

async function testNotifications() {
  console.log("🔍 Diagnostic des notifications\n");

  // 1. Vérifier les variables d'environnement
  console.log("1️⃣ Vérification des variables d'environnement:");
  console.log("   - NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Défini" : "❌ Manquant");
  console.log("   - NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Défini" : "❌ Manquant");
  console.log("   - SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceRoleKey ? "✅ Défini" : "⚠️ Non défini (optionnel)");
  console.log("   - ADMIN_EMAIL:", adminEmail);
  console.log("   - NEXT_PUBLIC_ADMIN_ID:", process.env.NEXT_PUBLIC_ADMIN_ID || "⚠️ Non défini (optionnel)");
  console.log("");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Variables d'environnement manquantes. Arrêt du diagnostic.");
    process.exit(1);
  }

  // 2. Vérifier la connexion Supabase
  console.log("2️⃣ Test de connexion Supabase:");
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: healthCheck, error: healthError } = await supabase.from("properties").select("id").limit(1);
  
  if (healthError) {
    console.error("   ❌ Erreur de connexion:", healthError.message);
  } else {
    console.log("   ✅ Connexion Supabase OK");
  }
  console.log("");

  // 3. Vérifier si la table notifications existe
  console.log("3️⃣ Vérification de la table notifications:");
  const { data: notifications, error: notificationsError } = await supabase
    .from("notifications")
    .select("id")
    .limit(1);

  if (notificationsError) {
    if (notificationsError.code === "PGRST116" || notificationsError.message?.includes("does not exist")) {
      console.error("   ❌ La table 'notifications' n'existe pas !");
      console.error("   📝 Action requise: Appliquez la migration SQL:");
      console.error("      supabase/migrations/20250128_create_notifications.sql");
    } else {
      console.error("   ❌ Erreur:", notificationsError.message);
    }
  } else {
    console.log("   ✅ Table 'notifications' existe");
  }
  console.log("");

  // 4. Vérifier la fonction get_admin_user_id
  console.log("4️⃣ Vérification de la fonction get_admin_user_id:");
  const { data: adminId, error: rpcError } = await supabase.rpc("get_admin_user_id", {
    admin_email: adminEmail,
  });

  if (rpcError) {
    if (rpcError.code === "42883" || rpcError.message?.includes("does not exist")) {
      console.error("   ❌ La fonction 'get_admin_user_id' n'existe pas !");
      console.error("   📝 Action requise: Appliquez la migration SQL:");
      console.error("      supabase/migrations/20250128_get_admin_user_id.sql");
    } else {
      console.error("   ❌ Erreur:", rpcError.message);
    }
  } else if (adminId) {
    console.log("   ✅ Fonction existe et retourne l'ID:", adminId);
  } else {
    console.warn("   ⚠️ Fonction existe mais aucun admin trouvé avec l'email:", adminEmail);
  }
  console.log("");

  // 5. Chercher l'admin avec service role (si disponible)
  if (supabaseServiceRoleKey) {
    console.log("5️⃣ Recherche de l'admin avec service role:");
    try {
      const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
      const { data: adminUsers, error: userError } = await serviceClient.auth.admin.listUsers();
      
      if (userError) {
        console.error("   ❌ Erreur:", userError.message);
      } else if (adminUsers) {
        const admin = adminUsers.users.find(
          (user) => user.email?.toLowerCase() === adminEmail.toLowerCase()
        );
        if (admin) {
          console.log("   ✅ Admin trouvé:", admin.id);
          console.log("   💡 Vous pouvez ajouter dans .env.local:");
          console.log(`      NEXT_PUBLIC_ADMIN_ID=${admin.id}`);
        } else {
          console.warn("   ⚠️ Aucun admin trouvé avec l'email:", adminEmail);
          console.log("   📋 Utilisateurs disponibles:");
          adminUsers.users.slice(0, 5).forEach((user) => {
            console.log(`      - ${user.email} (${user.id})`);
          });
        }
      }
    } catch (error) {
      console.error("   ❌ Erreur:", error instanceof Error ? error.message : String(error));
    }
    console.log("");
  }

  // 6. Vérifier Resend
  console.log("6️⃣ Vérification de Resend:");
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    console.log("   ✅ RESEND_API_KEY est défini");
  } else {
    console.warn("   ⚠️ RESEND_API_KEY n'est pas défini - Les emails ne seront pas envoyés");
    console.log("   📝 Pour activer les emails, ajoutez dans .env.local:");
    console.log("      RESEND_API_KEY=votre-clé-resend");
  }
  console.log("");

  // 7. Résumé
  console.log("📋 Résumé:");
  console.log("   - Table notifications:", notificationsError ? "❌" : "✅");
  console.log("   - Fonction get_admin_user_id:", rpcError ? "❌" : "✅");
  console.log("   - Resend configuré:", resendKey ? "✅" : "⚠️");
  console.log("");
  console.log("💡 Prochaines étapes:");
  if (notificationsError) {
    console.log("   1. Appliquez la migration: supabase/migrations/20250128_create_notifications.sql");
  }
  if (rpcError) {
    console.log("   2. Appliquez la migration: supabase/migrations/20250128_get_admin_user_id.sql");
  }
  if (!resendKey) {
    console.log("   3. Configurez RESEND_API_KEY pour activer les emails");
  }
  if (supabaseServiceRoleKey && !process.env.NEXT_PUBLIC_ADMIN_ID) {
    console.log("   4. (Optionnel) Ajoutez NEXT_PUBLIC_ADMIN_ID pour améliorer les performances");
  }
}

testNotifications().catch(console.error);

