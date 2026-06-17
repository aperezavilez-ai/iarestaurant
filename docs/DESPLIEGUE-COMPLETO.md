# Despliegue completo — GitHub + Vercel + Supabase

Guía para conectar los tres servicios de IA·RESTAURANT.

---

## Arquitectura

```
GitHub (código)  →  Vercel (hosting)  →  Usuario
                         ↓
                    Supabase (DB + Auth + Realtime)
```

| Servicio | Rol |
|----------|-----|
| **GitHub** | Repositorio y versiones |
| **Vercel** | Build + hosting de la PWA React |
| **Supabase** | PostgreSQL, Auth, Realtime, RLS |

---

## PASO 1 — Subir código a GitHub

En la carpeta del proyecto (PowerShell):

```powershell
cd "d:\PROGRAMAS IA\IA RESTAURANT"
git init
git add .
git commit -m "IA-RESTAURANT: app lista para Vercel + Supabase"
```

En GitHub: **New repository** → nombre `ia-restaurant` (sin README).

```powershell
git remote add origin https://github.com/TU-USUARIO/ia-restaurant.git
git branch -M main
git push -u origin main
```

---

## PASO 2 — Conectar Vercel con GitHub

1. [vercel.com](https://vercel.com) → **Add New Project**
2. **Import** tu repo `ia-restaurant` de GitHub
3. Framework: **Vite** (auto-detectado)
4. Build: `npm run build` · Output: `dist`
5. **Deploy** (primera vez fallará o irá en modo demo sin env vars)

---

## PASO 3 — Variables de entorno en Vercel

**Vercel → Project → Settings → Environment Variables**

Añade estas 3 (marca Production + Preview + Development):

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://XXXX.supabase.co` (de Supabase → Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` (anon public key) |
| `VITE_APP_URL` | `https://tu-proyecto.vercel.app` (tu URL de Vercel) |

Luego: **Deployments → Redeploy** (necesario para que Vite incluya las variables en el build).

### Correos (Resend) — servidor

| Variable | Valor |
|----------|-------|
| `RESEND_API_KEY` | `re_…` (resend.com → API Keys) |
| `RESEND_FROM_EMAIL` | `noreply@iarestaurant.mx` (dominio verificado) |
| `RESEND_FROM_NAME` | `IA·RESTAURANT` |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (requerido por `/api/email/send`) |

Guía detallada: `docs/RESEND-E-IMPRESORAS.md` · validar: `npm run qa:resend-config`

---

## PASO 4 — Configurar Supabase

### 4.1 Migraciones SQL

En **Supabase → SQL Editor**, ejecuta **en orden**:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_seed_data.sql`
3. `supabase/migrations/003_qr_flow_realtime.sql`
4. `supabase/migrations/004_auth_production.sql`

### 4.2 Realtime

**Database → Publications → supabase_realtime** — activa:

- `qr_orders`, `waiter_alerts`, `orders`, `order_items`

### 4.3 Auth URLs (crítico para Vercel)

**Authentication → URL Configuration**

| Campo | Valor |
|-------|-------|
| **Site URL** | `https://tu-proyecto.vercel.app` |
| **Redirect URLs** | `https://tu-proyecto.vercel.app/**` |
| | `http://localhost:5173/**` |

### 4.4 Usuario admin

**Authentication → Users → Add user** con tu email y contraseña.

Si el trigger de `004` no corrió, vincula manualmente:

```sql
INSERT INTO users (id, tenant_id, email, full_name, role, sucursal_id, is_active)
VALUES (
  'UUID-DEL-USUARIO-AUTH',
  '00000000-0000-0000-0000-000000000001',
  'tu@email.com',
  'Tu Nombre',
  'admin_restaurant',
  '00000000-0000-0000-0000-000000000002',
  true
);
```

---

## PASO 5 — Local (desarrollo)

```powershell
cp .env.example .env
# Edita .env con las mismas credenciales Supabase
npm install
npm run dev
```

Login debe mostrar **"Supabase conectado"** en la pantalla de acceso.

---

## PASO 6 — Verificar producción

Checklist en `https://tu-proyecto.vercel.app`:

- [ ] Login muestra **Supabase conectado** (no "Modo local")
- [ ] Login con usuario real de Supabase Auth
- [ ] Dashboard carga datos
- [ ] POS cobra y persiste (con sync)
- [ ] Flujo QR: `/comensal?mesa=5` + `/caja` + `/mesero` sincronizan vía Realtime
- [ ] PWA instalable (manifest + service worker)

---

## Flujo CI/CD automático

Cada `git push` a `main`:

1. GitHub notifica a Vercel
2. Vercel ejecuta `npm run build`
3. Despliega `dist/` en CDN global
4. La app usa Supabase con las env vars del proyecto

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| "Modo local" en producción | Faltan env vars en Vercel → añadir y **Redeploy** |
| Login falla con credenciales correctas | Usuario Auth sin fila en `public.users` → ejecutar SQL paso 4.4 |
| Rutas 404 al recargar | `vercel.json` ya incluye rewrites SPA |
| Realtime no sincroniza | Activar tablas en Publications + RLS |
| Recuperar contraseña no redirige | Verificar Redirect URLs en Supabase Auth |

---

## Archivos clave del proyecto

| Archivo | Propósito |
|---------|-----------|
| `vercel.json` | SPA routing + cache PWA |
| `.env.example` | Plantilla de variables |
| `src/lib/config.ts` | Detecta Supabase configurado |
| `docs/CONECTAR-SUPABASE.md` | Detalle técnico Supabase |
