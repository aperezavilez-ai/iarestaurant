# Resend (correos) e impresoras térmicas

Guía de configuración para producción en **www.iarestaurant.mx**.

---

## 1. Resend — alertas por correo

### Paso A — Cuenta y dominio

1. Entra en [resend.com](https://resend.com) y crea cuenta (o inicia sesión).
2. **Domains → Add domain** → `iarestaurant.mx`
3. Agrega los registros DNS que te indique Resend (SPF, DKIM; opcional DMARC).
4. Espera estado **Verified** (puede tardar unos minutos).

### Paso B — API Key

1. **API Keys → Create API Key** (permiso *Sending access*).
2. Copia la clave (`re_…`) — solo se muestra una vez.

### Paso C — Variables en Vercel

**Project → Settings → Environment Variables** (Production + Preview):

| Variable | Valor |
|----------|-------|
| `RESEND_API_KEY` | `re_xxxxxxxx` |
| `RESEND_FROM_EMAIL` | `noreply@iarestaurant.mx` |
| `RESEND_FROM_NAME` | `IA·RESTAURANT` |

También deben existir (ya configuradas):

- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Deployments → Redeploy** tras guardar las variables.

### Paso D — Validar

```bash
npm run qa:resend-config
```

En la app (admin/gerente):

1. **Ajustes → Correo**
2. Activar alertas deseadas (pago completado, pedido listo)
3. Email de destino del restaurante
4. **Enviar correo de prueba**

### Alertas automáticas

| Evento | Cuándo se envía |
|--------|-----------------|
| Pago completado | Tras cobrar en POS (si está activado) |
| Pedido listo | Cocina marca orden lista (si está activado) |

Los envíos quedan registrados en la tabla `notifications`.

---

## 2. Impresoras térmicas — Bluetooth y WiFi

**Ruta en la app:** `/app/printing` (Operación → Impresión)

### Marcas compatibles

| Marca | Bluetooth | WiFi |
|-------|-----------|------|
| Epson TM | ✅ Web Bluetooth | ✅ ePOS (puerto 8008) |
| Star Micronics | ✅ | ✅ webPRNT (puerto 8001) |
| Bixolon | ✅ | ✅ Raw TCP (9100) |
| Citizen | ✅ | ✅ Raw TCP (9100) |
| Xprinter | ✅ | ✅ Raw TCP (9100) |
| ESC/POS genérica | ✅ | ✅ Raw TCP (9100) |

### Requisitos

| Conexión | Requisito |
|----------|-----------|
| **Bluetooth** | Chrome en Android o Windows; emparejar desde la pantalla de impresión |
| **WiFi** | PC/tablet en la **misma red LAN** que la impresora (no funciona vía internet) |

### Configurar una impresora WiFi

1. Imprime la hoja de configuración de red de la impresora (botón en el equipo).
2. Anota la **IP** (ej. `192.168.1.50`).
3. En `/app/printing` → **Agregar impresora**:
   - Marca correcta
   - Rol: Caja / Cocina / Barra
   - Conexión: WiFi
   - IP de la impresora
4. **Imprimir prueba**

### Configurar Bluetooth

1. Enciende la impresora y activa Bluetooth en el dispositivo.
2. `/app/printing` → **Emparejar Bluetooth** (Chrome pedirá seleccionar el dispositivo).
3. Guarda y **Imprimir prueba**.

### Uso en operación

- Al **cobrar en POS**, el ticket intenta la impresora de caja configurada.
- Si falla (sin red, BT desconectado), cae a impresión del navegador (`Ctrl+P` / ventana emergente).
- La configuración se guarda **por navegador** (`localStorage`); repite en cada caja/tablet.

### Solución de problemas

| Problema | Acción |
|----------|--------|
| WiFi no imprime | Verificar misma red; ping a la IP; firewall puerto 8008/8001/9100 |
| BT no aparece | Usar Chrome; Windows/Android; impresora en modo emparejable |
| Ticket en blanco | Revisar ancho papel 58/80 mm en configuración de impresora |
| Solo imprime desde navegador | Revisar `/app/printing` — impresora por defecto de caja activa |

---

## Comandos útiles

```bash
npm run qa:resend-config   # Variables Resend en .env / Vercel
npm run build              # Verificar compilación
```
