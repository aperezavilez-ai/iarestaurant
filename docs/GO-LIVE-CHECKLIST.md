# Checklist Go-Live — IA·RESTAURANT

**Estado actual estimado:** 90%  
**Meta:** 100% operación comercial estable  
**Última actualización:** 2026-06-16

---

## Criterios de salida (obligatorios)

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Login estable sin errores IndexedDB | ✅ |
| 2 | Popup bloqueante de apertura de turno al ingresar (roles caja/admin) | ✅ |
| 3 | POS bloqueado sin turno abierto | ✅ |
| 4 | Cobro efectivo / tarjeta / mixto | ⬜ Validar en producción |
| 5 | Corte X y Corte Z con impresión | ⬜ Validar en producción |
| 6 | QR comensal → cocina → cobro | ⬜ Validar en producción |
| 7 | PWA reconexión a otra mesa | ⬜ Validar en producción |
| 8 | Móvil POS + Caja + navegación inferior | ⬜ Validar en dispositivo real |
| 9 | 0 bugs críticos abiertos | ⬜ En curso |
| 10 | Monitoreo y respaldo documentados | ⬜ Pendiente |

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

## Día 3 — Bugs críticos

| ID | Descripción | Severidad | Estado |
|----|-------------|-----------|--------|
| — | Registrar aquí incidencias encontradas en Día 2 | — | — |

**Corregido en este sprint:**
- `openRegister` ahora usa `tenant_id` / `sucursal_id` del contexto real (no IDs demo)
- Popup bloqueante de turno al login (no redirección silenciosa al dashboard)
- Turnos de días anteriores sin cerrar: aviso + redirección a Corte Z
- Sync remoto→local de `cash_registers` al consultar turno abierto
- Script `npm run qa:smoke` para validar lógica de turno

---

## Día 4 — Móvil

- [ ] iPhone: safe area tab bar + teclado en montos
- [ ] Android: POS ticket + cobro
- [ ] Cocina KDS en tablet/celular
- [ ] 2 h operación continua sin bloqueos

## Día 5 — Observabilidad

- [ ] Revisar errores en consola producción
- [ ] Confirmar Supabase RLS en tablas críticas
- [ ] Protocolo si falla internet (operar local, reintentar sync)
- [ ] Protocolo si falla impresión (reimprimir desde corte)

## Día 6 — Ensayo general

Simular jornada completa:
- [ ] Apertura 08:00 · fondo $2,000
- [ ] 20+ órdenes mixtas (mostrador + mesas)
- [ ] 3 pedidos QR adicionales
- [ ] 2 movimientos caja (entrada/salida)
- [ ] Corte X intermedio
- [ ] Cierre 23:00 · Corte Z
- [ ] Cuadre: ventas turno = suma pagos

## Día 7 — Go-live

- [ ] Deploy final verificado (`npm run build` OK)
- [ ] Credenciales por rol entregadas
- [ ] Guía operación 1 página al equipo
- [ ] Ventana soporte primeras 4 h
- [ ] Lista mejoras post-lanzamiento (no bloqueantes)

---

## Comandos útiles

```bash
npm run build          # Verificar compilación
npm run dev            # Pruebas locales
npm run supabase:sql   # Migraciones manuales
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
| 3 | 95% | — |
| 4 | 97% | — |
| 5 | 98% | — |
| 6 | 99% | — |
| 7 | 100% | — |
