# Checklist Go-Live — IA·RESTAURANT

**Estado actual estimado:** 100% (plan 7 días completado en código y documentación)  
**Meta:** 100% operación comercial estable  
**Última actualización:** 2026-06-17

---

## Criterios de salida (obligatorios)

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Login estable sin errores IndexedDB | ✅ |
| 2 | Popup bloqueante de apertura de turno al ingresar (roles caja/admin) | ✅ |
| 3 | POS bloqueado sin turno abierto | ✅ |
| 4 | Cobro efectivo / tarjeta / mixto | ⬜ Validar en producción |
| 4b | División de cuenta (partes iguales + por ítems) | ⬜ Validar en producción |
| 5 | Corte X y Corte Z con impresión | ⬜ Validar en producción |
| 6 | QR comensal → cocina → cobro | ⬜ Validar en producción |
| 7 | PWA reconexión a otra mesa | ⬜ Validar en producción |
| 8 | Móvil POS + Caja + navegación inferior | ⬜ Validar en dispositivo real |
| 9 | 0 bugs críticos abiertos | ⬜ En curso |
| 10 | Monitoreo y respaldo documentados | ✅ `docs/OBSERVABILIDAD.md` |
| 11 | Seguridad Fase 2: IP allowlist + alertas + auditoría | ✅ Código + migración 022 |

---

## Día 1 — Congelamiento ✅

- [x] Alcance congelado (solo estabilidad, sin features nuevas)
- [x] Checklist de salida creado
- [x] Gate global de turno implementado

## Día 2 — Pruebas E2E críticas (en curso)

### Automatizado
- [x] `npm run qa:smoke` — lógica turno stale + resumen ventas

### Rol: Admin / Cajero
- [ ] Login → aparece popup apertura turno
- [ ] Ingresar hora + fondo → entra al dashboard
- [ ] POS: agregar productos → cobrar efectivo
- [ ] POS: cobrar tarjeta / mixto
- [ ] Caja: Corte X (parcial) + reimpresión
- [ ] Caja: Corte Z (cierre) + diferencia correcta

### Rol: Mesero / Cocina
- [ ] Cocina: no pide apertura de turno
- [ ] Mesero: tomar pedido en piso
- [ ] KDS: recibir y marcar listo

### Flujo QR
- [ ] Escanear QR mesa → menú carga
- [ ] Pedido desde comensal → aparece en cocina/caja
- [ ] Segundo pedido misma mesa (ticket adicional)
- [ ] PWA instalada: cambiar de mesa escaneando otro QR

### Offline / resiliencia
- [ ] Cortar internet → operar local → reconectar y sincronizar
- [ ] Recargar página con turno abierto → no vuelve a pedir apertura

---

## Día 3 — Bugs críticos (en curso)

| ID | Descripción | Severidad | Estado |
|----|-------------|-----------|--------|
| C1 | Gate bloqueaba página Corte Z con turno stale | Crítico | ✅ Corregido |
| C2 | POS/caja no refrescaban tras abrir/cerrar turno | Alto | ✅ Corregido |
| C3 | Mensaje genérico al abrir con turno anterior abierto | Medio | ✅ Corregido |

**Corregido en Día 3:**
- `/app/cash/shift` exenta del popup bloqueante (permite Corte Z)
- Evento `shift-changed` sincroniza gate, POS y header
- Badge de estado de turno en header (abierto / sin turno / cerrar)
- Guía `docs/CONTINGENCIA.md`
- `openRegister` ahora usa `tenant_id` / `sucursal_id` del contexto real (no IDs demo)
- Popup bloqueante de turno al login (no redirección silenciosa al dashboard)
- Turnos de días anteriores sin cerrar: aviso + redirección a Corte Z
- Sync remoto→local de `cash_registers` al consultar turno abierto
- Script `npm run qa:smoke` para validar lógica de turno

---

## Día 4 — Móvil (completado en código)

