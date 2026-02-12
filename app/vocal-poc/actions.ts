"use server";

import { createClient } from "@/utils/supabase/server";

export async function chatWithAI(message: string, history: { role: "user" | "assistant", content: string }[] = []) {
    try {
        const openaiApiKey = process.env.OPENAI_API_KEY;

        if (!openaiApiKey) {
            return {
                success: false,
                error: "La clé API OpenAI n'est pas configurée."
            };
        }

        const systemPrompt = `Tu es l'assistant vocal Doussel, un conseiller immobilier sénégalais chaleureux et expert.

RÈGLE DE LANGUE (MIROIR) :
1. RÉPONDS TOUJOURS DANS LA LANGUE DE L'UTILISATEUR. 
   - S'il parle Français, réponds en Français.
   - S'il parle Wolof, réponds en Wolof.
   - S'il mélange les deux, tu peux aussi mélanger naturellement (ex: "Waaw, c'est noté pour votre rendez-vous").

TON PERSONNAGE :
- Tu es courtois et pro. Utilise des salutations comme "Salam" ou "Bonjour".
- Tu es un expert de Doussel Immo.
- Réponses COURTES : 2 phrases maximum.

NOTES TECHNIQUES :
- La transcription (Waxal) peut être imprécise, interprète l'intention globale.`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o", // Utilisation d'un modèle performant pour le Wolof
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history.map(h => ({ role: h.role === "user" ? "user" : "assistant", content: h.content })),
                    { role: "user", content: message }
                ],
                max_tokens: 300,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("❌ Erreur OpenAI POC:", response.status, errorData);
            return {
                success: false,
                error: "Erreur de communication avec l'IA."
            };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();

        return {
            success: true,
            content
        };

    } catch (error) {
        console.error("❌ Erreur chatWithAI:", error);
        return {
            success: false,
            error: "Une erreur inattendue est survenue."
        };
    }
}

export async function transcribeAudio(base64Audio: string) {
    try {
        const hfToken = process.env.HUGGINGFACE_API_KEY;
        const openaiApiKey = process.env.OPENAI_API_KEY;

        // Convertir base64 en buffer
        const audioBuffer = Buffer.from(base64Audio, 'base64');

        // OPTION 1 : Hugging Face (Modèle SOTA Waxal-Wolof)
        if (hfToken) {
            const response = await fetch(
                "https://api-inference.huggingface.co/models/bilalfaye/wav2vec2-large-mms-1b-wolof",
                {
                    headers: {
                        Authorization: `Bearer ${hfToken}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: audioBuffer,
                }
            );

            if (response.ok) {
                const result = await response.json();
                // Wav2Vec2 renvoie souvent { text: "..." } ou juste le texte
                const transcribedText = result.text || result[0]?.generated_text || result.toString();
                return { success: true, text: transcribedText, provider: "hf-waxal" };
            }
        }

        // OPTION 2 : OpenAI Whisper - Fallback robuste (déjà configuré)
        if (openaiApiKey) {
            const formData = new FormData();
            const blob = new Blob([audioBuffer], { type: 'audio/webm' });
            formData.append('file', blob, 'audio.webm');
            formData.append('model', 'whisper-1');
            formData.append('language', 'fr'); // Whisper détecte souvent le Wolof via le contexte

            const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openaiApiKey}`,
                },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                return { success: true, text: result.text, provider: "openai" };
            }
        }

        return {
            success: false,
            error: "Aucun moteur de transcription disponible (HF ou OpenAI)."
        };

    } catch (error) {
        console.error("❌ Erreur transcribeAudio:", error);
        return { success: false, error: "Erreur technique de transcription" };
    }
}

export async function generateSpeech(text: string) {
    try {
        const openaiApiKey = process.env.OPENAI_API_KEY;

        if (!openaiApiKey) {
            return {
                success: false,
                error: "La clé API OpenAI n'est pas configurée."
            };
        }

        const response = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: "tts-1",
                input: text,
                voice: "nova", // Voix douce et naturelle
                response_format: "mp3",
            }),
        });

        if (!response.ok) {
            console.error("❌ Erreur OpenAI TTS:", response.status);
            return { success: false, error: "Erreur lors de la génération de la voix." };
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        return {
            success: true,
            audioContent: base64Audio
        };

    } catch (error) {
        console.error("❌ Erreur generateSpeech:", error);
        return { success: false, error: "Erreur technique de synthèse vocale" };
    }
}
