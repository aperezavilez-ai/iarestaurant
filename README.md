# 🍽 IA-Restaurant — SaaS POS Empresarial

Sistema POS multi-tenant de nivel corporativo para restaurantes. Construido con React + TypeScript + Supabase.

## 🚀 Inicio Rápido en Cursor

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Edita .env con tus credenciales de Supabase
```

### 3. Configurar base de datos
1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. En el SQL Editor, ejecuta el archivo: `supabase/migrations/001_initial_schema.sql`
3. Copia la URL y ANON KEY a tu `.env`

### 4. Ejecutar el proyecto
```bash
npm run dev
```

## 🌐 Despliegue (GitHub + Vercel + Supabase)

Guía paso a paso: **[docs/DESPLIEGUE-COMPLETO.md](docs/DESPLIEGUE-COMPLETO.md)**

Resumen:
1. Push del código a GitHub
2. Importar repo en Vercel (build: `npm run build`, output: `dist`)
3. Variables en Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`
4. Migraciones SQL 001–004 en Supabase + Auth URLs + Realtime

### 5. Cuentas demo (sin configurar Supabase)
El proyecto incluye cuentas de demostración para explorar el sistema:

| Rol | Email | Password |
|-----|-------|----------|
| Admin Restaurante | admin@iarestaurant.com | demo123 |
| Cajero | cajero@iarestaurant.com | demo123 |
| Mesero | mesero@iarestaurant.com | demo123 |
| Cocina | cocina@iarestaurant.com | demo123 |

## 📋 Módulos incluidos (MVP — Fases 1-14)

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| ✅ Dashboard | Completo | Métricas en tiempo real |
| ✅ Punto de Venta | Completo | Carrito, pagos, cobro |
| ✅ Mesas | Completo | Mapa visual del piso |
| ✅ Kitchen KDS | Completo | Pantalla de cocina |
| ✅ Catálogo | Completo | Productos y categorías |
| ✅ Reportes | Completo | Gráficas semanales |
| ✅ Configuración | Completo | Ajustes del sistema |
| 🔧 Caja | En desarrollo | Cortes de caja |
| 🔧 Usuarios | En desarrollo | Gestión de personal |
| 🔧 Sucursales | En desarrollo | Multi-sucursal |

## 🗄 Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Estado:** Zustand
- **Gráficas:** Recharts
- **Routing:** React Router v6
- **Validación:** Zod + React Hook Form

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── ui/          # Componentes base (Button, Card, Modal, etc.)
│   ├── layout/      # Sidebar, Header, AppLayout
│   └── ...
├── pages/           # Páginas principales
├── services/        # Lógica de acceso a datos (Supabase)
├── store/           # Estado global (Zustand)
├── types/           # Tipos TypeScript
└── lib/             # Utilities y configuración
supabase/
└── migrations/      # Scripts SQL versionados
```

## 🔐 Seguridad

- Row Level Security (RLS) activado en todas las tablas
- Aislamiento absoluto por tenant_id (UUID v4)
- Auditoría inmutable de todas las operaciones
- Autenticación vía Supabase Auth

## 📈 Roadmap — 45 Fases

Ver documento completo: `IA-Restaurant-Prompt-Maestro.docx`

---

Desarrollado con IA-Restaurant SaaS Framework © 2024
