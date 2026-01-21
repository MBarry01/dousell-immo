-- Supprimer les annonces externes qui n'ont pas d'image
DELETE FROM external_listings
WHERE image_url IS NULL 
   OR image_url = ''
   OR image_url = 'NULL'; -- Au cas où la chaîne "NULL" aurait été importée littéralement
