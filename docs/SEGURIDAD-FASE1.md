# Seguridad — Fase 1 (equipos y licencias)

## Activar en Supabase

Ejecutar migración `021_security_devices.sql`:

```bash
npm run supabase:sql -- supabase/migrations/021_security_devices.sql
```

## Límites por plan

| Plan | Equipos |
|------|---------|
| Básico | 3 |
| Profesional | 8 |
| Enterprise | 25 |

## Comportamiento

1. **Primer equipo** del restaurante → aprobado automáticamente.
2. **Equipos nuevos** → quedan `pendientes` hasta que el admin los apruebe en **Sistema → Equipos autorizados**.
3. **Licencia suspendida** → nadie entra (admin SaaS puede reactivar en `/app/saas`).
4. **admin_saas** → sin límite de dispositivos; panel en `/app/saas`.

## Paneles

- Restaurante: **Configuración** → Equipos autorizados
- Plataforma: **Módulos → Panel SaaS** (`/app/saas`)
