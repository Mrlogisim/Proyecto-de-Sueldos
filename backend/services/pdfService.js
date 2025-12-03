// backend/services/pdfService.js
const PDFDocument = require("pdfkit");

class PDFService {

    static generarReciboPDF(reciboData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 40 });
                const chunks = [];

                doc.on("data", (chunk) => chunks.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(chunks)));

                // ===========================
                // ENCABEZADO PROFESIONAL
                // ===========================
                doc
                    .rect(0, 0, doc.page.width, 80)
                    .fill("#1F2833");

                doc
                    .fill("#FFFFFF")
                    .fontSize(18)
                    .font("Helvetica-Bold")
                    .text("RECIBO DE SUELDO", 40, 25);

                doc
                    .fontSize(10)
                    .font("Helvetica")
                    .text("Empresa XYZ S.A.", 40, 55)
                    .text("CUIT: 30-12345678-9", 40, 68)
                    .text("Domicilio: Av. Siempreviva 123, Buenos Aires", 40, 81);

                doc.fillColor("#000000");

                doc.moveDown(3);

                // ===========================
                // DATOS DEL EMPLEADO
                // ===========================
                doc
                    .fontSize(12)
                    .font("Helvetica-Bold")
                    .text("Datos del Empleado", { underline: true });

                doc.moveDown(0.6);

                const emp = reciboData.empleado;

                doc.fontSize(10).font("Helvetica");

                doc.text(`Nombre: ${emp.apellido}, ${emp.nombre}`);
                doc.text(`Legajo: ${emp.legajo}`);
                doc.text(`DNI: ${emp.dni}`);
                doc.text(`Convenio: ${emp.convenio}`);
                doc.text(`Periodo: ${reciboData.periodo}`);

                doc.moveDown(1.5);

                // ===========================
                // HABERES
                // ===========================
                doc
                    .fontSize(12)
                    .font("Helvetica-Bold")
                    .text("Haberes", { underline: true });

                doc.moveDown(0.6);

                const haberes = reciboData.haberes;

                this.crearTabla(doc, [
                    ["Concepto", "Monto"],
                    ["Salario Básico", `$ ${haberes.salario_base.toFixed(2)}`],
                    ["Horas Extras", `$ ${haberes.horas_extras.toFixed(2)}`],
                    ["Adicionales", `$ ${haberes.adicionales.toFixed(2)}`],
                    ["TOTAL HABERES", `$ ${haberes.total.toFixed(2)}`],
                ]);

                doc.moveDown(1.5);

                // ===========================
                // DESCUENTOS
                // ===========================
                doc
                    .fontSize(12)
                    .font("Helvetica-Bold")
                    .text("Descuentos", { underline: true });

                doc.moveDown(0.6);

                const descuentos = reciboData.descuentos;

                const filasDescuentos = [["Concepto", "Monto"]];

                descuentos.detalle.forEach((d) => {
                    filasDescuentos.push([
                        d.concepto,
                        `$ ${d.monto.toFixed(2)}`
                    ]);
                });

                filasDescuentos.push([
                    "TOTAL DESCUENTOS",
                    `$ ${descuentos.total.toFixed(2)}`
                ]);

                this.crearTabla(doc, filasDescuentos);

                doc.moveDown(2);

                // ===========================
                // NETO A PAGAR
                // ===========================
                doc
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .fillColor("#0B5ED7")
                    .text(`NETO A COBRAR: $ ${reciboData.neto_a_pagar.toFixed(2)}`);

                doc.fillColor("#000000");

                doc.moveDown(2);

                // ===========================
                // FIRMAS
                // ===========================
                const y = doc.y;

                doc
                    .moveTo(40, y)
                    .lineTo(220, y)
                    .stroke();

                doc
                    .moveTo(330, y)
                    .lineTo(510, y)
                    .stroke();

                doc.moveDown(0.3);

                doc.fontSize(10);
                doc.text("Firma del Empleador", 40, y + 5);
                doc.text("Firma del Empleado", 330, y + 5);

                doc.moveDown(2);

                // Leyenda legal
                doc
                    .fontSize(8)
                    .text(
                        "Este recibo se emite de acuerdo a la Ley de Contrato de Trabajo N° 20.744. " +
                        "El trabajador declara haber recibido las sumas indicadas y los descuentos practicados."
                    );

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }

    // ===========================================================
    // FUNCIÓN AUXILIAR PARA CREAR TABLAS
    // ===========================================================
    static crearTabla(doc, filas) {
        const inicioX = 40;
        let posY = doc.y;

        filas.forEach((fila, i) => {
            const esHeader = i === 0;

            doc
                .rect(inicioX, posY, 520, 20)
                .fill(esHeader ? "#D8D8D8" : "#F5F5F5")
                .stroke();

            doc
                .fill("#000000")
                .font(esHeader ? "Helvetica-Bold" : "Helvetica")
                .fontSize(10)
                .text(fila[0], inicioX + 5, posY + 5)
                .text(fila[1], inicioX + 400, posY + 5);

            posY += 20;
        });

        doc.moveDown(1);
        doc.y = posY + 10;
    }
}

module.exports = PDFService;
