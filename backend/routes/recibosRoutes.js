// backend/routes/recibosRoutes.js
const express = require('express');
const router = express.Router();
const PDFService = require('../services/pdfService');

// Ruta para generar PDF de recibo
router.get('/:empleadoId/:periodo/pdf', async (req, res) => {
    try {
        const { empleadoId, periodo } = req.params;
        
        // Obtener datos del recibo desde tu base de datos
        // Esto depende de cómo tengas tu lógica actual
        const reciboData = await obtenerDatosRecibo(empleadoId, periodo);
        
        if (!reciboData) {
            return res.status(404).json({ error: 'Recibo no encontrado' });
        }
        
        // Generar PDF
        const pdfBuffer = await PDFService.generarReciboPDF(reciboData);
        
        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
            `attachment; filename="recibo_${reciboData.empleado.legajo}_${periodo}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        // Enviar PDF
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).json({ 
            error: 'Error al generar PDF', 
            details: error.message 
        });
    }
});

// Función auxiliar para obtener datos (AJUSTAR SEGÚN TU DB)
async function obtenerDatosRecibo(empleadoId, periodo) {
    // ESTA ES UNA FUNCIÓN DE EJEMPLO - DEBES ADAPTARLA A TU BASE DE DATOS
    
    // En tu caso, probablemente ya tengas una función similar en tu server.js
    // que obtiene los datos para el cálculo de liquidación
    
    // Ejemplo de estructura esperada:
    return {
        empleado: {
            nombre: "Juan",
            apellido: "Pérez",
            legajo: "EMP-001",
            dni: "12345678",
            convenio: "Empleados de Comercio"
        },
        periodo: periodo,
        haberes: {
            salario_base: 250000.00,
            horas_extras: 12500.50,
            adicionales: 8000.00,
            total: 270500.50
        },
        descuentos: {
            detalle: [
                { concepto: "Aporte Jubilatorio", monto: 27500.00 },
                { concepto: "Obra Social", monto: 7500.00 },
                { concepto: "Aporte Sindical", monto: 5000.00 }
            ],
            total: 40000.00
        },
        neto_a_pagar: 230500.50
    };
}

module.exports = router;