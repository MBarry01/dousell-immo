-- Fonction pour obtenir l'ID de l'utilisateur admin par son email
-- Cette fonction permet de récupérer l'ID de l'admin sans avoir besoin du service role
CREATE OR REPLACE FUNCTION get_admin_user_id(admin_email TEXT)
RETURNS UUID AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Chercher l'utilisateur dans auth.users par email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = LOWER(admin_email)
  LIMIT 1;
  
  RETURN admin_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

