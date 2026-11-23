-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 18 (OPCIONAL): 5 captaciones de EJEMPLO, una en
--  cada ciudad principal, con ubicación exacta, solo para ver el
--  mapa funcionando con puntos reales mientras no hay captaciones
--  propias con ubicación todavía.
--
--  Pégalo en Supabase → SQL Editor → Run. Se puede repetir sin
--  problema (usa upsert, no duplica).
--
--  Para BORRARLAS cuando ya no las necesites, corre esto:
--    delete from public.propiedades where id like 'ejemplo-mapa-%';
-- ════════════════════════════════════════════════════════════════

insert into public.propiedades (id, datos)
values
  ('ejemplo-mapa-1', jsonb_build_object(
    'op','Venta','tipo','Departamento','ciudad','La Paz','zona','Calacoto',
    't','Depto. 2 dorm. con vista, Calacoto','precio',185000,'mon','USD',
    'dorm',2,'ban',2,'m2',120,'garaje',true,'gTipo','Independiente','gAparte',false,
    'mascotas','Sí','amoblado','Sin amoblar','desc','Captación de EJEMPLO para probar el mapa.',
    'fotos','[]'::jsonb,'exclusiva',true,'ubic', jsonb_build_object('lat',-16.5415,'lng',-68.0893),
    'est','Disponible','dias',0,'hue',260,'cap', jsonb_build_object('n','Agente de ejemplo','tel','70000000')
  )),
  ('ejemplo-mapa-2', jsonb_build_object(
    'op','Alquiler','tipo','Casa','ciudad','Santa Cruz','zona','Equipetrol',
    't','Casa 3 dorm. con piscina, Equipetrol','precio',1200,'mon','USD',
    'dorm',3,'ban',3,'m2',280,'garaje',true,'gTipo','Independiente','gAparte',false,
    'mascotas','Sí','amoblado','Amoblado','desc','Captación de EJEMPLO para probar el mapa.',
    'fotos','[]'::jsonb,'exclusiva',true,'ubic', jsonb_build_object('lat',-17.7733,'lng',-63.1978),
    'est','Disponible','dias',0,'hue',190,'cap', jsonb_build_object('n','Agente de ejemplo','tel','70000000')
  )),
  ('ejemplo-mapa-3', jsonb_build_object(
    'op','Venta','tipo','Departamento','ciudad','Cochabamba','zona','Cala Cala',
    't','Depto. 1 dorm. a estrenar, Cala Cala','precio',95000,'mon','USD',
    'dorm',1,'ban',1,'m2',65,'garaje',false,'mascotas','No','amoblado','Sin amoblar',
    'desc','Captación de EJEMPLO para probar el mapa.','fotos','[]'::jsonb,
    'exclusiva',true,'ubic', jsonb_build_object('lat',-17.3730,'lng',-66.1520),
    'est','Disponible','dias',0,'hue',40,'cap', jsonb_build_object('n','Agente de ejemplo','tel','70000000')
  )),
  ('ejemplo-mapa-4', jsonb_build_object(
    'op','Anticrético','tipo','Casa','ciudad','Sucre','zona','Centro',
    't','Casa colonial 4 dorm., Centro','precio',45000,'mon','USD',
    'dorm',4,'ban',2,'m2',210,'garaje',true,'gTipo','Independiente','gAparte',false,
    'mascotas','No','amoblado','Sin amoblar','desc','Captación de EJEMPLO para probar el mapa.',
    'fotos','[]'::jsonb,'exclusiva',true,'ubic', jsonb_build_object('lat',-19.0423,'lng',-65.2590),
    'est','Disponible','dias',0,'hue',20,'cap', jsonb_build_object('n','Agente de ejemplo','tel','70000000')
  )),
  ('ejemplo-mapa-5', jsonb_build_object(
    'op','Venta','tipo','Terreno','ciudad','El Alto','zona','Ciudad Satélite',
    't','Terreno 300 m², Ciudad Satélite','precio',32000,'mon','USD',
    'dorm',0,'ban',0,'m2',300,'garaje',false,'mascotas','No','amoblado','No aplica',
    'desc','Captación de EJEMPLO para probar el mapa.','fotos','[]'::jsonb,
    'exclusiva',true,'ubic', jsonb_build_object('lat',-16.5050,'lng',-68.1693),
    'est','Disponible','dias',0,'hue',320,'cap', jsonb_build_object('n','Agente de ejemplo','tel','70000000')
  ))
on conflict (id) do update set datos = excluded.datos;

-- ✅ Listo. Entra al buscador (o al de clientes) y toca "Ver en el mapa":
-- deberías ver 5 marcadores con su precio, repartidos por Bolivia.
-- Cuando quieras quitarlos, corre: delete from public.propiedades where id like 'ejemplo-mapa-%';
