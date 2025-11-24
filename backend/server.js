// ============================================
// SERVER.JS - Backend para Sistema de Liquidación de Sueldos
// ============================================

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
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
// Servir archivos estáticos desde el directorio actual
app.use(express.static(__dirname));

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

// ============================================
// RUTA PRINCIPAL
// ============================================

/*
app.get('/', (req, res) => {
    res.send(`
        <h1>API Sistema de Liquidación de Sueldos</h1>
        <p>El servidor está funcionando correctamente</p>
        <h2>Endpoints disponibles:</h2>
        <ul>
            <li>GET /api/convenios</li>
            <li>POST /api/convenios</li>
            <li>PUT /api/convenios/:id</li>
            <li>DELETE /api/convenios/:id</li>
            <li>GET /api/horas-extras</li>
            <li>GET /api/feriados</li>
            <li>GET /api/adicionales</li>
        </ul>
    `);
}); 
*/








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








app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '../frontend' });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});