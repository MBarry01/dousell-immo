-- Migration: Auto-unpublish property when status changes to 'loué'
-- This trigger automatically removes properties from the public storefront when they are rented

-- 0. First, update the check constraint to allow 'loué' and 'preavis' values
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;

ALTER TABLE properties ADD CONSTRAINT properties_status_check 
    CHECK (status IN ('disponible', 'loué', 'preavis', 'vendu', 'indisponible'));

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION auto_unpublish_rented_property()
RETURNS TRIGGER AS $$
BEGIN
    -- If status is being set to 'loué', automatically unpublish from storefront
    IF NEW.status = 'loué' AND (OLD.status IS NULL OR OLD.status != 'loué') THEN
        NEW.validation_status := 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_unpublish_rented ON properties;

CREATE TRIGGER trigger_auto_unpublish_rented
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION auto_unpublish_rented_property();

-- 3. Apply retroactively to existing rented properties
UPDATE properties p
SET 
    status = 'loué',
    validation_status = 'pending'
FROM leases l
WHERE l.property_id = p.id
AND l.status = 'active'
AND (p.status = 'disponible' OR p.validation_status = 'approved');

-- 4. Also create a similar trigger for when a lease is created
CREATE OR REPLACE FUNCTION auto_unpublish_on_lease_created()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new active lease is created, update the property status
    IF NEW.status = 'active' THEN
        UPDATE properties
        SET 
            status = 'loué',
            validation_status = 'pending'
        WHERE id = NEW.property_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_unpublish_on_lease ON leases;

CREATE TRIGGER trigger_auto_unpublish_on_lease
    AFTER INSERT ON leases
    FOR EACH ROW
    EXECUTE FUNCTION auto_unpublish_on_lease_created();

-- Done! Now any property marked as 'loué' or with a new lease will be auto-unpublished