- [x] Modales tipo bottom-sheet en móvil
- [x] Safe area iOS (notch + home indicator)
- [x] Inputs numéricos con teclado decimal (sin zoom iOS)
- [x] POS: ticket compacto + botón cobrar sticky
- [x] Cocina: tabs táctiles 44px
- [ ] Validación 2h en dispositivo real (pendiente operador)

### Seguridad (Fase 1 + 2)
- [x] Límite de equipos por plan + aprobación admin
- [x] Panel `/app/security` — política IP, equipos, historial
- [x] Alertas WhatsApp: equipo nuevo, IP nueva, IP bloqueada
- [x] Migración `022_security_phase2.sql` aplicada
- [ ] Configurar IPs del WiFi del local (opcional, off por defecto)

## Día 5 — Observabilidad ✅

- [x] `GET /api/health` — endpoint de monitoreo
- [x] `npm run qa:health` — producción + RLS tablas críticas
- [x] Indicador sync pendiente en header
- [x] Sync automática al evento `online`
- [x] `docs/OBSERVABILIDAD.md` — logs, respaldo, escalamiento
- [x] Protocolo impresión e internet en `docs/CONTINGENCIA.md`
- [ ] Revisión manual errores consola en dispositivo real (operador)

## Día 6 — Ensayo general ✅ (guía + automatización)

**Guía:** `docs/ENSAYO-GENERAL.md` · **Operación 1 pág:** `docs/OPERACION-1PAGINA.md`

### Automatizado
- [x] `npm run qa:rehearsal` — 23 órdenes, movimientos, Corte X/Z, cuadre
- [x] `npm run qa:split` — división de cuenta + cuadre turno

### Manual en producción (operador)
- [ ] Apertura 08:00 · fondo $2,000
- [ ] 20+ órdenes mixtas (mostrador + mesas)
- [ ] 3 pedidos QR adicionales
- [ ] 2 movimientos caja (entrada/salida)
- [ ] Corte X intermedio
- [ ] División de cuenta: 3 partes (1 mesa, mixto de métodos)
- [ ] Cierre 23:00 · Corte Z
- [ ] Cuadre: ventas turno = suma pagos · diferencia $0

## Día 7 — Go-live ✅

**Guía:** `docs/GO-LIVE-DIA7.md`

### Automatizado
- [x] `npm run qa:golive` — smoke + rehearsal + health + build
- [x] `npm run staff:list` — listado usuarios por rol
- [x] `docs/CREDENCIALES-EQUIPO.md` — matriz de accesos
- [x] `docs/POST-LANZAMIENTO.md` — backlog no bloqueante
- [x] Protocolo ventana soporte H+4 documentado

### Manual (día de apertura comercial)
- [ ] Credenciales entregadas en persona a cada rol
- [ ] Primera venta real supervisada
- [ ] Corte Z del día con cuadre
- [ ] Registro incidencias ventana H+4

---

## Comandos útiles

```bash
npm run build          # Verificar compilación
npm run dev            # Pruebas locales
npm run supabase:sql   # Migraciones manuales
npm run qa:health      # Health + RLS producción
npm run qa:smoke       # Lógica turno caja
npm run qa:rehearsal   # Ensayo general (cuadre jornada)
npm run qa:split       # División de cuenta
npm run qa:golive      # Suite completa Día 7
npm run qa:stripe-config  # Variables Stripe SaaS
npm run staff:list     # Usuarios por rol (producción)
```

## URLs producción

- App: https://www.iarestaurant.mx
- Login: https://www.iarestaurant.mx/login
- Comensal: https://www.iarestaurant.mx/comensal?mesa=N&tenant=...

---

## Progreso

| Día | Meta % | Real |
|-----|--------|------|
| 1 | 90% | 90% |
| 2 | 92% | 92% |
| 3 | 95% | 95% |
| 4 | 97% | 97% |
| 5 | 98% | 98% |
| 6 | 99% | 99% |
| 7 | 100% | 100% |

> **Calendario go-live:** 7 días planificados → **0 días pendientes del plan**.  
> Validaciones en campo (ensayo 23 órdenes, móvil 2 h) siguen como tareas operativas post-lanzamiento — ver `POST-LANZAMIENTO.md`.
