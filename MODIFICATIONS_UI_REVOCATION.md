# Modifications UI à faire manuellement

## Fichier: property-verification-list.tsx

### 1. Ajouter une colonne STATUT dans le tableau (optionnel, mais recommandé)

Après la colonne "Date" (~ligne 248), ajouter:

```tsx
<th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
    Statut
</th>
```

### 2. Afficher le badge de statut dans chaque ligne

Dans le `<tbody>`, après la colonne Date, ajouter:

```tsx
{/* Colonne Statut */}
<td className="px-6 py-4">
    {property.verification_status === "verified" ? (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            ✅ Certifié
        </Badge>
    ) : property.verification_status === "rejected" ? (
        <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
            ❌ Rejeté
        </Badge>
    ) : (
        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            ⏳ En attente
        </Badge>
    )}
</td>
```

### 3. Modifier la colonne ACTIONS (CRITIQUE)

Remplacer toute la section Actions (cherche "Rejeter" et "Approuver" vers la ligne 268-280):

```tsx
{/* Actions */}
<td className="px-6 py-4">
    <div className="flex items-center justify-end gap-2">
        {property.verification_status === "verified" ? (
            <Button
                size="sm"
                variant="outline"
                className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                onClick={() => openRevokeDialog(property)}
                disabled={processing}
            >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Révoquer
            </Button>
        ) : (
            <>
                <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    onClick={() => openRejectDialog(property)}
                    disabled={processing}
                >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Rejeter
                </Button>
                <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleApprove(property)}
                    disabled={processing}
                >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Approuver
                </Button>
            </>
        )}
    </div>
</td>
```

### 4. Ajouter le Dialog de Révocation

À la fin du composant, AVANT la fermeture du fragment `</>` (vers ligne 380), ajouter:

```tsx
{/* Dialog de révocation */}
<Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
    <DialogContent className="bg-[#0b0f18] border-white/10">
        <DialogHeader>
            <DialogTitle className="text-white">Révoquer la certification</DialogTitle>
            <DialogDescription className="text-white/60">
                Veuillez indiquer la raison de la révocation pour {selectedProperty?.title}
            </DialogDescription>
        </DialogHeader>
        <Textarea
            placeholder="Ex: Document obsolète, fraude détectée, erreur administrative..."
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            className="bg-white/5 border-white/10 text-white min-h-[120px]"
            rows={5}
        />
        <div className="flex gap-2 justify-end">
            <Button
                variant="outline"
                onClick={() => {
                    setRevokeDialogOpen(false);
                    setRevokeReason("");
                }}
                disabled={processing}
            >
                Annuler
            </Button>
            <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleRevoke}
                disabled={processing || !revokeReason.trim()}
            >
                <RotateCcw className="w-4 h-4 mr-2" />
                Confirmer la révocation
            </Button>
        </div>
    </DialogContent>
</Dialog>
```

## Résultat attendu:
- Les biens certifiés affichent un badge vert "✅ Certifié" et un bouton "Révoquer"
- Les biens en attente affichent un badge jaune "⏳ En attente" et les boutons "Approuver/Rejeter"
- Les biens rejetés affichent un badge rouge "❌ Rejeté" et les boutons "Approuver/Rejeter"
- Tous les biens restent dans la liste après action
