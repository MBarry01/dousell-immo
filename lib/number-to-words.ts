/**
 * Convertit un nombre en lettres (français)
 * Gère jusqu'aux milliards
 */

const unites = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
const dizaines = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];
const speciaux = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];

function convertirCentaine(n: number): string {
    if (n === 0) return "";
    let res = "";

    const cent = Math.floor(n / 100);
    const reste = n % 100;

    if (cent === 1) {
        res += "cent ";
    } else if (cent > 1) {
        res += unites[cent] + " cent" + (reste === 0 ? "s " : " ");
    }

    if (reste > 0) {
        if (reste < 10) {
            res += unites[reste];
        } else if (reste < 20) {
            res += speciaux[reste - 10];
        } else {
            const diz = Math.floor(reste / 10);
            const unit = reste % 10;

            if (diz === 7 || diz === 9) {
                res += dizaines[diz - 1] + "-" + speciaux[unit];
            } else {
                res += dizaines[diz];
                if (unit === 1) {
                    res += " et un";
                } else if (unit > 1) {
                    res += "-" + unites[unit];
                }
            }
        }
    }

    // Remplacement spécifique pour quatre-vingts
    res = res.replace("quatre-vingt-", "quatre-vingt-");
    if (res.endsWith("quatre-vingt")) res += "s";

    return res.trim();
}

export function numberToWordsFr(n: number): string {
    if (n === 0) return "zéro";
    if (n < 0) return "moins " + numberToWordsFr(Math.abs(n));

    let res = "";

    const milliards = Math.floor(n / 1000000000);
    n %= 1000000000;

    const millions = Math.floor(n / 1000000);
    n %= 1000000;

    const milliers = Math.floor(n / 1000);
    n %= 1000;

    if (milliards > 0) {
        res += convertirCentaine(milliards) + " milliard" + (milliards > 1 ? "s " : " ");
    }

    if (millions > 0) {
        res += convertirCentaine(millions) + " million" + (millions > 1 ? "s " : " ");
    }

    if (milliers > 0) {
        if (milliers === 1) {
            res += "mille ";
        } else {
            res += convertirCentaine(milliers) + " mille ";
        }
    }

    if (n > 0) {
        res += convertirCentaine(n);
    }

    return res.trim();
}
