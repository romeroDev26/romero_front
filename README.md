# Transportes Romero Frontend

Este proyecto es una aplicación web desarrollada con **React**, **TypeScript** y **Vite**. Está orientada a la gestión de operaciones para la empresa Transportes Romero, incluyendo módulos de contabilidad, clientes, ventas, inventario, reportes SUNAT, entre otros.

## Estructura de Proyecto (Árbol)

```
transportes-romero-frontend/
├── public/
├── scripts/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── auth/         # Componentes de autenticación y rutas privadas
│   │   ├── common/       # Botones, tablas, inputs, modales, spinner, breadcrumbs, etc.
│   │   ├── layout/       # Sidebar, dashboard y estructura general
│   │   ├── tables/       # Componentes para visualización de datos en tablas
│   │   └── ...           # Otros componentes reutilizables
│   ├── config/           # Configuración de APIs y endpoints
│   ├── features/
│   │   ├── accounting/   # Módulo de contabilidad (componentes, hooks, páginas, servicios, tipos)
│   │   ├── auth/         # Módulo de autenticación (componentes, hooks, páginas)
│   │   ├── cargo/        # Módulo de carga
│   │   ├── clients/      # Gestión de clientes
│   │   ├── creditNotes/  # Notas de crédito
│   │   ├── dashboard/    # Páginas de dashboard
│   │   ├── debitNotes/   # Notas de débito
│   │   ├── expenses/     # Gastos
│   │   ├── finance/      # Finanzas
│   │   ├── fluvial/      # Fluvial
│   │   ├── inventory/    # Inventario
│   │   ├── invoices/     # Facturación
│   │   ├── remissionGuides/ # Guías de remisión
│   │   ├── sales/        # Ventas
│   │   ├── settings/     # Configuración
│   │   ├── sunatReports/ # Reportes SUNAT
│   │   ├── suppliers/    # Proveedores
│   │   └── ...           # Otros módulos funcionales
│   ├── hooks/            # Hooks globales reutilizables
│   ├── lib/              # Librerías y utilidades compartidas
│   ├── services/         # Servicios para APIs y lógica de negocio
│   ├── store/            # Estado global
│   ├── types/
│   │   ├── index.ts      # Tipos globales
│   │   ├── params.ts     # Tipos para parámetros y queries
│   │   └── ...           # Otros tipos específicos
│   ├── utils/            # Funciones utilitarias generales
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

## Principales Dependencias

- **React**: v18+ (moderno, con hooks y componentes funcionales).
- **TypeScript**: Tipado estático para mayor robustez.
- **Vite**: Bundler rápido para desarrollo y producción.
- **TailwindCSS**: Utilidades para estilos rápidos y responsivos.
- **ESLint**: Linter para mantener calidad de código.
- **PostCSS**: Procesador de CSS.
- **React Router**: Navegación entre páginas.
- **Axios**: Cliente HTTP para llamadas a APIs.
- **Otras**: Dependencias específicas para cada módulo (por ejemplo, librerías de tablas, modales, etc.).

## Organización Recomendada

- Mantener cada módulo funcional en `src/features` con sus propios componentes, hooks, servicios y tipos.
- Centralizar servicios en `src/services` para facilitar el mantenimiento y reutilización.
- Usar `src/components/common` para componentes reutilizables en toda la app.
- Definir tipos globales en `src/types` y estados en `src/store`.

## Notas

- El proyecto está pensado para escalar y agregar nuevos módulos fácilmente.
- Se recomienda seguir la misma estructura para futuros proyectos empresariales con React + Vite.
- Las configuraciones de ESLint y Tailwind pueden adaptarse según necesidades específicas.
