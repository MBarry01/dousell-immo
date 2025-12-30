-- Ajout de la politique UPDATE pour permettre l'écrasement (upsert) des fichiers
-- Nécessaire pour le bouton "Regénérer le contrat"

CREATE POLICY "Le bailleur peut mettre à jour ses contrats"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lease-contracts' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'lease-contracts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
