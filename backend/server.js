// ============================================
// SERVER.JS - Backend para Sistema de Liquidación de Sueldos
// ============================================

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path'); // IMPORTANTE: Necesario para manejar rutas de carpetas
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN DE POSTGRESQL
// ============================================
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'liquidacion_sueldos',
    password: process.env.DB_PASSWORD || 'tu_password',
    port: process.env.DB_PORT || 5432,
});

// Verificar conexión
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error conectando a PostgreSQL:', err.stack);
    } else {
        console.log('✅ Conectado a PostgreSQL exitosamente');
        release();
    }
});

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors()); // Permitir peticiones desde el frontend
app.use(express.json()); // Parse JSON en el body

// CORRECCIÓN AQUÍ: 
// Servir archivos estáticos desde la carpeta 'frontend' (subiendo un nivel desde 'backend')
app.use(express.static(path.join(__dirname, '../frontend')));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// ============================================
// RUTAS - CONVENIOS
// ============================================

// GET - Obtener todos los convenios
app.get('/api/convenios', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM convenios WHERE activo = TRUE ORDER BY id DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener convenios:', err);
        res.status(500).json({ error: 'Error al obtener convenios' });
    }
});

// GET - Obtener un convenio por ID
app.get('/api/convenios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM convenios WHERE id = $1 AND activo = TRUE',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Convenio no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener convenio:', err);
        res.status(500).json({ error: 'Error al obtener convenio' });
    }
});

// POST - Crear un nuevo convenio
app.post('/api/convenios', async (req, res) => {
    try {
        const { 
            nombre, 
            numero, 
            salario_basico, 
            aporte_jubilacion, 
            aporte_obra_social, 
            aporte_sindical, 
            aporte_pami, 
            descripcion 
        } = req.body;

        const result = await pool.query(
            `INSERT INTO convenios 
            (nombre, numero, salario_basico, aporte_jubilacion, aporte_obra_social, aporte_sindical, aporte_pami, descripcion) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`,
            [nombre, numero, salario_basico, aporte_jubilacion, aporte_obra_social, aporte_sindical, aporte_pami, descripcion]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear convenio:', err);
        if (err.code === '23505') { // Duplicate key
            res.status(400).json({ error: 'El número de convenio ya existe' });
        } else {
            res.status(500).json({ error: 'Error al crear convenio' });
        }
    }
});

// PUT - Actualizar un convenio
app.put('/api/convenios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nombre, 
            numero, 
            salario_basico, 
            aporte_jubilacion, 
            aporte_obra_social, 
            aporte_sindical, 
            aporte_pami, 
            descripcion 
        } = req.body;

        const result = await pool.query(
            `UPDATE convenios 
            SET nombre = $1, numero = $2, salario_basico = $3, 
                aporte_jubilacion = $4, aporte_obra_social = $5, 
                aporte_sindical = $6, aporte_pami = $7, descripcion = $8
            WHERE id = $9 AND activo = TRUE
            RETURNING *`,
            [nombre, numero, salario_basico, aporte_jubilacion, aporte_obra_social, aporte_sindical, aporte_pami, descripcion, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Convenio no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar convenio:', err);
        res.status(500).json({ error: 'Error al actualizar convenio' });
    }
});

// DELETE - Eliminar (soft delete) un convenio
app.delete('/api/convenios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE convenios SET activo = FALSE WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Convenio no encontrado' });
        }

        res.json({ message: 'Convenio eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar convenio:', err);
        res.status(500).json({ error: 'Error al eliminar convenio' });
    }
});

// ============================================
// RUTAS - HORAS EXTRAS
// ============================================

app.get('/api/horas-extras', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM horas_extras WHERE activo = TRUE ORDER BY id DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener horas extras' });
    }
});

app.post('/api/horas-extras', async (req, res) => {
    try {
        const { nombre, multiplicador, descripcion } = req.body;
        const result = await pool.query(
            'INSERT INTO horas_extras (nombre, multiplicador, descripcion) VALUES ($1, $2, $3) RETURNING *',
            [nombre, multiplicador, descripcion]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al crear hora extra' });
    }
});

app.put('/api/horas-extras/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, multiplicador, descripcion } = req.body;
        const result = await pool.query(
            'UPDATE horas_extras SET nombre = $1, multiplicador = $2, descripcion = $3 WHERE id = $4 AND activo = TRUE RETURNING *',
            [nombre, multiplicador, descripcion, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Hora extra no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al actualizar hora extra' });
    }
});

app.delete('/api/horas-extras/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE horas_extras SET activo = FALSE WHERE id = $1', [id]);
        res.json({ message: 'Hora extra eliminada' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al eliminar hora extra' });
    }
});

