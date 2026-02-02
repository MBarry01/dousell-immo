-- Trigger pour garantir la cohérence : un bien loué doit être hors-ligne (pending)
-- Cela évite les erreurs humaines ou de code qui tenteraient de publier un bien déjà loué.

CREATE OR REPLACE FUNCTION force_rented_property_offline()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le statut passe à 'loué', on force la dépublication
    IF NEW.status = 'loué' THEN
        NEW.validation_status := 'pending';
    END IF;
    
    -- Empêcher le passage en 'approved' si déjà 'loué'
    IF NEW.validation_status = 'approved' AND NEW.status = 'loué' THEN
        NEW.validation_status := 'pending';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Suppression du trigger s'il existe déjà
DROP TRIGGER IF EXISTS trg_force_rented_offline ON properties;

-- Création du trigger
CREATE TRIGGER trg_force_rented_offline
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION force_rented_property_offline();
