# Ensayo general — Día 6 Go-live

Simula una **jornada completa** en producción antes del go-live. Duración estimada: **2–3 horas** con 3 roles.

## Roles

| Rol | Usuario sugerido | Pantallas |
|-----|-------------------|-----------|
| Cajero / Admin | `admin@iarestaurant.mx` | POS, Caja, Turno |
| Mesero | usuario mesero | Mesas, Piso |
| Cocina | usuario cocina | KDS |

## Pre-requisitos

- [ ] Turno del día anterior cerrado (Corte Z)
- [ ] Catálogo con productos activos
- [ ] Mesas configuradas con QR impreso
- [ ] WhatsApp opcional configurado
- [ ] `npm run qa:rehearsal` y `npm run qa:health` en verde

---

## Cronograma

### 08:00 — Apertura

1. Login como **admin/cajero**
2. Popup bloqueante → fondo **$2,000** → confirmar
3. Verificar badge **Turno abierto** en header
4. Ir a **Caja → Gestionar turno** (`/app/cash/shift`) — confirmar fondo $2,000

**✓ Checkpoint:** POS permite agregar productos

---

### 08:30 – 13:45 — Operación (17 órdenes)

| # | Canal | Acción | Pago |
|---|-------|--------|------|
| 1–5 | POS / mesas | 5 órdenes variadas | 3 efectivo, 1 tarjeta, 1 mixto |
| 6–8 | QR comensal | 3 pedidos desde celular | Efectivo o tarjeta al cobrar |
| 9–12 | Mesas | 4 órdenes con mesero | Mixto |
| 13–17 | POS mostrador | 5 órdenes rápidas | Mayoría efectivo |

**Cocina:** marcar cada pedido como listo en KDS  
**Mesero:** verificar estado de mesas en piso

**✓ Checkpoint:** Cocina recibe QR y mesero sin retraso > 2 min

---

### 12:00 — Movimientos de caja

En **Caja → Turno**:

1. **Entrada** +$500 — nota: "Cambio adicional"
2. **Salida** −$200 — nota: "Compra insumos"

**✓ Checkpoint:** lista de movimientos visible en turno

---

### 14:00 — Corte X (parcial)

1. **Caja → Turno → Corte X**
2. Imprimir / reimprimir ticket
3. Anotar: ventas parciales, efectivo esperado
4. **La caja sigue abierta** — seguir vendiendo

**✓ Checkpoint:** Corte X #1 impreso, POS sigue activo

---

### 14:30 – 22:45 — Operación (6 órdenes más)

| # | Canal | Acción |
|---|-------|--------|
| 18–20 | POS + mesas | 3 órdenes tarde |
| 21–23 | Mixto | 3 órdenes cierre |

Total jornada: **23 órdenes** (incluye 3 QR)

---

### 23:00 — Corte Z (cierre)

1. **Caja → Turno**
2. Contar efectivo en caja
3. Ingresar **efectivo contado**
4. Verificar **diferencia = $0** (o documentar motivo)
5. **Cerrar turno (Corte Z)** → imprimir
6. Confirmar badge **Sin turno** en header

### Fórmula de cuadre

```
Efectivo esperado = Fondo apertura
                  + Ventas en efectivo del turno
                  + Entradas de caja
                  − Salidas de caja

Diferencia = Efectivo contado − Efectivo esperado
```

Ejemplo con datos del ensayo:

| Concepto | Monto |
|----------|-------|
| Fondo apertura | $2,000 |
| Ventas efectivo | (suma del turno) |
| Movimientos netos | +$300 |
| **Efectivo esperado** | **$2,000 + efectivo + $300** |

**✓ Checkpoint final:** `Ventas turno` = suma de todos los pagos cobrados

---

## Validación automatizada

```bash
npm run qa:rehearsal   # Cuadre lógico 23 órdenes + movimientos
npm run qa:smoke       # Turno stale + resumen
npm run qa:health      # Producción + RLS
```

---

## Hoja de firmas

| Paso | Responsable | Hora | OK |
|------|-------------|------|-----|
| Apertura $2,000 | | | ☐ |
| 23 órdenes cobradas | | | ☐ |
| 3 QR → cocina | | | ☐ |
| 2 movimientos caja | | | ☐ |
| Corte X impreso | | | ☐ |
| Corte Z diferencia $0 | | | ☐ |
| Cuadre ventas = pagos | | | ☐ |

---

## Si algo falla

Ver `docs/CONTINGENCIA.md` y `docs/OBSERVABILIDAD.md`.

| Problema | Acción |
|----------|--------|
| POS bloqueado | Abrir turno o cerrar turno stale |
| QR no llega a cocina | Verificar menú activo y realtime |
| Diferencia en Corte Z | Recontar, revisar movimientos y cobros mixtos |
| Sync pendiente en header | Esperar red, no cerrar hasta que baje a 0 |

---

**URLs producción**

- App: https://www.iarestaurant.mx
- Turno: https://www.iarestaurant.mx/app/cash/shift
- Comensal: https://www.iarestaurant.mx/comensal?mesa=N&tenant=TU_TENANT_ID