// ============================================
// RUTAS - FERIADOS
// ============================================

app.get('/api/feriados', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM feriados WHERE activo = TRUE ORDER BY fecha'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener feriados' });
    }
});

app.post('/api/feriados', async (req, res) => {
    try {
        const { nombre, fecha, tipo, descripcion } = req.body;
        const result = await pool.query(
            'INSERT INTO feriados (nombre, fecha, tipo, descripcion) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, fecha, tipo, descripcion]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al crear feriado' });
    }
});

app.put('/api/feriados/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, fecha, tipo, descripcion } = req.body;
        const result = await pool.query(
            'UPDATE feriados SET nombre = $1, fecha = $2, tipo = $3, descripcion = $4 WHERE id = $5 AND activo = TRUE RETURNING *',
            [nombre, fecha, tipo, descripcion, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Feriado no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al actualizar feriado' });
    }
});

app.delete('/api/feriados/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE feriados SET activo = FALSE WHERE id = $1', [id]);
        res.json({ message: 'Feriado eliminado' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al eliminar feriado' });
    }
});

// ============================================
// RUTAS - ADICIONALES
// ============================================

app.get('/api/adicionales', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM adicionales WHERE activo = TRUE ORDER BY id DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener adicionales' });
    }
});

app.post('/api/adicionales', async (req, res) => {
    try {
        const { nombre, tipo, valor, descripcion } = req.body;
        const result = await pool.query(
            'INSERT INTO adicionales (nombre, tipo, valor, descripcion) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, tipo, valor, descripcion]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al crear adicional' });
    }
});

app.put('/api/adicionales/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo, valor, descripcion } = req.body;
        const result = await pool.query(
            'UPDATE adicionales SET nombre = $1, tipo = $2, valor = $3, descripcion = $4 WHERE id = $5 AND activo = TRUE RETURNING *',
            [nombre, tipo, valor, descripcion, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Adicional no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al actualizar adicional' });
    }
});

app.delete('/api/adicionales/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE adicionales SET activo = FALSE WHERE id = $1', [id]);
        res.json({ message: 'Adicional eliminado' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al eliminar adicional' });
    }
});

// ===================================================================== //
// SEGUNDA ENTREGA: CONFIGURACIÓN DE DESCUENTOS, VACACIONES Y LICENCIAS  //
// ===================================================================== //

// ============================================
// RUTAS - DESCUENTOS
// ============================================

app.get('/api/descuentos', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM descuentos WHERE activo = TRUE ORDER BY id DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener descuentos' });
    }
});

app.get('/api/descuentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM descuentos WHERE id = $1 AND activo = TRUE',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Descuento no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener descuento' });
    }
});

app.post('/api/descuentos', async (req, res) => {
    try {
        const { nombre, tipo, valor, aplica_aportes, descripcion } = req.body;
        const result = await pool.query(
            'INSERT INTO descuentos (nombre, tipo, valor, aplica_aportes, descripcion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre, tipo, parseFloat(valor), aplica_aportes, descripcion]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al crear descuento' });
    }
});

app.put('/api/descuentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo, valor, aplica_aportes, descripcion } = req.body;
        const result = await pool.query(
            'UPDATE descuentos SET nombre = $1, tipo = $2, valor = $3, aplica_aportes = $4, descripcion = $5 WHERE id = $6 AND activo = TRUE RETURNING *',
            [nombre, tipo, parseFloat(valor), aplica_aportes, descripcion, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Descuento no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al actualizar descuento' });
    }
});

app.delete('/api/descuentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE descuentos SET activo = FALSE WHERE id = $1', [id]);
        res.json({ message: 'Descuento eliminado' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al eliminar descuento' });
    }
});

// ============================================
// RUTAS - POLITICAS DE VACACIONES
// ============================================

app.get('/api/politicas-vacaciones', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM politicas_vacaciones WHERE activo = TRUE ORDER BY antiguedad_minima'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener políticas de vacaciones' });
    }
});

app.get('/api/politicas-vacaciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM politicas_vacaciones WHERE id = $1 AND activo = TRUE',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Política de vacaciones no encontrada' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener política de vacaciones' });
    }
});

