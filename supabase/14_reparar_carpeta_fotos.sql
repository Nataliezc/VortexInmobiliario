-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 14: reparar las carpetas de imágenes
--   • "vortex"  → PÚBLICA: fotos de propiedades, QR de pago, comprobantes.
--   • "carnets" → PRIVADA: carnets (solo el dueño y el administrador).
--  Pégalo en SQL Editor → Run. Si aparece un error en rojo, mándalo.
-- ════════════════════════════════════════════════════════════════

-- 1) Crear las carpetas (o corregirlas si ya existían)
insert into storage.buckets (id, name, public) values ('vortex', 'vortex', true)
on conflict (id) do update set public = true;
insert into storage.buckets (id, name, public) values ('carnets', 'carnets', false)
on conflict (id) do update set public = false;

-- 2) Permisos de la carpeta pública "vortex"
drop policy if exists vortex_subir        on storage.objects;
drop policy if exists vortex_ver          on storage.objects;
drop policy if exists vortex_borrar       on storage.objects;
drop policy if exists vortex_borrar_admin on storage.objects;
create policy vortex_subir  on storage.objects for insert to authenticated with check (bucket_id = 'vortex');
create policy vortex_ver    on storage.objects for select using (bucket_id = 'vortex');
create policy vortex_borrar on storage.objects for delete to authenticated
  using (bucket_id in ('vortex', 'carnets') and (owner = auth.uid() or public.es_admin()));

-- 3) Permisos de la carpeta privada "carnets"
drop policy if exists carnets_subir  on storage.objects;
drop policy if exists carnets_ver    on storage.objects;
drop policy if exists carnets_borrar on storage.objects;
create policy carnets_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'carnets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy carnets_ver on storage.objects for select to authenticated
  using (bucket_id = 'carnets' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin()));

-- Comprobación: deben aparecer "vortex" (public = true) y "carnets" (public = false)
select id, public from storage.buckets where id in ('vortex', 'carnets');
