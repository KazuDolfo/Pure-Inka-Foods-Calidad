CREATE DATABASE IF NOT EXISTS PureInkaFoodsDB;
USE PureInkaFoodsDB;

CREATE TABLE categoria (
    idCategoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(200)
);

CREATE TABLE cliente (
    idCliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    contrasenaHash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente',
    fechaRegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    codigoRecuperacion VARCHAR(10) NULL,
    expiracionCodigo DATETIME NULL,
    activo TINYINT(1) DEFAULT 1
);

CREATE TABLE producto (
    idProducto INT AUTO_INCREMENT PRIMARY KEY,
    idCategoria INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagen VARCHAR(255),
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (idCategoria) REFERENCES categoria (idCategoria)
);

CREATE TABLE carrito (
    idCarrito INT AUTO_INCREMENT PRIMARY KEY,
    idCliente INT NOT NULL UNIQUE,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idCliente) REFERENCES cliente (idCliente) ON DELETE CASCADE
);

CREATE TABLE detallecarrito (
    idDetalleCarrito INT AUTO_INCREMENT PRIMARY KEY,
    idCarrito INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (idCarrito) REFERENCES carrito (idCarrito) ON DELETE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES producto (idProducto) ON DELETE CASCADE
);

CREATE TABLE tipoentrega (
    idTipoEntrega INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    costo DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE direccioncliente (
    idDireccion INT AUTO_INCREMENT PRIMARY KEY,
    idCliente INT NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    referencia VARCHAR(255),
    distrito VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Perú',
    codigo_postal VARCHAR(20),
    tipo VARCHAR(50) DEFAULT 'envio',
    nombre_receptor VARCHAR(255),
    telefono_receptor VARCHAR(20),
    esPrincipal TINYINT(1) DEFAULT 0,
    FOREIGN KEY (idCliente) REFERENCES cliente (idCliente) ON DELETE CASCADE
);

CREATE TABLE metodopago (
    idMetodoPago INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    instrucciones TEXT,
    imagen_qr VARCHAR(255),
    activo TINYINT(1) DEFAULT 1
);

CREATE TABLE pedido (
    idPedido INT AUTO_INCREMENT PRIMARY KEY,
    idCliente INT NOT NULL,
    idTipoEntrega INT NOT NULL,
    idDireccion INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    totalProductos DECIMAL(10, 2) NOT NULL,
    costoEnvio DECIMAL(10, 2) NOT NULL,
    totalPagar DECIMAL(10, 2) NOT NULL,
    metodoPago VARCHAR(50),
    comprobantePago VARCHAR(255),
    FOREIGN KEY (idCliente) REFERENCES cliente (idCliente),
    FOREIGN KEY (idTipoEntrega) REFERENCES tipoentrega (idTipoEntrega),
    FOREIGN KEY (idDireccion) REFERENCES direccioncliente (idDireccion)
);

CREATE TABLE detallepedido (
    idDetalle INT AUTO_INCREMENT PRIMARY KEY,
    idPedido INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    precioUnitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (idPedido) REFERENCES pedido (idPedido) ON DELETE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES producto (idProducto)
);


CREATE TABLE pago (
    idPago INT AUTO_INCREMENT PRIMARY KEY,
    idPedido INT NOT NULL,
    idMetodoPago INT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    fechaPago DATETIME DEFAULT CURRENT_TIMESTAMP,
    referenciaExterna VARCHAR(100),
    FOREIGN KEY (idPedido) REFERENCES pedido (idPedido),
    FOREIGN KEY (idMetodoPago) REFERENCES metodopago (idMetodoPago)
);

CREATE TABLE comprobantepago (
    idComprobante INT AUTO_INCREMENT PRIMARY KEY,
    idPago INT NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    monto DECIMAL(10, 2) NOT NULL,
    rutaPDF VARCHAR(255) NOT NULL,
    FOREIGN KEY (idPago) REFERENCES pago (idPago)
);
