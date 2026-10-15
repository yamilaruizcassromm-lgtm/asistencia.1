--- 1. Tabla de Alumnos
CREATE TABLE IF NOT EXISTS alumnos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabla de Asistencias (Con restricción UNIQUE para permitir Upsert seguro)
CREATE TABLE IF NOT EXISTS asistencias (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    presente BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_alumno_fecha UNIQUE (alumno_id, fecha)
);

-- Habilitar Row Level Security (RLS) y políticas de acceso abierto
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso publico alumnos" ON alumnos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso publico asistencias" ON asistencias FOR ALL USING (true) WITH CHECK (true);