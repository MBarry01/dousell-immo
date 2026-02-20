---
name: premium-ux-standards
description: Directives pour une interface utilisateur "Premium" sans distorsion de couleur
---

# Premium UX Standards (Doussel Immo)

Ces règles définissent l'esthétique et les interactions pour garantir une expérience utilisateur haut de gamme et cohérente.

---

## 🖱️ Interactions au Survol (Hover) — Standard "Physical Lift"

Les interactions au survol doivent simuler une **élévation physique**, jamais un changement de peinture.

### ❌ Règles INTERDITES
- `hover:bg-*` sur des boutons (sauf pour maintenir la couleur d'origine identique)
- `hover:text-*` qui modifie la couleur du texte
- `hover:bg-transparent` sur des boutons avec du texte (rend le texte invisible en dark mode)

### ✅ Règles AUTORISÉES
- `hover:-translate-y-1` → Élévation physique
- `hover:shadow-md` / `hover:shadow-xl` → Ombre accentuée
- `hover:scale-[1.02]` → Légère mise à l'échelle pour les cartes isolées
- `hover:bg-[couleur-originale]` → Pour stabiliser le fond sans changement visuel

### 🔧 Fix Racine (button.tsx)
Le variant `outline` de Shadcn/UI doit **ne pas** inclure `hover:bg-accent`. Ce hover est défini directement dans `components/ui/button.tsx` :

```tsx
// ✅ Correct
outline: "border border-input bg-background text-foreground hover:shadow-md hover:scale-[1.02] transition-all duration-200 ease-out",

// ❌ Incorrect
outline: "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground ...",
```

### 🌑 Dark Mode — Boutons Secondaires
Pour les boutons secondaires (Appeler, Calendrier, etc.) en dark mode, utiliser un fond explicite semi-transparent plutôt que `variant="outline"` :

```tsx
// ✅ Stylisation recommandée pour dark mode
className="border border-white/20 bg-white/10 text-white hover:bg-white/10 hover:-translate-y-1 hover:shadow-md"
```

---

## 📱 Interactions Tactiles (Mobile PWA)

- **`whileTap={{ scale: 0.95 }}`** sur tous les boutons interactifs
- **`hapticFeedback.light()`** pour les boutons secondaires
- **`hapticFeedback.medium()`** pour les actions principales (WhatsApp, CTA)
- **`.no-select`** sur les éléments pour éviter la sélection accidentelle de texte

---

## 💎 Esthétique Générale

- **Glassmorphism** : `bg-white/10` ou `bg-black/40` + `backdrop-blur-md`
- **Espacement** : 80px entre sections majeures (respiration du contenu)
- **Galerie** : Si 1 seule photo → plein format panoramique. Multi-photos → Bento Grid adaptatif