app.post('/api/politicas-vacaciones', async (req, res) => {
    try {
        const { antiguedad_minima, antiguedad_maxima, dias_base, dias_adicionales, descripcion } = req.body;
        const result = await pool.query(
            'INSERT INTO politicas_vacaciones (antiguedad_minima, antiguedad_maxima, dias_base, dias_adicionales, descripcion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [parseInt(antiguedad_minima), antiguedad_maxima ? parseInt(antiguedad_maxima) : null, parseInt(dias_base), parseInt(dias_adicionales), descripcion]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al crear política de vacaciones' });
    }
});

app.put('/api/politicas-vacaciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { antiguedad_minima, antiguedad_maxima, dias_base, dias_adicionales, descripcion } = req.body;
        const result = await pool.query(
            'UPDATE politicas_vacaciones SET antiguedad_minima = $1, antiguedad_maxima = $2, dias_base = $3, dias_adicionales = $4, descripcion = $5 WHERE id = $6 AND activo = TRUE RETURNING *',
            [parseInt(antiguedad_minima), antiguedad_maxima ? parseInt(antiguedad_maxima) : null, parseInt(dias_base), parseInt(dias_adicionales), descripcion, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Política de vacaciones no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al actualizar política de vacaciones' });
    }
});

app.delete('/api/politicas-vacaciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE politicas_vacaciones SET activo = FALSE WHERE id = $1', [id]);
        res.json({ message: 'Política de vacaciones eliminada' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al eliminar política de vacaciones' });
    }
});

// ============================================
// RUTAS - TIPOS DE LICENCIAS
// ============================================

app.get('/api/tipos-licencias', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tipos_licencias WHERE activo = TRUE ORDER BY con_goce_sueldo DESC, nombre'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener tipos de licencias' });
    }
});

app.get('/api/tipos-licencias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM tipos_licencias WHERE id = $1 AND activo = TRUE',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tipo de licencia no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener tipo de licencia' });
    }
});

app.post('/api/tipos-licencias', async (req, res) => {
    try {
        const { nombre, con_goce_sueldo, limite_dias, requiere_certificado, descripcion } = req.body;
        const result = await pool.query(
            'INSERT INTO tipos_licencias (nombre, con_goce_sueldo, limite_dias, requiere_certificado, descripcion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre, con_goce_sueldo, limite_dias ? parseInt(limite_dias) : null, requiere_certificado, descripcion]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al crear tipo de licencia' });
    }
});

app.put('/api/tipos-licencias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, con_goce_sueldo, limite_dias, requiere_certificado, descripcion } = req.body;
        const result = await pool.query(
            'UPDATE tipos_licencias SET nombre = $1, con_goce_sueldo = $2, limite_dias = $3, requiere_certificado = $4, descripcion = $5 WHERE id = $6 AND activo = TRUE RETURNING *',
            [nombre, con_goce_sueldo, limite_dias ? parseInt(limite_dias) : null, requiere_certificado, descripcion, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tipo de licencia no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al actualizar tipo de licencia' });
    }
});

app.delete('/api/tipos-licencias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE tipos_licencias SET activo = FALSE WHERE id = $1', [id]);
        res.json({ message: 'Tipo de licencia eliminado' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al eliminar tipo de licencia' });
    }
});

// ============================================
// RUTAS - ASOCIACIONES CON CONVENIOS
// ============================================

// Asociar descuento a convenio
app.post('/api/convenios/:id/descuentos', async (req, res) => {
    try {
        const { id } = req.params;
        const { descuento_id, fecha_desde, fecha_hasta } = req.body;
        
        const result = await pool.query(
            'INSERT INTO convenio_descuentos (convenio_id, descuento_id, fecha_desde, fecha_hasta) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, descuento_id, fecha_desde, fecha_hasta]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al asociar descuento al convenio' });
    }
});

