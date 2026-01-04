import { createOnsiteInvoice, chargeOnsiteInvoice } from "../lib/paydunya";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testOPRFlow() {
    console.log("🚀 Démarrage du test PayDunya OPR (Onsite Payment)...");

    try {
        // 1. Initialisation
        console.log("\n1️⃣  Création de la facture OPR...");
        const invoice = {
            invoice: {
                items: [
                    {
                        name: "Test OPR Service",
                        quantity: 1,
                        unit_price: 100,
                        total_price: 100,
                        description: "Test de paiement sans redirection",
                    },
                ],
                total_amount: 100,
                description: "Test Script OPR",
            },
            store: {
                name: "Test Store",
            },
            actions: {
                cancel_url: "http://localhost:3000/cancel",
                return_url: "http://localhost:3000/return",
            },
        };

        const phone = "770000000"; // Numéro de test PayDunya Sandbox
        console.log(`   📞 Numéro utilisé: ${phone}`);

        const createResult = await createOnsiteInvoice(invoice, phone);
        console.log("✅ Facture créée avec succès !");
        console.log(`   Token OPR: ${createResult.token}`);
        console.log(`   Message: ${createResult.response_text}`);

        // 2. Confirmation (Simulation)
        // En sandbox, le code OTP est souvent '123456' ou spécifique
        // Il faut que l'utilisateur le saisisse manuellement pour tester vraiment,
        // mais ici on va tenter avec un code fictif pour voir si l'appel part bien.

        console.log("\n2️⃣  Tentative de confirmation (avec code fictif 123456)...");

        try {
            const chargeResult = await chargeOnsiteInvoice(createResult.token, "123456");
            console.log("✅ Confirmation réussie !");
            console.log("   Reçu:", chargeResult.invoice_data?.receipt_url);
        } catch (chargeError) {
            console.log("⚠️  Confirmation échouée (Normal si code incorrect):");
            if (chargeError instanceof Error) {
                console.log("   " + chargeError.message);
            }
        }

    } catch (error) {
        console.error("\n❌ Erreur lors du test:");
        console.error(error);
    }
}

testOPRFlow();
