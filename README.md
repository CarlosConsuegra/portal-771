# Portal 771

Portal 771 ya está preparado para funcionar con Supabase en una integración mínima:

- sitio público leyendo `portales` desde Supabase
- auth simple para `/admin`
- listado/create/edit del admin conectados a base de datos real
- soporte de upload de imagen hacia Supabase Storage

## Configuración

1. Copia `.env.example` a `.env.local`.
2. Completa estas variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=images
RESEND_API_KEY=...
CONTACT_NOTIFICATION_TO=...
CONTACT_FROM=...
```

3. En Supabase, crea la tabla, bucket y políticas ejecutando:

```sql
-- ver archivo completo
supabase/schema.sql
```

4. Crea manualmente al menos un usuario admin en Supabase Auth.
   Ese usuario podrá entrar en `/admin/login`.

## Flujo actual

- Público:
  - `/` lee portales publicados desde Supabase
  - `/portal/[id]` resuelve el `id` público usando el `slug`
- Admin:
  - `/admin/login` usa email/password de Supabase Auth
  - `/admin` lista todos los portales
  - `/admin/new` crea un portal
  - `/admin/portal/[id]` edita un portal por `uuid`
- Storage:
  - si en el formulario admin subes `image_file`, se sube al bucket configurado
  - si en el formulario admin subes `audio_file`, se sube al mismo bucket configurado
  - si no subes archivo, se usa `image_url`
- Contacto:
  - `/contacto` guarda mensajes en `contact_messages`
  - después envía una notificación por Resend a `CONTACT_NOTIFICATION_TO`

## Modelo esperado

Tabla `portales`:

- `id uuid primary key`
- `slug text unique`
- `titulo text`
- `narrativa text`
- `mapa_id text`
- `marker_x numeric`
- `marker_y numeric`
- `lat numeric nullable`
- `lng numeric nullable`
- `image_url text`
- `audio_url text nullable`
- `status text`
- `created_at timestamp default now()`

## Desarrollo

```bash
npm install
npm run dev
```

## Validación

```bash
npm run lint
npm run build
```