// Obtener descuentos de un convenio
app.get('/api/convenios/:id/descuentos', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT cd.*, d.nombre, d.tipo, d.valor, d.aplica_aportes
             FROM convenio_descuentos cd
             JOIN descuentos d ON cd.descuento_id = d.id
             WHERE cd.convenio_id = $1 AND cd.activo = TRUE AND d.activo = TRUE
             ORDER BY d.nombre`,
            [id]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener descuentos del convenio' });
    }
});

// Asociar licencia a convenio
app.post('/api/convenios/:id/licencias', async (req, res) => {
    try {
        const { id } = req.params;
        const { licencia_id } = req.body;
        
        const result = await pool.query(
            'INSERT INTO convenio_licencias (convenio_id, licencia_id) VALUES ($1, $2) RETURNING *',
            [id, licencia_id]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al asociar licencia al convenio' });
    }
});

// Obtener licencias de un convenio
app.get('/api/convenios/:id/licencias', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT cl.*, tl.nombre, tl.con_goce_sueldo, tl.limite_dias, tl.requiere_certificado
             FROM convenio_licencias cl
             JOIN tipos_licencias tl ON cl.licencia_id = tl.id
             WHERE cl.convenio_id = $1 AND cl.activo = TRUE AND tl.activo = TRUE
             ORDER BY tl.nombre`,
            [id]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener licencias del convenio' });
    }
});

// ===================================================================== //
// TERCERA ENTREGA: EMPLEADOS Y CÁLCULO DE LIQUIDACIONES                //
// ===================================================================== //

// ============================================
// RUTAS - EMPLEADOS
// ============================================

app.get('/api/empleados', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.*, c.nombre as convenio_nombre 
             FROM empleados e 
             LEFT JOIN convenios c ON e.convenio_id = c.id 
             WHERE e.activo = TRUE 
             ORDER BY e.apellido, e.nombre`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener empleados' });
    }
});

app.get('/api/empleados/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT e.*, c.nombre as convenio_nombre, c.* FROM empleados e 
             LEFT JOIN convenios c ON e.convenio_id = c.id 
             WHERE e.id = $1 AND e.activo = TRUE`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener empleado' });
    }
});

app.post('/api/empleados', async (req, res) => {
    try {
        const { 
            legajo, nombre, apellido, dni, fecha_nacimiento, 
            fecha_ingreso, email, telefono, direccion, 
            salario_base, convenio_id 
        } = req.body;

        const result = await pool.query(
            `INSERT INTO empleados 
            (legajo, nombre, apellido, dni, fecha_nacimiento, fecha_ingreso, 
             email, telefono, direccion, salario_base, convenio_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *`,
            [legajo, nombre, apellido, dni, fecha_nacimiento, fecha_ingreso,
             email, telefono, direccion, parseFloat(salario_base), convenio_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'El legajo o DNI ya existe' });
        } else {
            res.status(500).json({ error: 'Error al crear empleado' });
        }
    }
});

app.put('/api/empleados/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            legajo, nombre, apellido, dni, fecha_nacimiento, 
            fecha_ingreso, email, telefono, direccion, 
            salario_base, convenio_id 
        } = req.body;

        const result = await pool.query(
            `UPDATE empleados 
            SET legajo = $1, nombre = $2, apellido = $3, dni = $4, 
                fecha_nacimiento = $5, fecha_ingreso = $6, email = $7, 
                telefono = $8, direccion = $9, salario_base = $10, 
                convenio_id = $11, updated_at = CURRENT_TIMESTAMP
            WHERE id = $12 AND activo = TRUE 
            RETURNING *`,
            [legajo, nombre, apellido, dni, fecha_nacimiento, fecha_ingreso,
             email, telefono, direccion, parseFloat(salario_base), convenio_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al actualizar empleado' });
    }
});

app.delete('/api/empleados/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE empleados SET activo = FALSE WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        res.json({ message: 'Empleado eliminado exitosamente' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al eliminar empleado' });
    }
});

// ============================================
// RUTAS - HORAS EXTRAS DE EMPLEADOS
// ============================================

app.get('/api/empleados/:id/horas-extras', async (req, res) => {
    try {
        const { id } = req.params;
        const { periodo } = req.query; // Formato: YYYY-MM

        let query = `
            SELECT ehe.*, he.nombre as tipo_nombre, he.multiplicador
            FROM empleado_horas_extras ehe
            JOIN horas_extras he ON ehe.tipo_hora_extra_id = he.id
            WHERE ehe.empleado_id = $1 AND ehe.activo = TRUE
        `;
        let params = [id];

        if (periodo) {
            query += ' AND TO_CHAR(ehe.fecha, \'YYYY-MM\') = $2';
            params.push(periodo);
        }

        query += ' ORDER BY ehe.fecha DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener horas extras del empleado' });
    }
});

app.post('/api/empleados/:id/horas-extras', async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo_hora_extra_id, cantidad, fecha, descripcion } = req.body;

        const result = await pool.query(
            `INSERT INTO empleado_horas_extras 
            (empleado_id, tipo_hora_extra_id, cantidad, fecha, descripcion) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`,
            [id, tipo_hora_extra_id, parseFloat(cantidad), fecha, descripcion]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al registrar hora extra' });
    }
});

