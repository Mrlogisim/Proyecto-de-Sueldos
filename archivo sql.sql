-- ============================================
-- TABLA: CONVENIOS COLECTIVOS
-- ============================================
CREATE TABLE convenios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    numero VARCHAR(50) NOT NULL UNIQUE,
    salario_basico DECIMAL(12, 2) NOT NULL,
    aporte_jubilacion DECIMAL(5, 2) NOT NULL,
    aporte_obra_social DECIMAL(5, 2) NOT NULL,
    aporte_sindical DECIMAL(5, 2) NOT NULL,
    aporte_pami DECIMAL(5, 2) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_convenios_numero ON convenios(numero);
CREATE INDEX idx_convenios_activo ON convenios(activo);

-- ============================================
-- TABLA: TIPOS DE HORAS EXTRAS
-- ============================================
CREATE TABLE horas_extras (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    multiplicador DECIMAL(4, 2) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_multiplicador_positivo CHECK (multiplicador > 0)
);

-- Índices
CREATE INDEX idx_horas_extras_activo ON horas_extras(activo);

-- ============================================
-- TABLA: FERIADOS
-- ============================================
CREATE TABLE feriados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    fecha DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_tipo_feriado CHECK (tipo IN ('nacional', 'provincial', 'inamovible', 'trasladable'))
);

-- Índices
CREATE INDEX idx_feriados_fecha ON feriados(fecha);
CREATE INDEX idx_feriados_tipo ON feriados(tipo);
CREATE INDEX idx_feriados_activo ON feriados(activo);

-- ============================================
-- TABLA: ADICIONALES (BONOS)
-- ============================================
CREATE TABLE adicionales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    valor DECIMAL(12, 2) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_tipo_adicional CHECK (tipo IN ('fijo', 'porcentaje')),
    CONSTRAINT chk_valor_positivo CHECK (valor >= 0)
);

-- Índices
CREATE INDEX idx_adicionales_tipo ON adicionales(tipo);
CREATE INDEX idx_adicionales_activo ON adicionales(activo);

-- ============================================
-- TRIGGERS PARA ACTUALIZAR fecha_actualizacion
-- ============================================

-- Función genérica para actualizar timestamp
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a cada tabla
CREATE TRIGGER trigger_actualizar_convenios
    BEFORE UPDATE ON convenios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_horas_extras
    BEFORE UPDATE ON horas_extras
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_feriados
    BEFORE UPDATE ON feriados
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_adicionales
    BEFORE UPDATE ON adicionales
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Insertar convenio de ejemplo
INSERT INTO convenios (nombre, numero, salario_basico, aporte_jubilacion, aporte_obra_social, aporte_sindical, aporte_pami, descripcion)
VALUES 
('Empleados de Comercio', 'CCT 130/75', 350000.00, 11.00, 3.00, 2.50, 3.00, 'Convenio Colectivo de Trabajo para empleados del sector comercio'),
('Gastronómicos', 'CCT 389/04', 320000.00, 11.00, 3.00, 2.00, 3.00, 'Convenio para trabajadores gastronómicos');

-- Insertar tipos de horas extras
INSERT INTO horas_extras (nombre, multiplicador, descripcion)
VALUES 
('Hora Extra Diurna', 1.50, 'Horas trabajadas en horario diurno (6:00 a 21:00 hs) fuera del horario laboral'),
('Hora Extra Nocturna', 2.00, 'Horas trabajadas en horario nocturno (21:00 a 6:00 hs)'),
('Hora Extra Feriado', 2.00, 'Horas trabajadas en días feriados');

-- Insertar feriados de Argentina 2025
INSERT INTO feriados (nombre, fecha, tipo, descripcion)
VALUES 
('Año Nuevo', '2025-01-01', 'nacional', 'Feriado Nacional Inamovible'),
('Carnaval', '2025-03-03', 'nacional', 'Feriado Nacional'),
('Carnaval', '2025-03-04', 'nacional', 'Feriado Nacional'),
('Día Nacional de la Memoria por la Verdad y la Justicia', '2025-03-24', 'inamovible', 'Feriado Nacional Inamovible'),
('Día del Veterano y de los Caídos en la Guerra de Malvinas', '2025-04-02', 'inamovible', 'Feriado Nacional Inamovible'),
('Viernes Santo', '2025-04-18', 'nacional', 'Feriado Nacional'),
('Día del Trabajador', '2025-05-01', 'inamovible', 'Feriado Nacional Inamovible'),
('Día de la Revolución de Mayo', '2025-05-25', 'inamovible', 'Feriado Nacional Inamovible'),
('Paso a la Inmortalidad del Gral. Martín Miguel de Güemes', '2025-06-16', 'trasladable', 'Feriado Nacional Trasladable'),
('Paso a la Inmortalidad del Gral. Manuel Belgrano', '2025-06-20', 'inamovible', 'Feriado Nacional Inamovible'),
('Día de la Independencia', '2025-07-09', 'inamovible', 'Feriado Nacional Inamovible'),
('Paso a la Inmortalidad del Gral. José de San Martín', '2025-08-18', 'trasladable', 'Feriado Nacional Trasladable'),
('Día del Respeto a la Diversidad Cultural', '2025-10-13', 'trasladable', 'Feriado Nacional Trasladable'),
('Día de la Soberanía Nacional', '2025-11-24', 'trasladable', 'Feriado Nacional Trasladable'),
('Inmaculada Concepción de María', '2025-12-08', 'inamovible', 'Feriado Nacional Inamovible'),
('Navidad', '2025-12-25', 'inamovible', 'Feriado Nacional Inamovible');

