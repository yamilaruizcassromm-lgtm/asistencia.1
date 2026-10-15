-- 1. Eliminar políticas si ya existen para evitar conflictos
DROP POLICY IF EXISTS "Permitir acceso publico alumnos" ON alumnos;
DROP POLICY IF EXISTS "Permitir acceso publico asistencias" ON asistencias;

-- 2. Crear tabla de Alumnos (si no existe)
CREATE TABLE IF NOT EXISTS alumnos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Crear tabla de Asistencias (si no existe)
CREATE TABLE IF NOT EXISTS asistencias (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    presente BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_alumno_fecha UNIQUE (alumno_id, fecha)
);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas de acceso público
CREATE POLICY "Permitir acceso publico alumnos" ON alumnos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso publico asistencias" ON asistencias FOR ALL USING (true) WITH CHECK (true);