// ============================================
// RUTAS - ADICIONALES DE EMPLEADOS
// ============================================

app.get('/api/empleados/:id/adicionales', async (req, res) => {
    try {
        const { id } = req.params;
        const { periodo } = req.query;

        let query = `
            SELECT ea.*, a.nombre as adicional_nombre, a.tipo as adicional_tipo
            FROM empleado_adicionales ea
            JOIN adicionales a ON ea.adicional_id = a.id
            WHERE ea.empleado_id = $1 AND ea.activo = TRUE
        `;
        let params = [id];

        if (periodo) {
            query += ' AND TO_CHAR(ea.fecha, \'YYYY-MM\') = $2';
            params.push(periodo);
        }

        query += ' ORDER BY ea.fecha DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener adicionales del empleado' });
    }
});

app.post('/api/empleados/:id/adicionales', async (req, res) => {
    try {
        const { id } = req.params;
        const { adicional_id, monto, fecha, descripcion } = req.body;

        const result = await pool.query(
            `INSERT INTO empleado_adicionales 
            (empleado_id, adicional_id, monto, fecha, descripcion) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`,
            [id, adicional_id, parseFloat(monto), fecha, descripcion]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al registrar adicional' });
    }
});

// ============================================
// RUTAS - DESCUENTOS DE EMPLEADOS
// ============================================

app.get('/api/empleados/:id/descuentos', async (req, res) => {
    try {
        const { id } = req.params;
        const { periodo } = req.query;

        let query = `
            SELECT ed.*, d.nombre as descuento_nombre, d.tipo as descuento_tipo, d.aplica_aportes
            FROM empleado_descuentos ed
            JOIN descuentos d ON ed.descuento_id = d.id
            WHERE ed.empleado_id = $1 AND ed.activo = TRUE
        `;
        let params = [id];

        if (periodo) {
            query += ' AND TO_CHAR(ed.fecha, \'YYYY-MM\') = $2';
            params.push(periodo);
        }

        query += ' ORDER BY ed.fecha DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener descuentos del empleado' });
    }
});

