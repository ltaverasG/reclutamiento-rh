# Pruebas del flujo completo — Sistema de Reclutamiento y Selección de RH

**Fecha de ejecución:** 08/10/2026
**Entorno:** aplicación local (`npm run dev`, `http://localhost:5173`) conectada al proyecto real de Supabase `reclutamiento-rh` (PostgreSQL 17, región us-east-1).
**Usuario:** administrador `admin@reclutamiento.com` (Supabase Auth).
**Método:** cada paso se ejecutó desde la interfaz web. Los resultados se verificaron en pantalla y, cuando aplica, con una consulta directa a la base de datos.

> Los datos usados son de prueba. La cédula `001-0000009-0` es un número construido para cumplir el algoritmo de validación; no pertenece a ninguna persona.

---

## Resumen

| # | Requerimiento (presentación) | Prueba | Resultado |
|---|---|---|---|
| 1 | Gestión de Idiomas | Registrar "Portugués" | ✅ Guardado (ID 4) |
| 2 | Gestión de Idiomas | Registrar "español" (duplicado, otra capitalización) | ✅ Rechazado: *"Ya existe un registro con esos datos (valor duplicado)."* |
| 3 | Gestión de Competencias | Catálogo inicial cargado (6 competencias) | ✅ Visible en Dashboard y formularios |
| 4 | Gestión de Capacitaciones | Fecha hasta anterior a fecha desde | ✅ Rechazado: *"La fecha hasta no puede ser anterior a la fecha desde"* |
| 5 | Gestión de Capacitaciones | Registrar "Ingeniería de Software", Grado, 15/01/2018 – 15/12/2022, UNAPEC | ✅ Guardado (ID 1) |
| 6 | Gestión de Puestos | Salario mínimo 90,000 > máximo 45,000 | ✅ Rechazado: *"El salario máximo debe ser mayor o igual al mínimo"* |
| 7 | Gestión de Puestos | Registrar "Desarrollador Full Stack", riesgo Medio, RD$45,000 – RD$90,000 | ✅ Guardado (ID 1) |
| 8 | Gestión de Candidatos | Guardar con cédula inválida `001-0000009-1` | ✅ Bloqueado: *"La cédula no es válida"* |
| 9 | Gestión de Candidatos + Experiencia Laboral | Registrar candidato con cédula válida, 2 competencias, 1 capacitación y 1 experiencia laboral | ✅ Guardado (ID 1), relaciones verificadas en BD |
| 10 | Gestión de Candidatos | Registrar otro candidato con la misma cédula | ✅ Rechazado: *"Ya existe un candidato registrado con esta cédula"* |
| 11 | Consulta por criterios | Puesto + "Programación" + "Ingeniería de Software" | ✅ 1 candidato encontrado |
| 12 | Consulta por criterios | Mismos filtros + "Liderazgo" (el candidato no la tiene) | ✅ 0 candidatos — los filtros se combinan correctamente |
| 13 | Proceso de selección | Contratar: ingreso 05/10/2026, salario RD$72,000 | ✅ Empleado creado; candidato pasa a "Contratado" |
| 14 | Proceso de selección | Botón "Contratar" tras contratar | ✅ Deshabilitado, muestra "Contratado" |
| 15 | Proceso de selección | Llamar la función de contratación otra vez, saltando la interfaz | ✅ Rechazado por el servidor: *"El candidato ya fue contratado"* |
| 16 | Empleados | Listado de empleados | ✅ Muestra cédula, nombre, ingreso, departamento, puesto, salario y estado |
| 17 | Reporte de nuevo ingreso | Rango 01/10/2026 – 31/10/2026 | ✅ 1 empleado, total RD$72,000.00 |
| 18 | Reporte de nuevo ingreso | Rango 01/09/2026 – 30/09/2026 | ✅ 0 empleados: *"No hubo ingresos en ese período."* |
| 19 | Reporte de nuevo ingreso | Fecha final anterior a la inicial | ✅ Rechazado: *"La fecha final no puede ser anterior a la inicial"* |
| 20 | Seguridad (RLS) | Leer candidatos por la API sin iniciar sesión | ✅ HTTP 401 — *permission denied* |
| 21 | Seguridad (RLS) | Ejecutar la contratación por la API sin iniciar sesión | ✅ HTTP 401 — *permission denied for function contratar_candidato* |

