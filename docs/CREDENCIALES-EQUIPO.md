# Credenciales por rol — IA·RESTAURANT

> **No incluye contraseñas.** Entregar claves por canal privado.  
> Listar usuarios actuales: `npm run staff:list`

## Producción

| Rol | Email | Pantallas |
|-----|-------|-----------|
| `admin_restaurant` | admin@iarestaurant.mx | Dashboard, POS, Caja, Catálogo, Equipo, Seguridad, Ajustes |
| `cajero` | cajero@iarestaurant.com | POS, Caja, Historial ventas |
| `mesero` | mesero@iarestaurant.com | Mesas & Piso, Mesero móvil |
| `cocina` | cocina@iarestaurant.com | Cocina KDS |
| `gerente` | *(crear en Equipo si aplica)* | Igual que admin sin panel SaaS |
| `admin_saas` | *(solo plataforma)* | Panel SaaS `/app/saas` |

## Gestión de contraseñas

```bash
npm run ensure:admin      # Admin restaurante
npm run supabase:staff    # Cajero, mesero, cocina (demo)
npm run staff:list        # Ver quién está activo
```

**Política recomendada:**

1. Contraseña temporal en el primer día
2. Cambio obligatorio en la primera semana (Equipo → usuario)
3. Un dispositivo autorizado por cajero (Seguridad → Equipos)

## Entrega al equipo (checklist)

- [ ] Admin — credencial + guía 1 página
- [ ] Cajero — credencial + apertura de turno
- [ ] Mesero — credencial + mesas
- [ ] Cocina — credencial + KDS (sin turno de caja)

## Login

https://www.iarestaurant.mx/login
