# Mejoras post-lanzamiento

Ítems **no bloqueantes** para operar comercialmente. Priorizar según feedback del local.

## Alta prioridad (primeras 2 semanas)

| # | Mejora | Motivo |
|---|--------|--------|
| 1 | Validación móvil 2 h en dispositivo real | POS + caja en celular/tablet del local |
| 2 | Ensayo manual 23 órdenes (`ENSAYO-GENERAL.md`) | Cuadre real si no se hizo en campo |
| 3 | Pasarelas live (MP / Stripe negocio / Clip) | Cobro digital a cuenta del restaurante |
| 4 | WhatsApp alertas en número del gerente | Cocina, cobro, seguridad |
| 5 | IP allowlist WiFi del local (opcional) | Seguridad `/app/security` |

## Media prioridad (mes 1)

| # | Mejora | Motivo |
|---|--------|--------|
| 6 | Facturación CFDI producción (PAC) | Tickets fiscales |
| 7 | Rotación contraseñas del personal | Seguridad operativa |
| 8 | Impresoras térmicas dedicadas | Velocidad en rush |
| 9 | Inventario kardex en uso diario | Costos y mermas |
| 10 | Reportes BI export PDF programados | Gerencia |

## Baja prioridad / roadmap

| Módulo | Estado actual |
|--------|----------------|
| Promociones / happy hour | Placeholder |
| RRHH turnos | Placeholder |
| Franquicias multi-sucursal | Placeholder |
| Antifraude IA | Placeholder |
| API pública / webhooks | Placeholder |
| i18n multi-idioma | Placeholder |
| Data warehouse | Solo admin SaaS |

## Deuda técnica conocida

- Bundle JS > 500 kB — code-splitting futuro
- Algunos módulos en menú sin pantalla real (filtrados en producción)
- Índice único admin por tenant — pendiente limpieza duplicados legacy

## Cómo priorizar

1. Incidencias de la ventana H+4 del go-live
2. Lo que el cajero pide cada día
3. ROI directo (menos tiempo por cobro, menos errores de turno)

---

*Actualizar este documento al cierre de cada sprint post-lanzamiento.*
