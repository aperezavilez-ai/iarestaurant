# Go-live — Día 7

**Último día del plan de 7 días.** Tras completar esta lista, el calendario go-live queda en **100%**.

---

## Mañana del lanzamiento

### 1. Verificación técnica (30 min)

```bash
npm run qa:golive
```

Debe pasar: smoke, rehearsal, health y build.

Comprobar en navegador:

- https://www.iarestaurant.mx/api/health → `"status":"ok"`
- Login admin → popup turno → POS cobra

### 2. Credenciales al equipo (15 min)

```bash
npm run staff:list          # Ver usuarios activos
npm run ensure:admin        # Reset admin si hace falta
npm run supabase:staff      # Crear/confirmar cajero, mesero, cocina
```

Entregar a cada persona:

- Email + contraseña temporal
- Rol y pantallas que usa
- Copia de `docs/OPERACION-1PAGINA.md` (impresa o PDF)

| Rol | Email producción | Acceso principal |
|-----|------------------|------------------|
| Admin restaurante | `admin@iarestaurant.mx` | Todo + Seguridad + Ajustes |
| Cajero | `cajero@iarestaurant.com` | POS, Caja, Turno |
| Mesero | `mesero@iarestaurant.com` | Mesas, Piso |
| Cocina | `cocina@iarestaurant.com` | KDS |

> Contraseñas: canal privado (WhatsApp 1:1 o en persona). No compartir en grupos.

### 3. Apertura comercial

1. Admin abre turno (fondo real del día)
2. Cocina en KDS antes del primer cliente
3. QR de mesas visibles y probados (1 pedido test)
4. Cajero en POS listo

---

## Ventana de soporte — primeras 4 horas

| Hora | Responsable | Acción |
|------|-------------|--------|
| H+0 | Admin + soporte | Presencia en local o remoto con laptop |
| H+0–1 | Todos | Primera venta real supervisada |
| H+1–2 | Cajero autónomo; soporte standby | Revisar sync, impresión, QR |
| H+2–4 | Rotación | Anotar incidencias en tabla abajo |

### Registro de incidencias (H+0 a H+4)

| Hora | Usuario | Pantalla | Problema | Resolución |
|------|---------|----------|----------|------------|
| | | | | |

### Escalamiento rápido

| Síntoma | Acción inmediata |
|---------|------------------|
| No cobra | Turno abierto + recargar |
| Sync pendiente > 5 min | Verificar WiFi, no Corte Z hasta 0 |
| QR no llega | Menú activo + recargar KDS |
| Crítico sin workaround | `docs/CONTINGENCIA.md` |

---

## Cierre del Día 7

- [ ] `npm run qa:golive` en verde
- [ ] Health API 200 en producción
- [ ] Credenciales entregadas (4 roles mínimo)
- [ ] Guía 1 página al equipo
- [ ] Primera venta real cobrada
- [ ] Corte Z del día con diferencia documentada
- [ ] Incidencias H+4 registradas (o "ninguna")

---

## Documentos de referencia

| Doc | Uso |
|-----|-----|
| `OPERACION-1PAGINA.md` | Equipo operativo |
| `CONTINGENCIA.md` | Fallos comunes |
| `OBSERVABILIDAD.md` | Monitoreo y logs |
| `ENSAYO-GENERAL.md` | Ensayo completo |
| `POST-LANZAMIENTO.md` | Mejoras no urgentes |

---

**URL:** https://www.iarestaurant.mx  
**Soporte técnico:** consola F12 + hora + captura → revisión remota
