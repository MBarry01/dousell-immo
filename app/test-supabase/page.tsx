"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type TestResult = {
  name: string;
  status: "loading" | "success" | "error";
  message: string;
};

export default function TestSupabasePage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const testResults: TestResult[] = [];

      // Test 1: Vérifier les variables d'environnement
      testResults.push({
        name: "Variables d'environnement",
        status: "loading",
        message: "Vérification...",
      });
      setResults([...testResults]);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        testResults[0] = {
          name: "Variables d'environnement",
          status: "error",
          message: `❌ Variables manquantes: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`,
        };
        setResults([...testResults]);
        setLoading(false);
        return;
      }

      testResults[0] = {
        name: "Variables d'environnement",
        status: "success",
        message: `✅ URL: ${supabaseUrl.substring(0, 30)}... | KEY: ${supabaseKey.substring(0, 20)}...`,
      };
      setResults([...testResults]);

      // Test 2: Créer le client
      testResults.push({
        name: "Création du client Supabase",
        status: "loading",
        message: "Création...",
      });
      setResults([...testResults]);

      let supabase;
      try {
        supabase = createClient();
        testResults[1] = {
          name: "Création du client Supabase",
          status: "success",
          message: "✅ Client créé avec succès",
        };
      } catch (error: any) {
        testResults[1] = {
          name: "Création du client Supabase",
          status: "error",
          message: `❌ Erreur: ${error.message}`,
        };
        setResults([...testResults]);
        setLoading(false);
        return;
      }
      setResults([...testResults]);

      // Test 3: Tester la connexion à la table properties
      testResults.push({
        name: "Connexion à la table 'properties'",
        status: "loading",
        message: "Test en cours...",
      });
      setResults([...testResults]);

      try {
        const { data, error } = await supabase.from("properties").select("id").limit(1);

        if (error) {
          testResults[2] = {
            name: "Connexion à la table 'properties'",
            status: "error",
            message: `❌ Erreur: ${error.message} (Code: ${error.code})`,
          };
        } else {
          testResults[2] = {
            name: "Connexion à la table 'properties'",
            status: "success",
            message: `✅ Table accessible (${data?.length || 0} résultat(s))`,
          };
        }
      } catch (error: any) {
        testResults[2] = {
          name: "Connexion à la table 'properties'",
          status: "error",
          message: `❌ Erreur: ${error.message}`,
        };
      }
      setResults([...testResults]);

      // Test 4: Tester l'authentification
      testResults.push({
        name: "Service d'authentification",
        status: "loading",
        message: "Test en cours...",
      });
      setResults([...testResults]);

      try {
        const { data: session, error } = await supabase.auth.getSession();

        if (error) {
          testResults[3] = {
            name: "Service d'authentification",
            status: "error",
            message: `❌ Erreur: ${error.message}`,
          };
        } else {
          testResults[3] = {
            name: "Service d'authentification",
            status: "success",
            message: session?.session
              ? "✅ Service opérationnel (Session active)"
              : "✅ Service opérationnel (Aucune session)",
          };
        }
      } catch (error: any) {
        testResults[3] = {
          name: "Service d'authentification",
          status: "error",
          message: `❌ Erreur: ${error.message}`,
        };
      }
      setResults([...testResults]);

      // Test 5: Tester le storage
      testResults.push({
        name: "Storage 'properties'",
        status: "loading",
        message: "Test en cours...",
      });
      setResults([...testResults]);

      try {
        // Méthode principale: Essayer d'accéder directement au bucket
        // C'est plus fiable que listBuckets() qui peut être bloqué par RLS
        const { data: testFiles, error: accessError } = await supabase.storage
          .from("properties")
          .list("", { limit: 1, sortBy: { column: "name", order: "asc" } });

        if (accessError) {
          // Si l'accès échoue, essayons listBuckets() pour voir si le bucket existe
          const { data: buckets, error: listError } = await supabase.storage.listBuckets();

          if (listError) {
            // Les deux méthodes ont échoué
            if (accessError.message.includes("not found") || accessError.message.includes("does not exist")) {
              testResults[4] = {
                name: "Storage 'properties'",
                status: "error",
                message: `⚠️ Bucket 'properties' non trouvé. Créez-le dans Supabase Dashboard → Storage → New bucket (nom: "properties", public: ✅)`,
              };
            } else {
              testResults[4] = {
                name: "Storage 'properties'",
                status: "error",
                message: `❌ Erreur d'accès: ${accessError.message}. Vérifiez les politiques RLS pour storage.objects.`,
              };
            }
          } else {
            // listBuckets() a fonctionné, vérifions si le bucket existe
            const propertiesBucket = buckets?.find((b) => b.name === "properties");
            if (propertiesBucket) {
              testResults[4] = {
                name: "Storage 'properties'",
                status: "error",
                message: `⚠️ Bucket existe mais accès refusé: ${accessError.message}. Vérifiez les politiques RLS pour storage.objects (SELECT doit être autorisé).`,
              };
            } else {
              testResults[4] = {
                name: "Storage 'properties'",
                status: "error",
                message: `⚠️ Bucket 'properties' non trouvé. Créez-le dans Supabase Dashboard → Storage → New bucket (nom: "properties", public: ✅)`,
              };
            }
          }
        } else {
          // L'accès a réussi ! Le bucket existe et est accessible
          testResults[4] = {
            name: "Storage 'properties'",
            status: "success",
            message: `✅ Bucket 'properties' accessible (${testFiles?.length || 0} fichier(s))`,
          };
        }
      } catch (error: any) {
        testResults[4] = {
          name: "Storage 'properties'",
          status: "error",
          message: `❌ Erreur: ${error.message}`,
        };
      }
      setResults([...testResults]);

      setLoading(false);
    };

    runTests();
  }, []);

  const allSuccess = results.every((r) => r.status === "success");
  const hasErrors = results.some((r) => r.status === "error");

  return (
    <div className="min-h-screen bg-background p-6 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Test de connexion Supabase</h1>
          <p className="mt-2 text-white/60">
            Vérification de la configuration et de la connexion à Supabase
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
            <p className="mt-4 text-white/70">Tests en cours...</p>
          </div>
        )}

        {!loading && (
          <>
            <div
              className={`rounded-2xl border p-6 ${
                allSuccess
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : hasErrors
                    ? "border-red-500/20 bg-red-500/10"
                    : "border-amber-500/20 bg-amber-500/10"
              }`}
            >
              <h2 className="mb-4 text-xl font-semibold">
                {allSuccess
                  ? "✅ Tous les tests sont passés !"
                  : hasErrors
                    ? "❌ Des erreurs ont été détectées"
                    : "⚠️ Certains tests ont échoué"}
              </h2>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{result.name}</h3>
                        <p className="mt-1 text-sm text-white/70">{result.message}</p>
                      </div>
                      <div className="ml-4">
                        {result.status === "loading" && (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                        )}
                        {result.status === "success" && (
                          <span className="text-2xl">✅</span>
                        )}
                        {result.status === "error" && (
                          <span className="text-2xl">❌</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {hasErrors && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
                <h3 className="mb-2 font-semibold text-red-300">
                  🔧 Comment corriger les erreurs ?
                </h3>
                <ul className="list-disc space-y-2 pl-5 text-sm text-white/80">
                  {results.some((r) => r.name === "Storage 'properties'" && r.status === "error") && (
                    <li className="font-semibold text-red-200">
                      📦 <strong>Bucket Storage manquant</strong> : Allez dans Supabase Dashboard → Storage → Créez un bucket nommé "properties" (public). Voir{" "}
                      <code className="rounded bg-background/10 px-1">docs/CREER-BUCKET-STORAGE.md</code>
                    </li>
                  )}
                  {results.some((r) => r.name === "Variables d'environnement" && r.status === "error") && (
                    <>
                      <li>
                        Vérifiez que le fichier <code className="rounded bg-background/10 px-1">.env.local</code> existe
                        à la racine du projet
                      </li>
                      <li>
                        Vérifiez que <code className="rounded bg-background/10 px-1">NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
                        <code className="rounded bg-background/10 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> sont
                        définis
                      </li>
                      <li>
                        Redémarrez le serveur de développement après avoir modifié{" "}
                        <code className="rounded bg-background/10 px-1">.env.local</code>
                      </li>
                    </>
                  )}
                  {results.some((r) => r.name.includes("table") && r.status === "error") && (
                    <li>
                      Vérifiez que la table <code className="rounded bg-background/10 px-1">properties</code> existe dans Supabase (Table Editor)
                    </li>
                  )}
                  <li>
                    Vérifiez que votre projet Supabase est actif et que les URLs sont correctes
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

