insert into public.properties (
  id,
  title,
  description,
  price,
  category,
  status,
  location,
  specs,
  details,
  features,
  images,
  agent
)
values (
  gen_random_uuid(),
  'Superbe F4 Moderne avec Piscine - Zone Almadies',
  'Appartement de haut standing situé au 2ème étage d''une résidence sécurisée. Triple séjour lumineux, cuisine équipée, suites avec dressings et accès à la piscine commune + salle de sport. Groupe électrogène couvrant 100% du bâtiment.',
  1500000,
  'location',
  'disponible',
  jsonb_build_object(
    'city', 'Les Almadies',
    'address', 'Résidence Horizon, zone des Almadies',
    'landmark', 'Derrière Philip Morris, proche King Fahd',
    'coords', jsonb_build_object('lat', 14.7204, 'lng', -17.5108)
  ),
  jsonb_build_object(
    'surface', 180,
    'rooms', 4,
    'bedrooms', 3,
    'bathrooms', 3,
    'dpe', 'B'
  ),
  jsonb_build_object(
    'type', 'Appartement',
    'year', 2021,
    'heating', 'Climatisation gainable',
    'charges', 250000,
    'parking', '2 places sous-sol',
    'hasBackupGenerator', true,
    'hasWaterTank', true,
    'security', true
  ),
  jsonb_build_object(
    'hasGenerator', true,
    'hasWaterTank', true,
    'security', true,
    'pool', true,
    'gym', true
  ),
  ARRAY[
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/271743/pexels-photo-271743.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ]::text[],
  jsonb_build_object(
    'name', 'Conciergerie Dousell',
    'photo', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    'phone', '+221778889900',
    'whatsapp', '221778889900'
  )
),
(
  gen_random_uuid(),
  'Appartement F3 Spacieux et Accessible - Mermoz',
  'Appartement familial situé dans un immeuble calme de Mermoz. Salon traversant, 2 chambres dont une suite, cuisine séparée et balcon ombragé. Surpresseur d''eau et gardiennage de nuit.',
  450000,
  'location',
  'disponible',
  jsonb_build_object(
    'city', 'Mermoz',
    'address', 'Rue des Jardins, Mermoz',
    'landmark', 'À deux pas de l''Auchan Mermoz',
    'coords', jsonb_build_object('lat', 14.7009, 'lng', -17.4678)
  ),
  jsonb_build_object(
    'surface', 90,
    'rooms', 3,
    'bedrooms', 2,
    'bathrooms', 2,
    'dpe', 'C'
  ),
  jsonb_build_object(
    'type', 'Appartement',
    'year', 2017,
    'heating', 'Climatisation split',
    'charges', 120000,
    'parking', 'Parking extérieur résident',
    'hasBackupGenerator', false,
    'hasWaterTank', true,
    'security', true
  ),
  jsonb_build_object(
    'hasGenerator', false,
    'hasWaterTank', true,
    'security', true
  ),
  ARRAY[
    'https://images.pexels.com/photos/271743/pexels-photo-271743.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/259962/pexels-photo-259962.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ]::text[],
  jsonb_build_object(
    'name', 'Fatou Camara',
    'photo', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
    'phone', '+221778889901',
    'whatsapp', '221778889901'
  )
),
(
  gen_random_uuid(),
  'Villa d''Architecte R+1 avec Rooftop - Les Mamelles',
  'Villa récente construite sur 200m² de terrain (TF). RDC : vaste séjour, cuisine américaine et chambre invités. Étage : 3 suites vue jardin. Rooftop aménagé avec vue imprenable sur le Phare des Mamelles.',
  280000000,
  'vente',
  'disponible',
  jsonb_build_object(
    'city', 'Les Mamelles',
    'address', 'Allée du Phare, Mamelles',
    'landmark', 'Côté Phare, accès corniche',
    'coords', jsonb_build_object('lat', 14.7191, 'lng', -17.4942)
  ),
  jsonb_build_object(
    'surface', 250,
    'rooms', 6,
    'bedrooms', 4,
    'bathrooms', 4,
    'dpe', 'B'
  ),
  jsonb_build_object(
    'type', 'Maison',
    'year', 2022,
    'heating', 'Climatisation VRV',
    'parking', 'Garage 1 voiture',
    'hasBackupGenerator', true,
    'hasWaterTank', true,
    'security', true
  ),
  jsonb_build_object(
    'hasGenerator', true,
    'hasWaterTank', true,
    'security', true,
    'rooftop', true,
    'titreFoncier', true
  ),
  ARRAY[
    'https://images.pexels.com/photos/261327/pexels-photo-261327.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/276671/pexels-photo-276671.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/534151/pexels-photo-534151.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ]::text[],
  jsonb_build_object(
    'name', 'Mame Diarra Ndiaye',
    'photo', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    'phone', '+221778889902',
    'whatsapp', '221778889902'
  )
),
(
  gen_random_uuid(),
  'Studio Chic & Meublé Tout Inclus - Dakar Plateau',
  'Studio design meublé au cœur du Plateau. Loyer incluant Eau, Internet Fibre, Canal+ et ménage 2x/semaine. Électricité prépayée. Idéal pour missions courtes.',
  600000,
  'location',
  'disponible',
  jsonb_build_object(
    'city', 'Dakar Plateau',
    'address', 'Immeuble City Hub, Rue Vincens',
    'landmark', 'Proche Place de l''Indépendance',
    'coords', jsonb_build_object('lat', 14.6702, 'lng', -17.431)
  ),
  jsonb_build_object(
    'surface', 45,
    'rooms', 1,
    'bedrooms', 1,
    'bathrooms', 1,
    'dpe', 'A'
  ),
  jsonb_build_object(
    'type', 'Studio',
    'year', 2020,
    'heating', 'Climatisation split',
    'hasBackupGenerator', true,
    'hasWaterTank', true,
    'security', true
  ),
  jsonb_build_object(
    'hasGenerator', true,
    'hasWaterTank', true,
    'security', true,
    'internet', true,
    'housekeeping', true
  ),
  ARRAY[
    'https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/271643/pexels-photo-271643.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/271676/pexels-photo-271676.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ]::text[],
  jsonb_build_object(
    'name', 'Plateau Desk',
    'photo', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    'phone', '+221778889903',
    'whatsapp', '221778889903'
  )
),
(
  gen_random_uuid(),
  'Terrain d''Angle 300m² - Pôle Urbain Diamniadio',
  'Terrain viabilisé de 300m² (bail individuel) situé à 5 minutes de la gare TER. Zone habitée à 40% avec réseaux eau/électricité tirés. Idéal investisseur.',
  18000000,
  'vente',
  'disponible',
  jsonb_build_object(
    'city', 'Diamniadio',
    'address', 'Lotissement Emergence, Diamniadio',
    'landmark', 'Proche sphères ministérielles',
    'coords', jsonb_build_object('lat', 14.7209, 'lng', -17.1385)
  ),
  jsonb_build_object(
    'surface', 300,
    'rooms', 0,
    'bedrooms', 0,
    'bathrooms', 0,
    'dpe', 'B'
  ),
  jsonb_build_object(
    'type', 'Maison',
    'year', 2024,
    'heating', 'N/A',
    'hasBackupGenerator', false,
    'hasWaterTank', true,
    'security', false
  ),
  jsonb_build_object(
    'viabilise', true,
    'titreFoncier', false,
    'bail', true
  ),
  ARRAY[
    'https://images.pexels.com/photos/1587036/pexels-photo-1587036.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/210617/pexels-photo-210617.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ]::text[],
  jsonb_build_object(
    'name', 'Cellule Invest',
    'photo', 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400',
    'phone', '+221778889904',
    'whatsapp', '221778889904'
  )
),
(
  gen_random_uuid(),
  'Plateau de Bureaux 150m² - Façade VDN',
  'Open-space de 150m² livré brut ou aménagé. Façade vitrée sur la VDN, 4ème étage avec ascenseur, 2 places de parking sous-sol et sécurité incendie.',
  1200000,
  'location',
  'disponible',
  jsonb_build_object(
    'city', 'Mermoz / Sacré-Cœur',
    'address', 'Immeuble Skyline, VDN',
    'landmark', 'Sur la VDN, visibilité maximale',
    'coords', jsonb_build_object('lat', 14.7082, 'lng', -17.4654)
  ),
  jsonb_build_object(
    'surface', 150,
    'rooms', 3,
    'bedrooms', 0,
    'bathrooms', 2,
    'dpe', 'B'
  ),
  jsonb_build_object(
    'type', 'Appartement',
    'year', 2023,
    'heating', 'VRV professionnel',
    'hasBackupGenerator', true,
    'hasWaterTank', true,
    'security', true
  ),
  jsonb_build_object(
    'hasGenerator', true,
    'hasWaterTank', true,
    'security', true,
    'parking', true,
    'ascenseur', true
  ),
  ARRAY[
    'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/288477/pexels-photo-288477.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ]::text[],
  jsonb_build_object(
    'name', 'Corporate Desk',
    'photo', 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
    'phone', '+221778889905',
    'whatsapp', '221778889905'
  )
),
(
  gen_random_uuid(),
  'F3 Pieds dans l''eau - Virage',
  'Appartement traversant face à la mer avec balcon filant, 2 chambres climatisées et cuisine semi-équipée. Accès plage du Virage en 2 minutes.',
  800000,
  'location',
  'disponible',
  jsonb_build_object(
    'city', 'Ngor Virage',
    'address', 'Résidence Océane, Virage',
    'landmark', 'Derrière l''hôtel Ngor Diarama',
    'coords', jsonb_build_object('lat', 14.7471, 'lng', -17.5009)
  ),
  jsonb_build_object(
    'surface', 110,
    'rooms', 3,
    'bedrooms', 2,
    'bathrooms', 2,
    'dpe', 'B'
  ),
  jsonb_build_object(
    'type', 'Appartement',
    'year', 2019,
    'heating', 'Climatisation split',
    'hasBackupGenerator', true,
    'hasWaterTank', true,
    'security', true
  ),
  jsonb_build_object(
    'hasGenerator', true,
    'hasWaterTank', true,
    'security', true,
    'seaView', true,
    'balcony', true
  ),
  ARRAY[
    'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/169191/pexels-photo-169191.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ]::text[],
  jsonb_build_object(
    'name', 'Ngor Luxury Team',
    'photo', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
    'phone', '+221778889906',
    'whatsapp', '221778889906'
  )
),
(
  gen_random_uuid(),
  'Immeuble R+3 à Rénover - Sicap Liberté',
  'Immeuble de rapport composé de 6 appartements F3. Loué à 100% (900k CFA/mois), potentiel 1,5M après rénovation. Structure saine, travaux second œuvre à prévoir.',
  180000000,
  'vente',
  'disponible',
  jsonb_build_object(
    'city', 'Sicap Liberté',
    'address', 'Rue 44, Liberté 5',
    'landmark', 'Proche Terminus Dakar Dem Dikk',
    'coords', jsonb_build_object('lat', 14.6963, 'lng', -17.4581)
  ),
  jsonb_build_object(
    'surface', 150,
    'rooms', 12,
    'bedrooms', 6,
    'bathrooms', 6,
    'dpe', 'C'
  ),
  jsonb_build_object(
    'type', 'Maison',
    'year', 2005,
    'heating', 'Ventilation naturelle',
    'hasBackupGenerator', false,
    'hasWaterTank', true,
    'security', true
  ),
  jsonb_build_object(
    'hasGenerator', false,
    'hasWaterTank', true,
    'security', true,
    'titreFoncier', true
  ),
  ARRAY[
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/210617/pexels-photo-210617.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ]::text[],
  jsonb_build_object(
    'name', 'Invest Team',
    'photo', 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400',
    'phone', '+221778889907',
    'whatsapp', '221778889907'
  )
),
(
  gen_random_uuid(),
  'Villa de Charme 3 Chambres avec Piscine Privée - Saly',
  'Villa style néo-soudanais entièrement meublée. 3 suites indépendantes, jardin tropical et piscine à débordement. Pisciniste + jardinier inclus.',
  1000000,
  'location',
  'disponible',
  jsonb_build_object(
    'city', 'Saly Portudal',
    'address', 'Résidence Plein Sud, Saly',
    'landmark', 'Saly Plein Sud',
    'coords', jsonb_build_object('lat', 14.4466, 'lng', -17.0069)
  ),
  jsonb_build_object(
    'surface', 180,
    'rooms', 5,
    'bedrooms', 3,
    'bathrooms', 3,
    'dpe', 'B'
  ),
  jsonb_build_object(
    'type', 'Maison',
    'year', 2015,
    'heating', 'Ventilation + climatisation',
    'hasBackupGenerator', true,
    'hasWaterTank', true,
    'security', true
  ),
  jsonb_build_object(
    'hasGenerator', true,
    'hasWaterTank', true,
    'security', true,
    'pool', true,
    'garden', true,
    'furnished', true
  ),
  ARRAY[
    'https://images.pexels.com/photos/210109/pexels-photo-210109.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/333153/pexels-photo-333153.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ]::text[],
  jsonb_build_object(
    'name', 'Pleine Côte',
    'photo', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
    'phone', '+221778889908',
    'whatsapp', '221778889908'
  )
),
(
  gen_random_uuid(),
  'F4 de Prestige - Résidence Diplomatique Point E',
  'Appartement F4 neuf, finitions marbre + cuisine italienne. Suite parentale de 40m², ascenseur privatif et services hôteliers (conciergerie, gym, sécurité armée).',
  210000000,
  'vente',
  'disponible',
  jsonb_build_object(
    'city', 'Point E',
    'address', 'Résidence Diplomatique, Rue des Écrivains',
    'landmark', 'Rue des Écrivains',
    'coords', jsonb_build_object('lat', 14.6855, 'lng', -17.4622)
  ),
  jsonb_build_object(
    'surface', 165,
    'rooms', 5,
    'bedrooms', 3,
    'bathrooms', 3,
    'dpe', 'A'
  ),
  jsonb_build_object(
    'type', 'Appartement',
    'year', 2023,
    'heating', 'Climatisation centralisée',
    'hasBackupGenerator', true,
    'hasWaterTank', true,
    'security', true
  ),
  jsonb_build_object(
    'hasGenerator', true,
    'hasWaterTank', true,
    'security', true,
    'gym', true,
    'lift', true
  ),
  ARRAY[
    'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/267071/pexels-photo-267071.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ]::text[],
  jsonb_build_object(
    'name', 'Point E Signature',
    'photo', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    'phone', '+221778889909',
    'whatsapp', '221778889909'
  )
);