**21 de 21 pruebas superadas.**

---

## Detalle del escenario principal

### 1. Catálogos
- **Competencias (6):** Trabajo en equipo, Comunicación efectiva, Liderazgo, Resolución de problemas, Programación, Atención al cliente.
- **Idiomas (4):** Español, Inglés, Francés, Portugués.
- **Capacitación:** Ingeniería de Software — Grado — UNAPEC — 15/01/2018 a 15/12/2022.
- **Puesto:** Desarrollador Full Stack — Riesgo Medio — RD$45,000.00 a RD$90,000.00 — Activo.

### 2. Registro del candidato
| Campo | Valor |
|---|---|
| Cédula | 001-0000009-0 (se guarda como `00100000090`) |
| Nombre | Candidato de Prueba |
| Puesto al que aspira | Desarrollador Full Stack |
| Departamento | Tecnología |
| Salario aspirado | RD$70,000.00 |
| Recomendado por | Departamento de RH |
| Competencias | Programación, Trabajo en equipo |
| Capacitaciones | Ingeniería de Software |
| Experiencia laboral | Empresa Ejemplo SRL — Desarrollador Junior — 09/01/2023 a 30/06/2025 — RD$35,000.00 |

Verificación en base de datos (tablas `candidatos`, `candidato_competencias`, `candidato_capacitaciones`, `experiencias_laborales`): todos los datos y relaciones quedaron guardados.

### 3. Validación de cédula
Para `001-0000009-0` se aplican los multiplicadores `1,2,1,2,1,2,1,2,1,2,1`:

| Dígito | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 9 | 0 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Multiplicador | 1 | 2 | 1 | 2 | 1 | 2 | 1 | 2 | 1 | 2 | 1 |
| Producto | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 18 → 1+8 = **9** | 0 |

Total = 1 + 9 = **10**, divisible entre 10 → **válida**.
Con el último dígito en 1 el total sería 11 → **inválida** (prueba #8).

La validación se aplica en el formulario (`src/lib/cedula.ts`) y también en la base de datos (función `validar_cedula` dentro de un `CHECK`), por lo que una cédula inválida no puede guardarse por ninguna vía.

### 4. Contratación
Desde **Candidatos → Contratar** se abrió el formulario con los datos del candidato (nombre, cédula, puesto, departamento), el rango salarial del puesto como referencia y los campos de fecha de ingreso y salario mensual.

Al confirmar, la función `contratar_candidato` ejecutó en **una sola transacción**:
1. Inserción en `empleados`: cédula `00100000090`, Candidato de Prueba, ingreso 2026-10-05, Tecnología, Desarrollador Full Stack, RD$72,000.00, Activo.
2. Actualización del candidato a estado **Contratado**.

La doble contratación está bloqueada en tres niveles: botón deshabilitado en la interfaz, validación dentro de la función y restricción `UNIQUE` sobre `empleados.candidato_id`.

### 5. Reporte de nuevos ingresos
Rango 01/10/2026 – 31/10/2026:

| Nombre | Cédula | Departamento | Puesto | Fecha de ingreso | Salario |
|---|---|---|---|---|---|
| Candidato de Prueba | 001-0000009-0 | Tecnología | Desarrollador Full Stack | 05/10/2026 | RD$72,000.00 |
| **Total** | | | | | **RD$72,000.00** |

---

## Comprobaciones adicionales
- **Pruebas unitarias de la cédula:** `npm run test:cedula` (10 casos, todos correctos).
- **Compilación:** `npm run build` sin errores de TypeScript.
- **Asesor de seguridad de Supabase:** 0 advertencias (RLS activa en las 9 tablas).
- **Diseño responsive:** las pruebas se hicieron con el navegador a 610 px de ancho; el menú lateral se oculta tras el botón ☰ y las tablas se desplazan horizontalmente.