app.post('/api/empleados/:id/descuentos', async (req, res) => {
    try {
        const { id } = req.params;
        const { descuento_id, monto, fecha, descripcion } = req.body;

        const result = await pool.query(
            `INSERT INTO empleado_descuentos 
            (empleado_id, descuento_id, monto, fecha, descripcion) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`,
            [id, descuento_id, parseFloat(monto), fecha, descripcion]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al registrar descuento' });
    }
});

// ============================================
// RUTAS - CÁLCULO DE LIQUIDACIONES
// ============================================

// Función para calcular liquidación
async function calcularLiquidacion(empleadoId, periodo) {
    // Obtener datos del empleado
    const empleadoResult = await pool.query(
        `SELECT e.*, c.* FROM empleados e 
         LEFT JOIN convenios c ON e.convenio_id = c.id 
         WHERE e.id = $1`,
        [empleadoId]
    );
    
    if (empleadoResult.rows.length === 0) {
        throw new Error('Empleado no encontrado');
    }
    
    const empleado = empleadoResult.rows[0];
    
    // Obtener horas extras del período
    const horasExtrasResult = await pool.query(
        `SELECT ehe.*, he.multiplicador 
         FROM empleado_horas_extras ehe 
         JOIN horas_extras he ON ehe.tipo_hora_extra_id = he.id 
         WHERE ehe.empleado_id = $1 AND TO_CHAR(ehe.fecha, 'YYYY-MM') = $2 AND ehe.activo = TRUE`,
        [empleadoId, periodo]
    );
    
    // Obtener adicionales del período
    const adicionalesResult = await pool.query(
        `SELECT ea.* FROM empleado_adicionales ea 
         WHERE ea.empleado_id = $1 AND TO_CHAR(ea.fecha, 'YYYY-MM') = $2 AND ea.activo = TRUE`,
        [empleadoId, periodo]
    );
    
    // Obtener descuentos del período
    const descuentosResult = await pool.query(
        `SELECT ed.*, d.tipo, d.aplica_aportes 
         FROM empleado_descuentos ed 
         JOIN descuentos d ON ed.descuento_id = d.id 
         WHERE ed.empleado_id = $1 AND TO_CHAR(ed.fecha, 'YYYY-MM') = $2 AND ed.activo = TRUE`,
        [empleadoId, periodo]
    );

    // CÁLCULO DE HABERES
    const salarioBase = parseFloat(empleado.salario_base);
    
    // Calcular horas extras
    let totalHorasExtras = 0;
    const detalleHorasExtras = horasExtrasResult.rows.map(he => {
        const valorHoraNormal = salarioBase / 30 / 8; // Asumiendo 8 horas diarias, 30 días
        const valorHoraExtra = valorHoraNormal * parseFloat(he.multiplicador);
        const totalHoraExtra = valorHoraExtra * parseFloat(he.cantidad);
        totalHorasExtras += totalHoraExtra;
        
        return {
            tipo: he.tipo_nombre,
            cantidad: he.cantidad,
            multiplicador: he.multiplicador,
            valor_unitario: valorHoraExtra,
            total: totalHoraExtra
        };
    });

    // Calcular adicionales
    let totalAdicionales = 0;
    const detalleAdicionales = adicionalesResult.rows.map(ad => {
        totalAdicionales += parseFloat(ad.monto);
        return {
            concepto: ad.descripcion || 'Adicional',
            monto: parseFloat(ad.monto)
        };
    });

    const totalHaberes = salarioBase + totalHorasExtras + totalAdicionales;

    // CÁLCULO DE DESCUENTOS
    let totalDescuentos = 0;
    const detalleDescuentos = [];

    // Descuentos por convenio (aportes)
    if (empleado.convenio_id) {
        const aportes = [
            { nombre: 'Jubilación', porcentaje: parseFloat(empleado.aporte_jubilacion) },
            { nombre: 'Obra Social', porcentaje: parseFloat(empleado.aporte_obra_social) },
            { nombre: 'Sindical', porcentaje: parseFloat(empleado.aporte_sindical) },
            { nombre: 'PAMI', porcentaje: parseFloat(empleado.aporte_pami) }
        ];

        aportes.forEach(aporte => {
            const montoAporte = totalHaberes * (aporte.porcentaje / 100);
            totalDescuentos += montoAporte;
            detalleDescuentos.push({
                concepto: `Aporte ${aporte.nombre}`,
                tipo: 'porcentaje',
                porcentaje: aporte.porcentaje,
                monto: montoAporte
            });
        });
    }

    // Descuentos adicionales
    descuentosResult.rows.forEach(desc => {
        totalDescuentos += parseFloat(desc.monto);
        detalleDescuentos.push({
            concepto: desc.descripcion || 'Descuento adicional',
            tipo: desc.tipo,
            monto: parseFloat(desc.monto)
        });
    });

    const netoAPagar = totalHaberes - totalDescuentos;

    return {
        empleado: {
            id: empleado.id,
            nombre: empleado.nombre,
            apellido: empleado.apellido,
            legajo: empleado.legajo
        },
        periodo: periodo,
        salario_base: salarioBase,
        haberes: {
            salario_base: salarioBase,
            horas_extras: totalHorasExtras,
            adicionales: totalAdicionales,
            total: totalHaberes,
            detalle_horas_extras: detalleHorasExtras,
            detalle_adicionales: detalleAdicionales
        },
        descuentos: {
            total: totalDescuentos,
            detalle: detalleDescuentos
        },
        neto_a_pagar: netoAPagar
    };
}

// Ruta para calcular liquidación
app.post('/api/empleados/:id/calcular-liquidacion', async (req, res) => {
    try {
        const { id } = req.params;
        const { periodo } = req.body;

        if (!periodo) {
            return res.status(400).json({ error: 'El período es requerido (YYYY-MM)' });
        }

        const liquidacion = await calcularLiquidacion(id, periodo);
        res.json(liquidacion);

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al calcular liquidación: ' + err.message });
    }
});

// Ruta para guardar liquidación
app.post('/api/empleados/:id/liquidaciones', async (req, res) => {
    try {
        const { id } = req.params;
        const { periodo } = req.body;

        if (!periodo) {
            return res.status(400).json({ error: 'El período es requerido (YYYY-MM)' });
        }

        // Calcular liquidación
        const liquidacionCalculada = await calcularLiquidacion(id, periodo);

        // Guardar en base de datos
        const result = await pool.query(
            `INSERT INTO liquidaciones 
            (empleado_id, periodo, fecha_liquidacion, salario_base, 
             total_haberes, total_descuentos, neto_a_pagar, detalle) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`,
            [id, periodo, new Date(), liquidacionCalculada.salario_base,
             liquidacionCalculada.haberes.total, liquidacionCalculada.descuentos.total,
             liquidacionCalculada.neto_a_pagar, JSON.stringify(liquidacionCalculada)]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al guardar liquidación: ' + err.message });
    }
});

// Ruta para obtener historial de liquidaciones
app.get('/api/empleados/:id/liquidaciones', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM liquidaciones WHERE empleado_id = $1 AND activo = TRUE ORDER BY periodo DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener liquidaciones' });
    }
});

