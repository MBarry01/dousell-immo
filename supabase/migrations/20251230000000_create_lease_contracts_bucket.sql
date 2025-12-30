-- 1. Création du Bucket "lease-contracts"
-- "public: false" est CRUCIAL : cela oblige à passer par une URL signée.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lease-contracts', 
  'lease-contracts', 
  false, 
  5242880, -- Limite à 5MB (largement suffisant pour un PDF)
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Activation de la sécurité (RLS) sur les objets
-- (Généralement déjà activé par défaut sur Supabase, et nécessite des droits superuser)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. POLITIQUES DE SÉCURITÉ (RLS)

-- POLICY 1 : UPLOAD (INSERT)
-- Le propriétaire peut uploader un fichier UNIQUEMENT dans son propre dossier
-- Structure obligatoire : lease-contracts/USER_ID/filename.pdf
CREATE POLICY "Le bailleur peut uploader ses contrats"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lease-contracts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- POLICY 2 : LECTURE (SELECT)
-- Le propriétaire peut lire ses propres fichiers pour générer l'URL signée
CREATE POLICY "Le bailleur peut voir ses contrats"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lease-contracts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- POLICY 3 : SUPPRESSION (DELETE)
-- Le propriétaire peut supprimer ses fichiers
CREATE POLICY "Le bailleur peut supprimer ses contrats"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lease-contracts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Ajouter la colonne lease_pdf_url à la table leases si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leases' AND column_name = 'lease_pdf_url') THEN
        ALTER TABLE leases ADD COLUMN lease_pdf_url text;
    END IF;
END $$;
