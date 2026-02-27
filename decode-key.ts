import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

function decodeJWT(token: string) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return "Invalid JWT format";
        const payload = Buffer.from(parts[1], 'base64').toString();
        const obj = JSON.parse(payload);
        const ref = obj.ref;
        let hex = "";
        for (let i = 0; i < ref.length; i++) {
            hex += ref.charCodeAt(i).toString(16) + " ";
        }
        return { payload: obj, refChars: ref.split(''), refHex: hex.trim() };
    } catch (e) {
        return "Error decoding: " + e;
    }
}

console.log("ANON KEY DETAILS:", JSON.stringify(decodeJWT(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""), null, 2));
console.log("SERVICE KEY DETAILS:", JSON.stringify(decodeJWT(process.env.SUPABASE_SERVICE_ROLE_KEY || ""), null, 2));
