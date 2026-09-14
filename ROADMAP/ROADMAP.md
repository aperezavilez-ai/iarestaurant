# ROADMAP: IA RESTAURANT

## Descripción y Propósito
Sistema operativo para restaurantes: POS, mesas, cocina KDS, caja, QR, seguridad, Stripe SaaS, Resend e IA-Support interno.

## Stack Tecnológico Actual
- Frontend: React / Vite, Tailwind CSS, PWA
- Backend/DB: Supabase dedicado (`supabase.gafcore.com/iarestaurant`)
- Email: Resend
- Billing: Stripe (Arranque / Comando)
- Despliegue: Vercel → https://www.iarestaurant.mx

## Regla Operativa Estricta (Invariante)

> **Al finalizar cualquier tarea:** commit + push, despliegue Vercel, sincronizar Supabase si aplica, actualizar este ROADMAP.

---

## Completado (2026-09-14)

- [x] Admin propietario restaurado: `alfonsoavilery@icloud.com` (sin ban; scripts ya no migran a admin@iarestaurant.mx)
- [x] Vercel env GafCore corregido: `VITE_SUPABASE_URL=…/iarestaurant`, anon key alineada, `SUPABASE_SERVICE_ROLE_KEY` sin “Needs Attention”
- [x] Admin **sin** apertura de turno obligatoria (solo cajero/gerente/supervisor)
- [x] Turno stale (ago 2026) cerrado en producción
- [x] IA-Support productivo (`/app/ia`) con conocimiento 0–100% del sistema
- [x] Copiloto enlazado a IA-Support
- [x] Resend + Stripe + impresoras BT/WiFi
- [x] Fix parpadeo (contexto estable, live ops aislado)
- [x] QA: smoke, split, rehearsal, health, ia-support, build

## Pendiente / post-lanzamiento

- [ ] Validación en campo (`docs/VALIDACION-HOY.md`)
- [ ] WhatsApp alertas al gerente
- [ ] CFDI PAC producción
- [ ] Pasarelas live embebidas (hoy: enlaces externos)
- [ ] Gateway MCP GAFCORE (auth/conexión MCP caído en esta sesión — IA interna no depende de él)
- [ ] Code-splitting bundle > 500 kB

## Módulos IA

| Pieza | Estado |
|-------|--------|
| Copiloto panel (insights en vivo) | ✅ |
| IA-Support chat (guía operativa) | ✅ `/app/ia` |
| Demo `iaPages.tsx` | Legacy; no usar en producción |

## URLs clave

- App: https://www.iarestaurant.mx
- IA-Support: https://www.iarestaurant.mx/app/ia
- Login: https://www.iarestaurant.mx/login
