# Sistema de Reclutamiento y Selección de RH

Proyecto final de la asignatura de Recursos Humanos — **Universidad APEC (UNAPEC)**.

Aplicación web para gestionar el proceso de reclutamiento: catálogos de competencias, idiomas, capacitaciones y puestos; registro de candidatos con su experiencia laboral; contratación (convierte al candidato en empleado); consulta por criterios y reporte de empleados de nuevo ingreso.

![Listado de candidatos](docs/img/08-candidatos.png)

## Documentación

| Documento | Contenido |
|---|---|
| 📘 [Manual de usuario](docs/MANUAL.md) | Cada pantalla explicada, con capturas |
| ✅ [Pruebas del flujo completo](docs/PRUEBAS.md) | 21 pruebas ejecutadas contra la base de datos real, con resultados |
| 🗄️ [Esquema de base de datos](supabase/schema.sql) | Tablas, restricciones, funciones y políticas de seguridad |

## Tecnologías

Todas open source.

| Capa | Tecnología |
|---|---|
| Interfaz | React 19 · TypeScript · Vite · Tailwind CSS 4 · shadcn/ui (Radix UI) · Lucide |
| Navegación y validación | React Router · Zod |
| Base de datos | PostgreSQL 17 en Supabase |
| Autenticación | Supabase Auth (usuario administrador) |
| Seguridad | Row Level Security (RLS) |
| Lógica en la base de datos | Funciones PL/pgSQL `validar_cedula` y `contratar_candidato` |

**Arquitectura:** la aplicación React se conecta directamente a Supabase con el cliente oficial (`@supabase/supabase-js`), sin un backend intermedio. En el navegador solo se usa la clave pública; la seguridad la imponen las políticas RLS y las restricciones de PostgreSQL.

```
Navegador (React + Vite)  ──supabase-js──▶  Supabase
                                            ├── Auth (inicio de sesión)
                                            ├── API REST (PostgREST)
                                            └── PostgreSQL: tablas + RLS + funciones
```

## Módulos

| Requerimiento | Pantalla |
|---|---|
| Gestión de Competencias | Competencias: registrar, editar, consultar, activar/desactivar |
| Gestión de Idiomas | Idiomas: registrar, editar, consultar, activar/desactivar |
| Gestión de Capacitaciones | Capacitaciones: valida que la fecha hasta sea ≥ la fecha desde |
| Gestión de Puestos | Puestos: valida que el salario mínimo sea ≤ el máximo |
| Gestión de Candidatos | Candidatos: formulario con competencias, capacitaciones y experiencias |
| Gestión de Experiencia Laboral | Dentro del candidato: varias experiencias por candidato |
| Proceso de selección | Candidatos → **Contratar**: crea el empleado en una transacción |
| Consulta por criterios | Consulta de Candidatos: puesto + competencias + capacitaciones |
| Reporte de nuevo ingreso | Reporte de Nuevos Ingresos: por rango de fechas |

<table>
  <tr>
    <td><img src="docs/img/11-candidato-formulario.png" alt="Formulario de candidato"></td>
    <td><img src="docs/img/10-contratar.png" alt="Contratación"></td>
  </tr>
  <tr>
    <td align="center">Registro de candidato con validación de cédula</td>
    <td align="center">Proceso de contratación</td>
  </tr>
  <tr>
    <td><img src="docs/img/13-consulta.png" alt="Consulta por criterios"></td>
    <td><img src="docs/img/14-reporte.png" alt="Reporte de nuevos ingresos"></td>
  </tr>
  <tr>
    <td align="center">Consulta por criterios</td>
    <td align="center">Reporte de nuevos ingresos</td>
  </tr>
</table>

## Validación de cédula dominicana

Implementa el algoritmo entregado por el profesor ([`src/lib/cedula.ts`](src/lib/cedula.ts)):

1. Elimina los guiones y exige exactamente 11 dígitos.
2. Multiplica cada dígito por `1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1`.
3. Si un producto es ≥ 10, suma sus dos dígitos.
4. La cédula es válida si el total es divisible entre 10.

La misma lógica está en PostgreSQL (`validar_cedula`) dentro de una restricción `CHECK`, así que la base de datos rechaza cédulas inválidas aunque alguien salte el formulario. La cédula también es `UNIQUE`.

## Reglas de integridad

- Cédula válida y única en candidatos y empleados.
- Un candidato no puede contratarse dos veces: validación en la función, `UNIQUE` en `empleados.candidato_id` y botón deshabilitado en la interfaz.
- `CHECK` de fechas y salarios coherentes; nombres y descripciones únicos en los catálogos.
- RLS: solo un usuario autenticado puede leer o escribir; el rol anónimo no tiene permisos.

## Instalación

### 1. Base de datos (Supabase)

1. Crear un proyecto en <https://supabase.com>.
2. En **SQL Editor**, ejecutar [`supabase/schema.sql`](supabase/schema.sql) y, opcionalmente, [`supabase/seed.sql`](supabase/seed.sql) (catálogos base).
3. En **Authentication → Users → Add user**, crear el usuario administrador (marcar *Auto Confirm User*).
4. Recomendado: en **Authentication → Sign In / Providers**, desactivar *Allow new users to sign up*.
5. En **Project Settings → API**, copiar la *Project URL* y la clave pública (*anon* o *publishable*).

### 2. Variables de entorno

Copiar `.env.example` como `.env.local` y completar:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica
```

> Nunca uses la clave `service_role` en el frontend.

### 3. Ejecutar

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # compilación de producción
npm run test:cedula  # pruebas del algoritmo de cédula
```

### Visual Studio 2022 / VS Code

- **Visual Studio 2022:** instalar la carga de trabajo *Desarrollo de Node.js*, abrir `reclutamiento-rh.sln` y presionar **F5** (ejecuta `npm run dev`).
- **VS Code:** abrir la carpeta, ejecutar `npm install` y `npm run dev`; `.vscode/launch.json` abre el navegador.

## Estructura

```
reclutamiento-rh/
├── supabase/
│   ├── schema.sql          # tablas, restricciones, funciones y RLS
│   └── seed.sql            # catálogos iniciales (opcional)
├── src/
│   ├── pages/              # una página por módulo
│   ├── components/         # layout, diálogos y componentes compartidos
│   │   └── ui/             # componentes shadcn/ui
│   ├── lib/                # cliente Supabase, validación de cédula, tipos, utilidades
│   └── auth/               # sesión del administrador
├── docs/                   # manual, pruebas y capturas
└── scripts/test-cedula.ts  # pruebas del algoritmo de cédula
```

---

Los nombres y cédulas que aparecen en las capturas son ficticios.
