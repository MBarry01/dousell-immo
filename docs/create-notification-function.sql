-- Créer une fonction SECURITY DEFINER pour créer des notifications
-- Cette fonction bypass RLS et peut être appelée depuis le serveur

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_resource_path text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  -- Insérer la notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    resource_path,
    is_read,
    created_at
  ) VALUES (
    p_user_id,
    p_type::text,
    p_title,
    p_message,
    p_resource_path,
    false,
    now()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text) TO service_role;

-- Commentaire
COMMENT ON FUNCTION public.create_notification IS 'Crée une notification pour un utilisateur. Bypass RLS grâce à SECURITY DEFINER.';

