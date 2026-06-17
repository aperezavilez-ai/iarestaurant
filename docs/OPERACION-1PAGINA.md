# IA·RESTAURANT — Guía rápida de operación

## Inicio de turno (cajero / admin)

1. Entrar en https://www.iarestaurant.mx/login
2. Completar popup: **hora de apertura** + **fondo en efectivo**
3. Confirmar badge verde **Turno abierto** en la barra superior

## Cobrar en POS

1. **POS** → agregar productos al ticket
2. **Cobrar** → elegir método (efectivo / tarjeta / mixto)
3. En efectivo: ingresar monto recibido → confirmar cambio
4. Ticket impreso automáticamente (permite pop-ups)

## Dividir cuenta (mesa)

1. **Mesas** → seleccionar mesa con orden → **Dividir cuenta**
2. **Partes iguales** o **Por ítems** (asignar cada producto a un comensal)
3. Cobrar **cada parte** por separado (efectivo / tarjeta / mixto en POS)
4. La mesa se libera cuando todas las partes están cobradas

## Mesas y comensal

- **Mesero:** Mesas & Piso → tomar pedido por mesa
- **Comensal:** QR en mesa → menú móvil → pedido a cocina
- **Cocina (KDS):** marcar platillos listos

## Caja durante el día

| Acción | Dónde |
|--------|-------|
| Corte X (parcial) | Caja → Gestionar turno |
| Entrada / salida efectivo | Caja → Turno → botones +/− |
| Ver ventas del turno | Caja → Turno (resumen) |

## Cierre de turno (Corte Z)

1. Caja → **Gestionar turno**
2. Contar efectivo físico en caja
3. Ingresar monto contado → revisar **diferencia**
4. **Cerrar turno (Corte Z)** → imprimir ticket
5. No dejar turno abierto al salir

## Indicadores en pantalla

| Indicador | Significado |
|-----------|-------------|
| En línea | Internet OK |
| Sin red | Operando local; sync al volver red |
| N sync | Operaciones pendientes de subir — esperar antes de Corte Z |
| Turno abierto | Puedes cobrar |
| Sin turno | Abrir turno antes de cobrar |

## Problemas frecuentes

- **No deja cobrar** → abrir turno o cerrar turno de ayer (Corte Z)
- **No imprime** → configurar impresora en **Operación → Impresión** (`/app/printing`); si no hay térmica, permitir ventanas emergentes
- **QR no carga** → regenerar desde Caja → QR mesas
- **No llegan correos** → Ajustes → Correo → prueba; verificar Resend en Vercel (`docs/RESEND-E-IMPRESORAS.md`)

## Correo y impresoras

| Tarea | Dónde |
|-------|-------|
| Activar alertas email + prueba | Ajustes → Correo |
| Agregar impresora BT/WiFi | Operación → Impresión |
| Guía completa Resend + marcas | `docs/RESEND-E-IMPRESORAS.md` |

## Contacto soporte

Anotar: hora, pantalla, mensaje de error (F12 → Consola).  
Guía completa: `docs/CONTINGENCIA.md`
