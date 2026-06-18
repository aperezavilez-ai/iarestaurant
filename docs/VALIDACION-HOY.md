# Validación en campo — hoy

Checklist de ~90 min en el local con el equipo real.  
**Producción:** https://www.iarestaurant.mx

---

## Antes de empezar (5 min)

- [ ] Vercel redeployado con Stripe + Resend
- [ ] Stripe webhook: evento de prueba → **200**
- [ ] Admin con sesión iniciada

---

## 1. Turno y caja (15 min) — Cajero / Admin

| # | Acción | OK |
|---|--------|-----|
| 1 | Login → popup apertura turno | ⬜ |
| 2 | Fondo $2,000 + hora apertura | ⬜ |
| 3 | Badge **Turno abierto** en header | ⬜ |
| 4 | POS: 3 productos → cobro **efectivo** | ⬜ |
| 5 | POS: cobro **tarjeta** (registro) | ⬜ |
| 6 | POS: cobro **mixto** | ⬜ |
| 7 | Ticket impreso (térmica o navegador) | ⬜ |
| 8 | Caja → Corte X → cuadre parcial | ⬜ |

---

## 2. Mesas y división (15 min) — Mesero + Cajero

| # | Acción | OK |
|---|--------|-----|
| 1 | Mesas → pedido en mesa | ⬜ |
| 2 | Cocina KDS recibe y marca **listo** | ⬜ |
| 3 | Dividir cuenta → **partes iguales** (3) | ⬜ |
| 4 | Cobrar cada parte | ⬜ |
| 5 | Mesa liberada al terminar | ⬜ |

---

## 3. QR comensal (10 min)

| # | Acción | OK |
|---|--------|-----|
| 1 | Escanear QR mesa → menú carga | ⬜ |
| 2 | Pedido desde celular → aparece en cocina | ⬜ |
| 3 | Segundo pedido misma mesa | ⬜ |

---

## 4. Correo y suscripción (10 min) — Admin

| # | Acción | OK |
|---|--------|-----|
| 1 | Ajustes → Correo → **Enviar prueba** | ⬜ |
| 2 | Suscripciones → checkout Stripe (plan) | ⬜ |
| 3 | Plan actualizado tras pago | ⬜ |

---

## 5. Cierre (10 min) — Cajero

| # | Acción | OK |
|---|--------|-----|
| 1 | Caja → contar efectivo físico | ⬜ |
| 2 | Corte Z → diferencia $0 (o anotada) | ⬜ |
| 3 | Ticket Corte Z impreso | ⬜ |

---

## 6. Impresoras (opcional hoy)

`/app/printing` → agregar impresora BT o WiFi → imprimir prueba.

---

## Si algo falla

- Consola: F12 → pestaña Console
- Guía: `docs/CONTINGENCIA.md`
- Anotar: hora, pantalla, mensaje de error

---

*Marcar ⬜ → ✅ al completar. Objetivo: jornada simulada sin bugs críticos.*
