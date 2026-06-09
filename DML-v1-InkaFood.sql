use pureinkafoodsdb;

INSERT INTO cliente (idCliente, nombre, correo, telefono, contrasenaHash, rol, fechaRegistro, activo) VALUES 
(1, 'Bernardo Adolfo', 'berna@gmail.com', '987654321', '$2b$12$KOt7WA4Gx.TtjO73RuQty.ZLjg3sJls1YE38hzg0EOg1YfvKJRKLS', 'cliente', '2026-04-21 09:42:17', 1),
(2, 'Administrador', 'admin@pureinka.com', '943654786', '$2b$12$MEzi5hL8/0/mO83CP60VTeGoYNhJxT7sABlECDpWcyDRdf6AnFbZm', 'admin', '2026-04-21 09:42:50', 1),
(3, 'María Fernanda López', 'maria.lopez@gmail.com', '912345678', '$2b$12$4jhO/Abxxw7zBKD1sHFXEeuxUmMjMNImAR7h/teGvueBnQZ4sO92e', 'cliente', '2026-04-22 10:15:20', 1),
(4, 'Carlos Alberto Pérez', 'carlos.perez@gmail.com', '923456789', '$2b$12$rPriV3vM6j18Iphp8X0oQOUND4FtTPbCNWfcXlqKHMldW1SH6K2qC', 'cliente', '2026-04-22 11:05:33', 1),
(5, 'Lucía Gómez Ruiz', 'lucia.gomez@gmail.com', '934567891', '$2b$12$S/VYJrg8.gZK3xSnY5iQAe0vAQ2KDOEWXmsnISqbm.whZMiwbxbNq', 'cliente', '2026-04-22 12:45:10', 1),
(6, 'José Antonio Vargas', 'jose.vargas@gmail.com', '945678912', '$2b$12$T6k8FqLZHdeA/R/EPZM9vOUHwkh7BlmM6bPKO7oobgAsVqg3eoCSu', 'cliente', '2026-04-23 08:20:44', 1),
(7, 'Andrea Castillo Torres', 'andrea.castillo@gmail.com', '956789123', '$2b$12$OjJOKOYnpENnm2EeDE7A9eMQIRfFAREqtmIt4VQItLECM.Yn0Jr4K', 'cliente', '2026-04-23 09:55:01', 1),
(8, 'Luis Enrique Mendoza', 'luis.mendoza@gmail.com', '967891234', '$2b$12$4RiahieS/BDOwpG1a.xrweKhPJAcJXk/D7rTZGwYfFtLEfpdVt9VW', 'cliente', '2026-04-23 14:12:27', 1),
(9, 'Rosa Elena Díaz', 'rosa.diaz@gmail.com', '978912345', '$2b$12$.IzZD2U3t2iskzwS0eIwMOrzGe8Am.vqyJ1sWUVLWBOwQA5bYW7FO', 'cliente', '2026-04-24 10:33:19', 1),
(10, 'Miguel Ángel Romero', 'miguel.romero@gmail.com', '989123456', '$2b$12$KOt7WA4Gx.TtjO73RuQty.ZLjg3sJls1YE38hzg0EOg1YfvKJRKLS', 'cliente', '2026-04-24 16:48:55', 1),
(11, 'Patricia Salazar Cruz', 'patricia.salazar@gmail.com', '991234567', '$2b$12$LA2GV8O3dr2ElCUwNWtuGOGXuxaAjMNT/rAU3RFdxPjK.xPnLENsy', 'cliente', '2026-04-25 09:10:11', 1),
(12, 'Jorge Luis Herrera', 'jorge.herrera@gmail.com', '902345678', '$2b$12$Xh6znYzinrvnvFP4xq9m1e7ydAfIQM3hhCOFSJ0MLSa2JK9xZwT6a', 'cliente', '2026-04-25 13:27:39', 1);

/*
berna@gmail.com contraseña = sasasa
admin@pureinka.com contraseña = Admin123
maria.lopez@gmail.com contraseña = maria123
carlos.perez@gmail.com contraseña = carlos123
lucia.gomez@gmail.com contraseña = lucia123
jose.vargas@gmail.com contraseña = jose123
andrea.castillo@gmail.com contraseña = andrea123
luis.mendoza@gmail.com contraseña = luis123
rosa.diaz@gmail.com contraseña = v
miguel.romero@gmail.com contraseña = miguel123
patricia.salazar@gmail.com contraseña = patricia123
jorge.herrera@gmail.com contraseña = jorge123
*/

