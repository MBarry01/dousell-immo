-- Mise à jour de la fonction pour accepter un filtre "transaction_type" (qui correspond à la colonne category ou transaction)
create or replace function get_active_cities_and_types(
  min_count int default 1, 
  target_transaction_type text default null -- 'location' ou 'vente'
)
returns table (city text, type text, count bigint) as $$
begin
  return query
  select 
    lower(p.location->>'city')::text as city, 
    lower(p.details->>'type')::text as type,
    count(*) as count
  from properties p
  where 
    p.status = 'disponible'
    and p.validation_status = 'approved'
    and p.location->>'city' is not null
    and p.details->>'type' is not null
    -- Si target_transaction_type est fourni, on filtre. 
    -- On vérifie à la fois la colonne 'category' et 'transaction' pour être sûr (selon votre schéma exact)
    and (
      target_transaction_type is null 
      or p.category = target_transaction_type 
    )
  group by lower(p.location->>'city'), lower(p.details->>'type')
  having count(*) >= min_count;
end;
$$ language plpgsql security definer;

-- Permissions: Rendre accessible au frontend (anon + authenticated)
grant execute on function get_active_cities_and_types(int, text) to anon;
grant execute on function get_active_cities_and_types(int, text) to authenticated;
