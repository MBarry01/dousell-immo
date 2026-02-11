import { stripe } from "@/lib/subscription/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin"; // Utilise la version Admin !

/**
 * Signale à Stripe qu'une transaction Mobile Money a eu lieu.
 * Stripe ajoutera les frais (ex: 200 FCFA) à la prochaine facture d'abonnement de l'agence.
 * 
 * Cette fonction utilise le client Admin pour contourner la RLS car elle est généralement appelée
 * par un webhook ou une tâche de fond sans utilisateur connecté.
 */
export async function reportMobileMoneyUsage(teamId: string, quantity: number = 1) {
    try {
        // 1. Récupérer l'ID d'abonnement via Supabase Admin (Bypass RLS)
        const { data: team, error } = await supabaseAdmin
            .from('teams')
            .select('stripe_subscription_id')
            .eq('id', teamId)
            .single();

        if (error || !team || !team.stripe_subscription_id) {
            console.warn(`[Usage Warning] Agence ${teamId} introuvable ou sans abonnement.`);
            return;
        }

        // 2. ID du prix "Metered" (Frais Mobile Money) défini dans ton .env
        const meteredPriceId = process.env.STRIPE_METERED_PRICE_ID;
        if (!meteredPriceId) {
            console.error("STRIPE_METERED_PRICE_ID manquant dans .env");
            return;
        }

        // 3. Récupérer l'abonnement Stripe
        const subscription = await stripe.subscriptions.retrieve(team.stripe_subscription_id);

        // 4. Trouver l'item correspondant au prix "Metered"
        let subscriptionItemId = subscription.items.data.find(
            (item) => item.price.id === meteredPriceId
        )?.id;

        // 5. Si l'item n'existe pas encore dans l'abonnement, on l'ajoute
        if (!subscriptionItemId) {
            try {
                const updatedSubscriptionItem = await stripe.subscriptionItems.create({
                    subscription: team.stripe_subscription_id,
                    price: meteredPriceId,
                });
                subscriptionItemId = updatedSubscriptionItem.id;
            } catch (addError) {
                console.error(`[Usage Error] Impossible d'ajouter l'item metered pour ${teamId}:`, addError);
                return;
            }
        }

        // 6. Enregistrer l'usage (Incrémenter le compteur)
        await (stripe.subscriptionItems as any).createUsageRecord(
            subscriptionItemId,
            {
                quantity: quantity,
                timestamp: Math.floor(Date.now() / 1000),
                action: 'increment',
            }
        );

        console.log(`[Usage Success] +${quantity} transaction(s) facturée(s) à l'agence ${teamId}`);

    } catch (error) {
        console.error(`[Usage Error] Échec du report pour ${teamId}:`, error);
        // Note: On ne bloque pas le user, mais on log l'erreur pour la régularisation manuelle si besoin.
    }
}