-- Insertar adicionales de ejemplo
INSERT INTO adicionales (nombre, tipo, valor, descripcion)
VALUES 
('Presentismo', 'porcentaje', 10.00, 'Bono por asistencia perfecta mensual'),
('Antigüedad (1-5 años)', 'porcentaje', 5.00, 'Adicional por antigüedad de 1 a 5 años'),
('Antigüedad (6-10 años)', 'porcentaje', 10.00, 'Adicional por antigüedad de 6 a 10 años'),
('Antigüedad (más de 10 años)', 'porcentaje', 15.00, 'Adicional por antigüedad superior a 10 años'),
('Bono Productividad', 'fijo', 25000.00, 'Bono por cumplimiento de objetivos'),
('Viáticos', 'fijo', 15000.00, 'Compensación por gastos de movilidad');

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Resumen de convenios con aportes totales
CREATE VIEW vista_convenios_resumen AS
SELECT 
    id,
    nombre,
    numero,
    salario_basico,
    (aporte_jubilacion + aporte_obra_social + aporte_sindical + aporte_pami) AS aporte_total_porcentaje,
    ROUND(salario_basico * (aporte_jubilacion + aporte_obra_social + aporte_sindical + aporte_pami) / 100, 2) AS aporte_total_pesos,
    activo
FROM convenios
WHERE activo = TRUE;

-- Vista: Feriados del año actual
CREATE VIEW vista_feriados_actuales AS
SELECT *
FROM feriados
WHERE EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
AND activo = TRUE
ORDER BY fecha;


-- ============================================
-- CONSULTAS ÚTILES
-- ============================================

-- Ver todos los convenios activos
-- SELECT * FROM vista_convenios_resumen;

-- Ver feriados del año
-- SELECT * FROM vista_feriados_actuales;

-- Ver horas extras ordenadas por multiplicador
-- SELECT * FROM horas_extras WHERE activo = TRUE ORDER BY multiplicador DESC;

-- Ver adicionales por tipo
-- SELECT * FROM adicionales WHERE activo = TRUE ORDER BY tipo, valor DESC;




-- ---------------------------------------------------------------------------------------------


-- SEGUNDA ENTREGA: CONFIGURACIÓN DE DESCUENTOS, VACACIONES Y LICENCIAS 



-- ============================================
-- TABLA: DESCUENTOS
-- ============================================
CREATE TABLE descuentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    valor DECIMAL(12, 2) NOT NULL,
    aplica_aportes BOOLEAN DEFAULT FALSE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_tipo_descuento CHECK (tipo IN ('fijo', 'porcentaje')),
    CONSTRAINT chk_valor_descuento_positivo CHECK (valor >= 0)
);

-- ============================================
-- TABLA: POLITICAS_VACACIONES
-- ============================================
CREATE TABLE politicas_vacaciones (
    id SERIAL PRIMARY KEY,
    antiguedad_minima INTEGER NOT NULL,
    antiguedad_maxima INTEGER,
    dias_base INTEGER NOT NULL,
    dias_adicionales INTEGER DEFAULT 0,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_antiguedad_positiva CHECK (antiguedad_minima >= 0),
    CONSTRAINT chk_dias_positivos CHECK (dias_base > 0)
);

-- ============================================
-- TABLA: TIPOS_LICENCIAS
-- ============================================
CREATE TABLE tipos_licencias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    con_goce_sueldo BOOLEAN DEFAULT TRUE,
    limite_dias INTEGER,
    requiere_certificado BOOLEAN DEFAULT FALSE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLA: CONVENIO_DESCUENTOS (Relación muchos a muchos)
-- ============================================
CREATE TABLE convenio_descuentos (
    id SERIAL PRIMARY KEY,
    convenio_id INTEGER NOT NULL REFERENCES convenios(id),
    descuento_id INTEGER NOT NULL REFERENCES descuentos(id),
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE,
    activo BOOLEAN DEFAULT TRUE,
    UNIQUE(convenio_id, descuento_id, fecha_desde)
);

