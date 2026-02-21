---
description: Règles CSS strictes pour éviter les conflits de spécificité et assurer la cohérence light/dark mode
---

# Règles CSS — Doussel Immo

## ❌ INTERDIT — Ne JAMAIS faire

1. **Ne JAMAIS utiliser de changement de `background-color` au survol dans le Workspace.**
   Toutes les interactions de survol doivent être basées sur des animations (scale, translation, color text) et non sur des changements de fond.
   ```css
   /* ❌ INTERDIT — Pas de background au hover */
   .hover\:bg-accent:hover { background-color: var(--accent) !important; }
   ```

2. **Ne JAMAIS utiliser `!important` sur des couleurs de fond/texte** (sauf cas de force majeure validé).

3. **Ne JAMAIS utiliser de couleurs hex hardcodées pour les thèmes** (`text-white`, `bg-slate-900`, `text-gray-400`). Utiliser toujours les variables CSS sémantiques :
   | ❌ Hardcodé | ✅ Sémantique |
   |---|---|
   | `text-white` | `text-foreground` |
   | `text-slate-400` | `text-muted-foreground` |
   | `bg-slate-900` | `bg-card` ou `bg-background` |
   | `border-slate-800` | `border-border` |
   | `bg-gray-50` | `bg-muted` |

4. **Ne JAMAIS utiliser `hover:bg-accent`** — à remplacer par des animations.

## ✅ AUTORISÉ

1. **Animations sobres pour le feedback au survol** :
   Utiliser des transformations légères pour un rendu "Premium" :
   - `hover:scale-[1.02]`
   - `hover:translate-x-1` (surtout dans la sidebar)
   - `hover:text-primary`

2. **Variables CSS sémantiques** pour toutes les couleurs de thème :
   ```css
   background-color: var(--background);
   color: var(--foreground);
   ```

3. **`isDark` ternaires** dans les composants client (quand Tailwind ne suffit pas) :
   ```tsx
   className={isDark ? 'text-white' : 'text-gray-900'}
   ```

4. **Inline styles** pour les éléments critiques (tabs actifs, bottom nav) :
   ```tsx
   style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
   ```

5. **Couleurs sémantiques fixes** (rouge destructif, vert succès, jaune warning) — OK car ne dépendent pas du thème.

## Architecture CSS — Ordre de priorité

```
1. Variables CSS (:root, .light, .dark)     → Source de vérité
2. Classes Tailwind (hover:bg-accent)       → Composants
3. Règles Radix data-attribute (!important) → globals.css (fallback)
4. Inline styles                            → Cas critiques uniquement
```

## Avant chaque modification CSS

// turbo-all
1. Vérifier si une règle `!important` existe déjà pour la même propriété : `grep -r "!important" app/globals.css`
2. Vérifier que `hover:bg-accent` est toujours pairé avec `hover:text-accent-foreground`
3. Tester visuellement en mode light ET dark
4. Ne JAMAIS ajouter de nouvelle règle `!important` sur couleurs — modifier les composants Tailwind à la place
