# Supabase CLI y scripts admin

Con esto el asistente (y tú) pueden administrar Supabase **sin copiar SQL manual** en el dashboard.

## 1. Service role (usuarios Auth)

Supabase → **Settings → API** → copia `service_role` (secreta).

En `.env` o `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Comandos

```powershell
# Crear usuario admin confirmado
node scripts/supabase-admin.mjs create-user alfonsoavilery@icloud.com "Calurore1028@" "Alfonso Avilery" admin_restaurant

# Confirmar email
node scripts/supabase-admin.mjs confirm-user alfonsoavilery@icloud.com

# Listar usuarios Auth
node scripts/supabase-admin.mjs list-users
```

## 2. Access token (SQL remoto + link CLI)

https://supabase.com/dashboard/account/tokens → **Generate new token**

En `.env`:

```env
SUPABASE_ACCESS_TOKEN=sbp_...
```

### Ejecutar SQL desde terminal

```powershell
node scripts/run-sql.mjs "SELECT email, role FROM public.users"
node scripts/run-sql.mjs supabase/migrations/004_auth_production.sql
```

### Vincular CLI al proyecto

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_..."
npx supabase link --project-ref pssycnwgolxiwoyzdsdg
npx supabase db push
```

## 3. Variables ya configuradas

| Variable | Uso |
|----------|-----|
| `VITE_SUPABASE_URL` | App + scripts |
| `VITE_SUPABASE_ANON_KEY` | App cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin Auth (scripts) |
| `SUPABASE_ACCESS_TOKEN` | SQL remoto + CLI link |

**Nunca** subas `service_role` ni `ACCESS_TOKEN` a GitHub. `.env` ya está en `.gitignore`.