-- ============================================
-- TABLA: CONVENIO_LICENCIAS (Relación muchos a muchos)
-- ============================================
CREATE TABLE convenio_licencias (
    id SERIAL PRIMARY KEY,
    convenio_id INTEGER NOT NULL REFERENCES convenios(id),
    licencia_id INTEGER NOT NULL REFERENCES tipos_licencias(id),
    activo BOOLEAN DEFAULT TRUE,
    UNIQUE(convenio_id, licencia_id)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_descuentos_activo ON descuentos(activo);
CREATE INDEX idx_descuentos_tipo ON descuentos(tipo);
CREATE INDEX idx_politicas_vacaciones_activo ON politicas_vacaciones(activo);
CREATE INDEX idx_tipos_licencias_activo ON tipos_licencias(activo);
CREATE INDEX idx_tipos_licencias_goce ON tipos_licencias(con_goce_sueldo);
CREATE INDEX idx_convenio_descuentos_activo ON convenio_descuentos(activo);
CREATE INDEX idx_convenio_licencias_activo ON convenio_licencias(activo);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER trigger_actualizar_descuentos
    BEFORE UPDATE ON descuentos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_politicas_vacaciones
    BEFORE UPDATE ON politicas_vacaciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_tipos_licencias
    BEFORE UPDATE ON tipos_licencias
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Descuentos de ejemplo
INSERT INTO descuentos (nombre, tipo, valor, aplica_aportes, descripcion)
VALUES 
('Adelanto de Sueldo', 'fijo', 20000.00, false, 'Adelanto sobre el sueldo del mes en curso'),
('Préstamo Personal', 'fijo', 15000.00, false, 'Cuota de préstamo personal'),
('Aporte Solidario', 'porcentaje', 5.00, true, 'Aporte solidario sobre el salario bruto'),
('Seguro de Vida', 'fijo', 5000.00, true, 'Prima de seguro de vida colectivo'),
('Cuota Sindical', 'porcentaje', 2.00, true, 'Aporte sindical adicional');

-- Políticas de vacaciones de ejemplo
INSERT INTO politicas_vacaciones (antiguedad_minima, antiguedad_maxima, dias_base, dias_adicionales, descripcion)
VALUES 
(0, 5, 14, 0, 'Vacaciones para empleados con hasta 5 años de antigüedad'),
(6, 10, 21, 0, 'Vacaciones para empleados con 6 a 10 años de antigüedad'),
(11, 20, 28, 0, 'Vacaciones para empleados con 11 a 20 años de antigüedad'),
(21, NULL, 35, 0, 'Vacaciones para empleados con más de 20 años de antigüedad');

-- Tipos de licencias de ejemplo
INSERT INTO tipos_licencias (nombre, con_goce_sueldo, limite_dias, requiere_certificado, descripcion)
VALUES 
('Enfermedad', true, 180, true, 'Licencia por enfermedad con goce de haberes'),
('Maternidad', true, 90, true, 'Licencia por maternidad'),
('Paternidad', true, 10, false, 'Licencia por paternidad'),
('Estudios', true, 10, true, 'Licencia para rendir exámenes'),
('Duelo', true, 3, false, 'Licencia por fallecimiento de familiar'),
('Sin Goce', false, NULL, false, 'Licencia sin goce de haberes');

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Resumen de políticas de vacaciones
CREATE VIEW vista_politicas_vacaciones AS
SELECT 
    id,
    antiguedad_minima,
    antiguedad_maxima,
    dias_base,
    dias_adicionales,
    (dias_base + dias_adicionales) AS dias_totales,
    CASE 
        WHEN antiguedad_maxima IS NULL THEN CONCAT('Más de ', antiguedad_minima, ' años')
        WHEN antiguedad_minima = antiguedad_maxima THEN CONCAT(antiguedad_minima, ' años')
        ELSE CONCAT(antiguedad_minima, ' a ', antiguedad_maxima, ' años')
    END AS rango_antiguedad,
    activo
FROM politicas_vacaciones
WHERE activo = TRUE
ORDER BY antiguedad_minima;

-- Vista: Tipos de licencias resumen
CREATE VIEW vista_tipos_licencias AS
SELECT 
    id,
    nombre,
    con_goce_sueldo,
    limite_dias,
    requiere_certificado,
    CASE 
        WHEN con_goce_sueldo THEN 'Con Goce'
        ELSE 'Sin Goce'
    END AS tipo_goce,
    activo
FROM tipos_licencias
WHERE activo = TRUE
ORDER BY con_goce_sueldo DESC, nombre;

-- Vista: Descuentos por tipo
CREATE VIEW vista_descuentos AS
SELECT 
    id,
    nombre,
    tipo,
    valor,
    aplica_aportes,
    CASE 
        WHEN tipo = 'fijo' THEN CONCAT('$', valor::numeric(10,2))
        ELSE CONCAT(valor::numeric(5,2), '%')
    END AS valor_formateado,
    CASE 
        WHEN aplica_aportes THEN 'Sí'
        ELSE 'No'
    END AS aplica_aportes_texto,
    activo
FROM descuentos
WHERE activo = TRUE
ORDER BY tipo, nombre;