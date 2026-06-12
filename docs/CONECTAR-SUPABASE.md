# Conectar IA·RESTAURANT con Supabase

## Paso 1 — Crear proyecto Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. Anota **Project URL** y **anon public key**

## Paso 2 — Variables de entorno

```bash
cp .env.example .env
```

Edita `.env`:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-real
```

Reinicia el servidor: `npm run dev`

## Paso 3 — Ejecutar migraciones SQL

En **Supabase → SQL Editor**, ejecuta en orden:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_seed_data.sql`
3. `supabase/migrations/003_qr_flow_realtime.sql`
4. `supabase/migrations/004_auth_production.sql`

> Despliegue completo GitHub + Vercel: ver [`DESPLIEGUE-COMPLETO.md`](./DESPLIEGUE-COMPLETO.md)

## Paso 4 — Habilitar Realtime

En **Database → Publications → supabase_realtime**, activa:

- `qr_orders`
- `waiter_alerts`
- `orders`
- `order_items`

## Paso 5 — Crear usuario admin (Auth)

En **Authentication → Users → Add user**:

- Email: `alfonsoavilery@icloud.com`
- Password: tu contraseña

Luego en SQL Editor, vincula el perfil:

```sql
INSERT INTO users (id, tenant_id, email, full_name, role, sucursal_id)
VALUES (
  'UUID-DEL-USUARIO-AUTH',
  '00000000-0000-0000-0000-000000000001',
  'alfonsoavilery@icloud.com',
  'Alfonso',
  'admin_restaurant',
  '00000000-0000-0000-0000-000000000002'
);
```

## Paso 6 — Verificar conexión

- El banner en el header debe mostrar **"Supabase conectado"**
- Login con credenciales reales (no demo)
- Flujo QR sincroniza entre dispositivos vía Realtime

## Modo híbrido

| Sin `.env` | Con `.env` configurado |
|------------|------------------------|
| IndexedDB + localStorage | Supabase + Realtime |
| Credenciales demo | Auth Supabase |
| BroadcastChannel entre pestañas | Realtime multi-dispositivo |

## Flujo QR con Supabase

```
Comensal (/comensal?mesa=5)
  → insert qr_orders
  → insert waiter_alerts
Caja (/caja) — Realtime recibe pedido
  → update qr_orders → validate
  → insert orders + order_items (cocina)
Cocina (/app/kitchen) — Realtime
Mesero (/mesero) — Realtime alertas
```
