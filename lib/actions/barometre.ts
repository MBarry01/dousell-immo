import { supabase } from '@/lib/supabase';

export interface BarometerCityData {
    city: string;
    type: string;
    transaction: 'vente' | 'location';
    avgPrice: number;
    avgSurface: number;
    avgPricePerSqm: number;
    count: number;
    minPrice: number;
    maxPrice: number;
}

export async function getBarometerData(): Promise<BarometerCityData[]> {
    const { data: properties, error } = await supabase
        .from('properties')
        .select(`
      price,
      transaction,
      location,
      specs,
      details
    `)
        .eq('validation_status', 'approved')
        .eq('status', 'disponible');

    if (error || !properties) {
        console.error('Error fetching properties for barometer:', error);
        return [];
    }

    const grouped = new Map<string, {
        totalPrice: number;
        totalSurface: number;
        count: number;
        minPrice: number;
        maxPrice: number;
        transaction: 'vente' | 'location';
        city: string;
        type: string;
    }>();

    for (const p of properties) {
        // Validation des données : il faut un prix et une surface > 0
        if (!p.price || !p.specs?.surface || p.specs.surface <= 0) continue;

        // Pour la location, on ignore les locations journalières/mensuelles extrêmes pour le prix au m² (focalisation sur loc classique)
        // On simplifie ici en prenant tout, mais la robustesse viendra du count min

        // @ts-ignore - Le typage JSONB peut être flou côté DB, on s'assure de l'existence
        const city = p.location?.city || 'Sénégal';
        // @ts-ignore
        const type = p.details?.type || 'Appartement';
        const transaction = p.transaction as 'vente' | 'location';

        // Normalisation basique
        const normalizedCity = city.trim();
        const normalizedType = type.trim();

        const key = `${normalizedCity}-${normalizedType}-${transaction}`;

        const existing = grouped.get(key) || {
            totalPrice: 0,
            totalSurface: 0,
            count: 0,
            minPrice: Infinity,
            maxPrice: 0,
            transaction,
            city: normalizedCity,
            type: normalizedType
        };

        existing.totalPrice += p.price;
        existing.totalSurface += p.specs.surface;
        existing.count += 1;
        if (p.price < existing.minPrice) existing.minPrice = p.price;
        if (p.price > existing.maxPrice) existing.maxPrice = p.price;

        grouped.set(key, existing);
    }

    const result: BarometerCityData[] = [];

    for (const val of grouped.values()) {
        // SEUIL DE FIABILITÉ : On n'affiche que s'il y a au moins 2 biens (Idéalement 3+ mais 2 pour commencer si peu de data)
        if (val.count >= 2) {
            result.push({
                city: val.city,
                type: val.type,
                transaction: val.transaction,
                avgPrice: Math.round(val.totalPrice / val.count),
                avgSurface: Math.round(val.totalSurface / val.count),
                avgPricePerSqm: Math.round(val.totalPrice / val.totalSurface), // Moyenne pondérée par la surface totale
                count: val.count,
                minPrice: val.minPrice,
                maxPrice: val.maxPrice,
            });
        }
    }

    // Trier par nombre d'annonces (les marchés les plus actifs en premier)
    return result.sort((a, b) => b.count - a.count);
}
