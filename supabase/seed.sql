-- Datos iniciales OPCIONALES: solo catálogos base.
-- No se insertan candidatos ni empleados; esos se registran desde la aplicación.
-- Ejecutar después de schema.sql.

insert into public.competencias (descripcion) values
  ('Trabajo en equipo'),
  ('Comunicación efectiva'),
  ('Liderazgo'),
  ('Resolución de problemas'),
  ('Programación'),
  ('Atención al cliente')
on conflict do nothing;

insert into public.idiomas (nombre) values
  ('Español'),
  ('Inglés'),
  ('Francés')
on conflict do nothing;
