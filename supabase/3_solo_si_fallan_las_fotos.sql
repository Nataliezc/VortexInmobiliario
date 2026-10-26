-- ════════════════════════════════════════════════════════════════
--  VORTEX · SOLO si al subir fotos aparece un error.
--  Primero crea a mano el bucket "vortex" (público) en Storage,
--  luego pega esto en SQL Editor y presiona Run.
-- ════════════════════════════════════════════════════════════════
drop policy if exists vortex_subir  on storage.objects;
drop policy if exists vortex_ver    on storage.objects;
drop policy if exists vortex_borrar on storage.objects;
create policy vortex_subir  on storage.objects for insert to authenticated with check (bucket_id = 'vortex');
create policy vortex_ver    on storage.objects for select using (bucket_id = 'vortex');
create policy vortex_borrar on storage.objects for delete to authenticated using (bucket_id = 'vortex' and owner = auth.uid());