// Ruta para obtener datos para formularios (convenios, horas extras, etc.)
app.get('/api/datos-formularios', async (req, res) => {
    try {
        const [convenios, horasExtras, adicionales, descuentos] = await Promise.all([
            pool.query('SELECT id, nombre FROM convenios WHERE activo = TRUE ORDER BY nombre'),
            pool.query('SELECT id, nombre, multiplicador FROM horas_extras WHERE activo = TRUE ORDER BY nombre'),
            pool.query('SELECT id, nombre FROM adicionales WHERE activo = TRUE ORDER BY nombre'),
            pool.query('SELECT id, nombre FROM descuentos WHERE activo = TRUE ORDER BY nombre')
        ]);

        res.json({
            convenios: convenios.rows,
            horasExtras: horasExtras.rows,
            adicionales: adicionales.rows,
            descuentos: descuentos.rows
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al obtener datos para formularios' });
    }
});

// Función para crear datos de prueba (ejecutar una sola vez)
async function crearDatosPrueba() {
    try {
        // Verificar si ya existen empleados
        const result = await pool.query('SELECT COUNT(*) FROM empleados');
        if (parseInt(result.rows[0].count) > 0) {
            return; // Ya hay datos, no crear más
        }

        // Crear empleados de prueba
        const empleadosPrueba = [
            {
                legajo: 'EMP-001',
                nombre: 'Juan',
                apellido: 'Pérez',
                dni: '12345678',
                fecha_ingreso: '2020-01-15',
                salario_base: 300000.00,
                convenio_id: 1
            },
            {
                legajo: 'EMP-002', 
                nombre: 'María',
                apellido: 'Gómez',
                dni: '23456789',
                fecha_ingreso: '2021-03-20',
                salario_base: 280000.00,
                convenio_id: 1
            },
            {
                legajo: 'EMP-003',
                nombre: 'Carlos',
                apellido: 'López',
                dni: '34567890',
                fecha_ingreso: '2022-06-10',
                salario_base: 250000.00,
                convenio_id: null
            }
        ];

        for (const emp of empleadosPrueba) {
            await pool.query(
                `INSERT INTO empleados 
                (legajo, nombre, apellido, dni, fecha_ingreso, salario_base, convenio_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [emp.legajo, emp.nombre, emp.apellido, emp.dni, emp.fecha_ingreso, emp.salario_base, emp.convenio_id]
            );
        }

        console.log('✅ Datos de prueba creados exitosamente');

    } catch (err) {
        console.error('Error creando datos de prueba:', err);
    }
}

// Llamar a la función después de que el servidor esté listo
setTimeout(crearDatosPrueba, 2000);

// ===================================================================== //
// CUARTA ENTREGA: GENERACIÓN DE RECIBOS Y REPORTES DE NÓMINA           //
// ===================================================================== //

// ============================================
// RUTAS - GENERACIÓN DE RECIBOS
// ============================================

// Obtener datos para generar recibo
app.get('/api/recibos/:empleadoId/:periodo', async (req, res) => {
    try {
        const { empleadoId, periodo } = req.params;
        
        // Calcular liquidación para el período
        const liquidacion = await calcularLiquidacion(empleadoId, periodo);
        
        // Obtener datos adicionales del empleado
        const empleadoResult = await pool.query(
            `SELECT e.*, c.nombre as convenio_nombre 
             FROM empleados e 
             LEFT JOIN convenios c ON e.convenio_id = c.id 
             WHERE e.id = $1`,
            [empleadoId]
        );
        
        if (empleadoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        
        const empleado = empleadoResult.rows[0];
        
        // Construir objeto de recibo
        const recibo = {
            empleado: {
                legajo: empleado.legajo,
                nombre: empleado.nombre,
                apellido: empleado.apellido,
                dni: empleado.dni,
                fecha_ingreso: empleado.fecha_ingreso,
                convenio: empleado.convenio_nombre
            },
            periodo: periodo,
            fecha_emision: new Date().toISOString().split('T')[0],
            haberes: liquidacion.haberes,
            descuentos: liquidacion.descuentos,
            neto_a_pagar: liquidacion.neto_a_pagar,
            detalle_completo: liquidacion
        };
        
        res.json(recibo);
        
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al generar recibo: ' + err.message });
    }
});

// ============================================
// RUTAS - REPORTES DE NÓMINA
// ============================================

// Generar reporte de nómina para un período
app.get('/api/nomina/:periodo', async (req, res) => {
    try {
        const { periodo } = req.params;
        
        // Obtener todos los empleados activos
        const empleadosResult = await pool.query(
            `SELECT id, legajo, nombre, apellido, dni, salario_base, convenio_id 
             FROM empleados 
             WHERE activo = TRUE 
             ORDER BY apellido, nombre`
        );
        
        const empleados = empleadosResult.rows;
        const reporteNomina = [];
        let totalNomina = 0;
        
        // Calcular liquidación para cada empleado
        for (const empleado of empleados) {
            try {
                const liquidacion = await calcularLiquidacion(empleado.id, periodo);
                
                reporteNomina.push({
                    legajo: empleado.legajo,
                    nombre: `${empleado.apellido}, ${empleado.nombre}`,
                    dni: empleado.dni,
                    salario_base: liquidacion.salario_base,
                    horas_extras: liquidacion.haberes.horas_extras,
                    adicionales: liquidacion.haberes.adicionales,
                    total_haberes: liquidacion.haberes.total,
                    total_descuentos: liquidacion.descuentos.total,
                    neto_a_pagar: liquidacion.neto_a_pagar
                });
                
                totalNomina += liquidacion.neto_a_pagar;
                
            } catch (error) {
                console.error(`Error calculando liquidación para empleado ${empleado.legajo}:`, error);
                // Continuar con el siguiente empleado
            }
        }
        
        res.json({
            periodo: periodo,
            fecha_generacion: new Date().toISOString(),
            total_empleados: reporteNomina.length,
            total_nomina: totalNomina,
            empleados: reporteNomina
        });
        
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al generar reporte de nómina: ' + err.message });
    }
});

// Generar reporte de nómina para empleados específicos
app.post('/api/nomina/:periodo/empleados', async (req, res) => {
    try {
        const { periodo } = req.params;
        const { empleadosIds } = req.body; // Array de IDs de empleados
        
        if (!empleadosIds || !Array.isArray(empleadosIds)) {
            return res.status(400).json({ error: 'Se requiere un array de IDs de empleados' });
        }
        
        const reporteNomina = [];
        let totalNomina = 0;
        
        // Calcular liquidación para cada empleado seleccionado
        for (const empleadoId of empleadosIds) {
            try {
                const empleadoResult = await pool.query(
                    'SELECT id, legajo, nombre, apellido, dni, salario_base FROM empleados WHERE id = $1 AND activo = TRUE',
                    [empleadoId]
                );
                
                if (empleadoResult.rows.length === 0) {
                    continue; // Saltar empleado no encontrado
                }
                
                const empleado = empleadoResult.rows[0];
                const liquidacion = await calcularLiquidacion(empleadoId, periodo);
                
                reporteNomina.push({
                    legajo: empleado.legajo,
                    nombre: `${empleado.apellido}, ${empleado.nombre}`,
                    dni: empleado.dni,
                    salario_base: liquidacion.salario_base,
                    horas_extras: liquidacion.haberes.horas_extras,
                    adicionales: liquidacion.haberes.adicionales,
                    total_haberes: liquidacion.haberes.total,
                    total_descuentos: liquidacion.descuentos.total,
                    neto_a_pagar: liquidacion.neto_a_pagar
                });
                
                totalNomina += liquidacion.neto_a_pagar;
                
            } catch (error) {
                console.error(`Error calculando liquidación para empleado ID ${empleadoId}:`, error);
                // Continuar con el siguiente empleado
            }
        }
        
        res.json({
            periodo: periodo,
            fecha_generacion: new Date().toISOString(),
            total_empleados: reporteNomina.length,
            total_nomina: totalNomina,
            empleados: reporteNomina
        });
        
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al generar reporte de nómina: ' + err.message });
    }
});

// CORRECCIÓN DE LA RUTA PRINCIPAL:
// Servir el index.html desde la carpeta 'frontend'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});