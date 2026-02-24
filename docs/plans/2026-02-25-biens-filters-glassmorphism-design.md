# Design: Barre de Filtres Biens — Glassmorphism + Gold Accent

**Date**: 2026-02-25
**Périmètre**: `app/(workspace)/gestion/biens/biens-client.tsx` — section filtres uniquement (lignes 317-447)
**Style validé**: Pill Glassmorphism + Gold accent (#F4C430) pour état actif

---

## Problème

Les filtres actuels (segmented controls `bg-muted` + badges statuts) sont visuellement plats et
ne correspondent pas au design "Luxe & Teranga" du reste de l'application.

## Design Validé

### Containers de groupes (Catégorie + Occupation)
```
bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1
```

### Pill **inactive**
```
rounded-full px-4 py-1.5 text-sm font-semibold text-white/40 hover:text-white/60 transition-all
```

### Pill **active** (Gold Glass)
```
rounded-full px-4 py-1.5 bg-[#F4C430]/20 text-[#F4C430] border border-[#F4C430]/40
shadow-[0_0_12px_rgba(244,196,48,0.15)] transition-all
```

### Badges statuts
| Badge | Actif | Inactif |
|-------|-------|---------|
| En ligne | `bg-emerald-500/20 text-emerald-400 border-emerald-500/30` | `border border-white/10 text-white/40` |
| Brouillon | `bg-white/10 text-white/70 border-white/20` | `border border-white/10 text-white/40` |
| Programmé | `bg-blue-500/20 text-blue-400 border-blue-500/30` | `border border-white/10 text-white/40` |

### Toggle Grid/List
```
bg-white/5 backdrop-blur border border-white/10 rounded-xl p-1
```

## Contraintes
- Aucune logique JS/state modifiée
- Séparateurs (`h-6 w-px`) supprimés (espacement naturel suffit)
- Le layout flex-row reste identique
- Compatible dark/light mode via les opacités `white/X`
