-- Tabla para empleados
CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    legajo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(15) UNIQUE NOT NULL,
    fecha_nacimiento DATE,
    fecha_ingreso DATE NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(20),
    direccion TEXT,
    salario_base DECIMAL(10,2) NOT NULL,
    convenio_id INTEGER REFERENCES convenios(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para horas extras de empleados
CREATE TABLE IF NOT EXISTS empleado_horas_extras (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id),
    tipo_hora_extra_id INTEGER REFERENCES horas_extras(id),
    cantidad DECIMAL(5,2) NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para adicionales aplicados a empleados
CREATE TABLE IF NOT EXISTS empleado_adicionales (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id),
    adicional_id INTEGER REFERENCES adicionales(id),
    monto DECIMAL(10,2) NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para descuentos aplicados a empleados
CREATE TABLE IF NOT EXISTS empleado_descuentos (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id),
    descuento_id INTEGER REFERENCES descuentos(id),
    monto DECIMAL(10,2) NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para liquidaciones (recibos de sueldo)
CREATE TABLE IF NOT EXISTS liquidaciones (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id),
    periodo VARCHAR(7) NOT NULL, -- Formato: YYYY-MM
    fecha_liquidacion DATE NOT NULL,
    salario_base DECIMAL(10,2) NOT NULL,
    total_haberes DECIMAL(10,2) NOT NULL,
    total_descuentos DECIMAL(10,2) NOT NULL,
    neto_a_pagar DECIMAL(10,2) NOT NULL,
    detalle JSONB, -- Para almacenar el detalle completo del cálculo
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);