INSERT INTO direccioncliente 
(idCliente, direccion, referencia, distrito, ciudad, pais, codigo_postal, tipo, nombre_receptor, telefono_receptor, esPrincipal) VALUES
(1, 'Av. Arequipa 1234', 'Frente a parque', 'Miraflores', 'Lima', 'Perú', '15074', 'envio', 'Bernardo Adolfo', '987654321', 1),
(2, 'Calle Los Álamos 456', 'Edificio central', 'San Isidro', 'Lima', 'Perú', '15073', 'envio', 'Administrador', '943654786', 1),
(3, 'Calle 45 #123', 'Casa azul', 'Chapinero', 'Bogotá', 'Colombia', '110111', 'envio', 'María López', '912345678', 1),
(4, 'Av. Corrientes 789', 'Depto 5B', 'San Nicolás', 'Buenos Aires', 'Argentina', 'C1043', 'envio', 'Carlos Pérez', '923456789', 1),
(5, 'Rua das Flores 321', 'Apto 202', 'Centro', 'São Paulo', 'Brasil', '01000-000', 'envio', 'Lucía Gómez', '934567891', 1),
(6, 'Av. Reforma 1500', 'Oficina 10', 'Juárez', 'Ciudad de México', 'México', '06600', 'envio', 'José Vargas', '945678912', 1),
(7, 'Calle Gran Vía 45', 'Piso 3', 'Centro', 'Madrid', 'España', '28013', 'envio', 'Andrea Castillo', '956789123', 1),
(8, '742 Evergreen Terrace', 'Casa familiar', 'Springfield', 'Illinois', 'Estados Unidos', '62704', 'envio', 'Luis Mendoza', '967891234', 1),
(9, 'Av. Providencia 2345', 'Depto 12', 'Providencia', 'Santiago', 'Chile', '7500000', 'envio', 'Rosa Díaz', '978912345', 1),
(10, 'Calle Ocho 567', 'Casa blanca', 'La Habana Vieja', 'La Habana', 'Cuba', '10100', 'envio', 'Miguel Romero', '989123456', 1),
(11, 'Av. 9 de Octubre 890', 'Edificio Torre', 'Centro', 'Guayaquil', 'Ecuador', '090101', 'envio', 'Patricia Salazar', '991234567', 1),
(12, 'Av. 18 de Julio 1234', 'Apto 6', 'Centro', 'Montevideo', 'Uruguay', '11200', 'envio', 'Jorge Herrera', '902345678', 1);

INSERT INTO categoria (nombre, descripcion) VALUES 
('Superalimentos en Polvo', 'Productos deshidratados y pulverizados de alto valor nutricional como Maca, Camu Camu y Moringa.'),
('Granos y Semillas', 'Semillas integrales y granos andinos orgánicos como Quinoa, Chía y Nibs de Cacao.'),
('Aceites Naturales', 'Aceites extraídos en frío de superalimentos para uso nutricional y cosmético como Sacha Inchi y Cacay.'),
('Cápsulas y Suplementos', 'Concentrados de superalimentos en formato de cápsulas para una dosificación práctica y rápida.'),
('Infusiones y Tés', 'Selección de hierbas y hojas andinas/amazónicas deshidratadas para bebidas calientes y medicinales.'),
('Endulzantes Naturales', 'Alternativas saludables al azúcar refinada, como miel de yacón y estevia pura.'),
('Snacks Saludables', 'Alimentos listos para consumir a base de superfoods, ideales para meriendas nutritivas.'),
('Cuidado Personal', 'Productos de cosmética natural elaborados con insumos de la biodiversidad peruana.');

