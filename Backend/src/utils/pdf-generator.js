const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


exports.generateInvoice = async (order, details, customer) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `boleta-${order.idPedido}-${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../../public/uploads/invoices', fileName);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      
      doc.fillColor('#444444')
         .fontSize(20)
         .text('PURE INKA FOODS', 50, 57)
         .fontSize(10)
         .text('RUC: 20600000000', 200, 50, { align: 'right' })
         .text('Av. Las Palmeras 123, Lima, Perú', 200, 65, { align: 'right' })
         .text('Tel: +51 987 654 321', 200, 80, { align: 'right' })
         .moveDown();

      
      doc.strokeColor('#aaaaaa')
         .lineWidth(1)
         .moveTo(50, 100)
         .lineTo(550, 100)
         .stroke();

      
      doc.fillColor('#000000')
         .fontSize(14)
         .text(`BOLETA ELECTRÓNICA: B001-${order.idPedido.toString().padStart(6, '0')}`, 50, 115);

      
      doc.fontSize(10)
         .text(`Fecha: ${new Date(order.fecha).toLocaleDateString()}`, 50, 140)
         .text(`Cliente: ${customer.nombre}`, 50, 155)
         .text(`Email: ${customer.correo}`, 50, 170)
         .text(`Teléfono: ${customer.telefono || 'N/A'}`, 50, 185)
         .moveDown();

      
      const tableTop = 220;
      doc.font('Helvetica-Bold');
      doc.text('Cant.', 50, tableTop);
      doc.text('Descripción', 100, tableTop);
      doc.text('P. Unit', 400, tableTop, { width: 90, align: 'right' });
      doc.text('Subtotal', 490, tableTop, { width: 60, align: 'right' });
      
      doc.font('Helvetica');
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      
      let position = tableTop + 25;
      details.forEach(item => {
        doc.text(item.cantidad.toString(), 50, position);
        doc.text(item.producto_nombre || 'Producto', 100, position);
        doc.text(`S/. ${parseFloat(item.precioUnitario).toFixed(2)}`, 400, position, { width: 90, align: 'right' });
        doc.text(`S/. ${parseFloat(item.subtotal).toFixed(2)}`, 490, position, { width: 60, align: 'right' });
        position += 20;
      });

      
      const footerTop = position + 30;
      doc.moveTo(350, footerTop).lineTo(550, footerTop).stroke();
      
      doc.text('Subtotal:', 350, footerTop + 10);
      doc.text(`S/. ${parseFloat(order.totalProductos).toFixed(2)}`, 450, footerTop + 10, { align: 'right', width: 100 });
      
      doc.text('Costo Envío:', 350, footerTop + 25);
      doc.text(`S/. ${parseFloat(order.costoEnvio).toFixed(2)}`, 450, footerTop + 25, { align: 'right', width: 100 });

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('TOTAL A PAGAR:', 350, footerTop + 45);
      doc.text(`S/. ${parseFloat(order.totalPagar).toFixed(2)}`, 450, footerTop + 45, { align: 'right', width: 100 });

      
      doc.font('Helvetica').fontSize(10)
         .text('Gracias por su compra en Pure Inka Foods.', 50, 700, { align: 'center', width: 500 });

      doc.end();

      stream.on('finish', () => {
        resolve({ fileName, filePath });
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};