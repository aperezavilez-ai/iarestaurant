# Guía de contingencia — IA·RESTAURANT

## Sin internet

1. El sistema sigue operando con datos locales (IndexedDB).
2. Los cobros y pedidos se guardan en cola de sincronización.
3. Al recuperar conexión, la sync automática envía pendientes a Supabase.
4. Verifica el indicador **En línea** en el header.

## No aparece popup de apertura de turno

1. Puede haber un **turno ya abierto** hoy → revisa badge "Turno abierto" en header.
2. Si dice **"Cerrar turno"** → hay turno de día anterior sin Corte Z.
3. Ve a **Caja → Gestionar turno** (`/app/cash/shift`) y haz **Corte Z**.
4. Cierra sesión y vuelve a entrar.

## POS no deja cobrar

1. Confirma que el turno esté abierto (badge verde).
2. Si no: abre turno desde el popup al login o en Caja → Turno.
3. Monto en efectivo debe ser ≥ total cuando pagas en efectivo.

## Impresión de ticket / corte no sale

1. Permite **ventanas emergentes** en el navegador para `iarestaurant.mx`.
2. Usa **Reimprimir** en el modal de Corte X.
3. En Corte Z, la impresión se lanza al confirmar el cierre.

## Error de login

1. Verifica correo y contraseña.
2. Si persiste: limpia caché del sitio o prueba ventana de incógnito.
3. Admin: `admin@iarestaurant.mx` (credencial de despliegue).

## QR comensal no carga

1. URL debe incluir `mesa` y `tenant`: `/comensal?mesa=5&tenant=...`
2. Regenera QR desde **Caja → Imprimir QR de mesas**.
3. Comprueba que el menú tenga productos activos.

## Escalamiento

| Severidad | Acción |
|-----------|--------|
| Crítico (no cobra / no abre turno) | Detener cobros, usar Caja manual, reportar |
| Alto (sync lenta) | Seguir operando local, revisar internet |
| Medio (UI móvil) | Usar desktop temporalmente |

---

**Contacto soporte:** revisar logs en consola del navegador (F12) y anotar hora + acción + mensaje de error.