INSERT INTO producto (idProducto, idCategoria, nombre, descripcion, precio, stock, imagen, activo) VALUES 
(1, 1, 'Moringa Powder', '100% Pure Andes Superfood. Alto contenido de antioxidantes y vitaminas esenciales.', 38.00, 50, 'product-1776783148277-1417132.png', 1),
(2, 1, 'Camu Camu Powder', 'Súper alimento amazónico con la mayor concentración de Vitamina C natural del mundo.', 45.00, 40, 'product-1776783206507-672189453.png', 1),
(3, 1, 'Ginger Powder', 'Jengibre premium deshidratado, ideal para fortalecer el sistema inmunológico.', 22.00, 60, 'product-1776783259142-296209324.png', 1),
(4, 1, 'Maca Powder', 'Energizante natural andino que ayuda a mejorar la vitalidad y el equilibrio hormonal.', 32.50, 100, 'product-1776783312455-882910341.png', 1),
(5, 1, 'Purple Corn Powder', 'Maíz morado orgánico rico en antocianinas, ideal para una nutrición antioxidante.', 25.90, 85, 'product-1776783389112-556210982.png', 1),
(6, 2, 'Cacao Nibs', 'Nibs de cacao puro sin azúcar. El snack perfecto con magnesio y energía natural.', 29.90, 55, 'product-1776783445671-334109812.png', 1),
(7, 2, 'Chia Seeds', 'Semillas de chía ricas en Omega-3 y fibra para una digestión saludable.', 19.50, 75, 'product-1776783510223-112908765.png', 1),
(8, 2, 'Quinoa Grain', 'Quinua real en grano, fuente completa de proteínas y aminoácidos esenciales.', 18.00, 120, 'product-1776783567890-998210345.png', 1),
(9, 3, 'Cacay Oil', 'Aceite de Cacay 100% puro. El secreto amazónico para el cuidado de la piel y nutrición.', 95.00, 20, 'product-1776783621456-776109832.png', 1),
(10, 3, 'Sacha Inchi Oil', 'Aceite de Sacha Inchi extra virgen, el Omega vegetal más potente del planeta.', 58.00, 30, 'product-1776783689123-445109871.png', 1),
(11, 6, 'Stevia Powder', 'Extracto de estevia pura en polvo. El endulzante natural sin calorías ideal para diabéticos.', 24.50, 60, 'product-1776783745122-223109874.png', 1),
(12, 6, 'Yacon Syrup', 'Jarabe de Yacón orgánico. Endulzante prebiótico natural con bajo índice glucémico.', 48.00, 35, 'product-1776783812455-998109432.png', 1);

INSERT INTO tipoentrega (idTipoEntrega, nombre, costo) VALUES
(1, 'Envío Estándar', 10.00),
(2, 'Envío Express', 20.00),
(3, 'Recojo en Tienda', 0.00)
ON DUPLICATE KEY UPDATE 
nombre = VALUES(nombre),
costo = VALUES(costo);

INSERT INTO metodopago (idMetodoPago, nombre, descripcion, instrucciones, imagen_qr, activo) VALUES
(1, 'Tarjeta de Crédito/Débito (Stripe)', 'Pago seguro con tarjetas Visa, Mastercard, AMEX.', 'Ingrese los datos de su tarjeta en la pasarela segura de Stripe.', NULL, 1),
(2, 'Yape', 'Pago rápido mediante código QR o número de celular.', 'Escanee el código QR y adjunte la captura de pantalla de su comprobante.', 'yape-logo.png', 1),
(3, 'Plin', 'Pago rápido mediante código QR o número de celular.', 'Escanee el código QR y adjunte la captura de pantalla de su comprobante.', 'plin-logo.png', 1),
(4, 'Transferencia Bancaria', 'Depósito directo en nuestras cuentas BCP o BBVA.', 'Realice la transferencia a la cuenta 191-XXXXXXXX-X-XX y suba el voucher.', NULL, 1)
ON DUPLICATE KEY UPDATE 
nombre = VALUES(nombre),
descripcion = VALUES(descripcion),
instrucciones = VALUES(instrucciones),
imagen_qr = VALUES(imagen_qr),
activo = VALUES(activo);

-- ==========================================
-- NUEVOS DATOS: CUPONES, RESEÑAS Y TICKETS
-- ==========================================

INSERT INTO cupon (codigo, tipo, valor, fechaExpiracion, limiteUso, vecesUsado) VALUES 
('INKA10', 'porcentaje', 10.00, '2026-12-31 23:59:59', 100, 0),
('INKA20', 'porcentaje', 20.00, '2026-12-31 23:59:59', 50, 0),
('BIENVENIDA', 'fijo', 5.00, '2026-12-31 23:59:59', 500, 0);

INSERT INTO resena (idProducto, idCliente, calificacion, comentario) VALUES 
(1, 1, 5, 'Excelente producto, la moringa me da mucha energía.'),
(2, 3, 4, 'Muy buena calidad, aunque el sabor es un poco fuerte.'),
(4, 4, 5, 'La maca me ayuda mucho con el estrés diario. Recomendado.'),
(8, 5, 5, 'La mejor quinua que he probado, muy limpia y de buen tamaño.'),
(10, 6, 4, 'Buen aceite, lo uso para mis ensaladas.');

INSERT INTO ticket (idCliente, asunto, descripcion, categoria, estado, respuesta) VALUES 
(1, 'Consulta sobre envío', '¿Hacen envíos a provincia fuera de Lima?', 'Pedidos / Envío', 'RESPONDIDO', 'Sí, realizamos envíos a todo el Perú mediante Olva Courier.'),
(3, 'Error en el pago', 'Intenté pagar con Yape pero me salió error.', 'Facturación', 'CERRADO', 'El problema fue resuelto, puede intentar nuevamente.'),
(1, 'Sugerencia de producto', 'Me gustaría que vendan cacao en polvo.', 'Otros', 'ABIERTO', NULL);

