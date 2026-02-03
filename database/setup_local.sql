-- ============================================================
-- SETUP BASE DE DATOS LOCAL PARA PRUEBAS - talleres_api
-- ============================================================
-- Ejecutar: mysql -u root -p < database/setup_local.sql
-- ============================================================

-- Crear base de datos
DROP DATABASE IF EXISTS mapos_local;
CREATE DATABASE mapos_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mapos_local;

-- ============================================================
-- TABLA: usuarios (admins, técnicos, recepcionistas)
-- ============================================================
CREATE TABLE usuarios (
    idUsuarios INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    situacao TINYINT(1) DEFAULT 1,
    dataCadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    permissoes_id INT DEFAULT 1,
    foto VARCHAR(255),
    -- Campos adicionales para el nuevo sistema
    rol ENUM('admin', 'tecnico', 'recepcionista') DEFAULT 'tecnico',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: clientes
-- ============================================================
CREATE TABLE clientes (
    idClientes INT AUTO_INCREMENT PRIMARY KEY,
    nomeCliente VARCHAR(255) NOT NULL,
    documento VARCHAR(50),
    pessoa_fisica TINYINT(1) DEFAULT 1,
    telefone VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(255),
    senha VARCHAR(255),
    endereco VARCHAR(255),
    numero VARCHAR(20),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(50),
    cep VARCHAR(20),
    contato VARCHAR(100),
    fornecedor TINYINT(1) DEFAULT 0,
    dataCadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: os (Ordenes de Servicio)
-- ============================================================
CREATE TABLE os (
    idOs INT AUTO_INCREMENT PRIMARY KEY,
    clientes_id INT NOT NULL,
    usuarios_id INT,
    tecnico_id INT,
    dataInicial DATETIME DEFAULT CURRENT_TIMESTAMP,
    dataFinal DATETIME,
    dataEntregaEstimada DATE,
    garantia VARCHAR(100),
    descricaoProduto TEXT,
    defeito TEXT,
    status ENUM('Aberto', 'Em Andamento', 'Aguardando Peças', 'Finalizado', 'Cancelado', 'Entregue') DEFAULT 'Aberto',
    observacoes TEXT,
    laudoTecnico TEXT,
    valorTotal DECIMAL(10,2) DEFAULT 0.00,
    desconto DECIMAL(10,2) DEFAULT 0.00,
    valorFinal DECIMAL(10,2) DEFAULT 0.00,
    faturado TINYINT(1) DEFAULT 0,
    -- Campos para el nuevo sistema Digicom
    numero_orden VARCHAR(20),
    prioridad ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',
    tipo_equipo ENUM('laptop', 'desktop', 'impresora', 'tablet') DEFAULT 'laptop',
    marca VARCHAR(100),
    modelo VARCHAR(100),
    serial VARCHAR(100),
    color VARCHAR(50),
    tiene_dano_fisico TINYINT(1) DEFAULT 0,
    descripcion_dano_fisico TEXT,
    diagnostico TEXT,
    solucion_aplicada TEXT,
    anticipo DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (clientes_id) REFERENCES clientes(idClientes),
    FOREIGN KEY (usuarios_id) REFERENCES usuarios(idUsuarios),
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(idUsuarios)
);

-- ============================================================
-- TABLA: servicos_os (Servicios de una OS)
-- ============================================================
CREATE TABLE servicos_os (
    idServicos_os INT AUTO_INCREMENT PRIMARY KEY,
    os_id INT NOT NULL,
    servicos_id INT,
    descricao VARCHAR(255),
    preco DECIMAL(10,2) DEFAULT 0.00,
    quantidade INT DEFAULT 1,
    subTotal DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (os_id) REFERENCES os(idOs) ON DELETE CASCADE
);

-- ============================================================
-- TABLA: produtos_os (Productos/repuestos de una OS)
-- ============================================================
CREATE TABLE produtos_os (
    idProdutos_os INT AUTO_INCREMENT PRIMARY KEY,
    os_id INT NOT NULL,
    produtos_id INT,
    descricao VARCHAR(255),
    preco DECIMAL(10,2) DEFAULT 0.00,
    quantidade INT DEFAULT 1,
    subTotal DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (os_id) REFERENCES os(idOs) ON DELETE CASCADE
);

-- ============================================================
-- TABLA: vendas (Ventas)
-- ============================================================
CREATE TABLE vendas (
    idVendas INT AUTO_INCREMENT PRIMARY KEY,
    clientes_id INT NOT NULL,
    usuarios_id INT,
    dataVenda DATETIME DEFAULT CURRENT_TIMESTAMP,
    valorTotal DECIMAL(10,2) DEFAULT 0.00,
    desconto DECIMAL(10,2) DEFAULT 0.00,
    valorFinal DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('Pendente', 'Pago', 'Cancelado') DEFAULT 'Pendente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (clientes_id) REFERENCES clientes(idClientes),
    FOREIGN KEY (usuarios_id) REFERENCES usuarios(idUsuarios)
);

-- ============================================================
-- TABLA: itens_de_vendas (Items de una venta)
-- ============================================================
CREATE TABLE itens_de_vendas (
    idItens INT AUTO_INCREMENT PRIMARY KEY,
    vendas_id INT NOT NULL,
    produtos_id INT,
    descricao VARCHAR(255),
    preco DECIMAL(10,2) DEFAULT 0.00,
    quantidade INT DEFAULT 1,
    subTotal DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendas_id) REFERENCES vendas(idVendas) ON DELETE CASCADE
);

-- ============================================================
-- TABLA: cobrancas (Cobranzas/Cuentas por cobrar)
-- ============================================================
CREATE TABLE cobrancas (
    idCobranca INT AUTO_INCREMENT PRIMARY KEY,
    clientes_id INT NOT NULL,
    os_id INT,
    vendas_id INT,
    descricao VARCHAR(255),
    valor DECIMAL(10,2) DEFAULT 0.00,
    dataVencimento DATE,
    dataPagamento DATE,
    status ENUM('Pendente', 'Pago', 'Vencido', 'Cancelado') DEFAULT 'Pendente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (clientes_id) REFERENCES clientes(idClientes)
);

-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

-- Usuarios (contraseña: "password123" hasheada con bcrypt)
-- Hash generado con bcrypt rounds=10
INSERT INTO usuarios (nome, email, senha, telefone, situacao, rol) VALUES
('David Ortiz', 'david@digicom.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqIfbBrJl1YxK5ykW0V8mBj3I3F7G', '4101-0001', 1, 'admin'),
('María López', 'maria@digicom.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqIfbBrJl1YxK5ykW0V8mBj3I3F7G', '4101-0002', 1, 'tecnico'),
('Carlos Pérez', 'carlos@digicom.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqIfbBrJl1YxK5ykW0V8mBj3I3F7G', '4101-0003', 1, 'tecnico'),
('Ana García', 'ana@digicom.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqIfbBrJl1YxK5ykW0V8mBj3I3F7G', '4101-0004', 1, 'recepcionista'),
('Test User', 'test@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqIfbBrJl1YxK5ykW0V8mBj3I3F7G', '5555-5555', 1, 'admin');

-- Clientes (contraseña: "cliente123" hasheada)
INSERT INTO clientes (nomeCliente, documento, telefone, celular, email, senha, endereco, cidade, pessoa_fisica) VALUES
('Juan Rodríguez', '1234567890101', '2222-1111', '5555-1111', 'juan@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqIfbBrJl1YxK5ykW0V8mBj3I3F7G', 'Zona 10, Ciudad de Guatemala', 'Guatemala', 1),
('Empresa ABC S.A.', '12345678', '2222-2222', '5555-2222', 'contacto@empresaabc.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqIfbBrJl1YxK5ykW0V8mBj3I3F7G', 'Zona 9, Ciudad de Guatemala', 'Guatemala', 0),
('Sofía Martínez', '9876543210101', '2222-3333', '5555-3333', 'sofia@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqIfbBrJl1YxK5ykW0V8mBj3I3F7G', 'Zona 14, Ciudad de Guatemala', 'Guatemala', 1),
('Pedro González', '1122334455667', '2222-4444', '5555-4444', 'pedro@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqIfbBrJl1YxK5ykW0V8mBj3I3F7G', 'Zona 1, Quetzaltenango', 'Quetzaltenango', 1),
('Tech Solutions Ltda', '98765432', '2222-5555', '5555-5555', 'info@techsolutions.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqIfbBrJl1YxK5ykW0V8mBj3I3F7G', 'Zona 4, Ciudad de Guatemala', 'Guatemala', 0),
('Cliente Test', '0000000000000', '0000-0000', '1234-5678', 'cliente@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqIfbBrJl1YxK5ykW0V8mBj3I3F7G', 'Dirección de prueba', 'Guatemala', 1);

-- Ordenes de Servicio
INSERT INTO os (clientes_id, usuarios_id, tecnico_id, numero_orden, descricaoProduto, defeito, status, prioridad, tipo_equipo, marca, modelo, serial, color, valorTotal, dataEntregaEstimada) VALUES
(1, 4, 2, '202601-0001', 'Laptop HP Pavilion 15', 'No enciende, se apaga sola después de 5 minutos', 'Aberto', 'alta', 'laptop', 'HP', 'Pavilion 15', 'HP123456', 'Gris', 0.00, DATE_ADD(CURDATE(), INTERVAL 5 DAY)),
(2, 4, 2, '202601-0002', 'Desktop Dell OptiPlex', 'Pantalla azul frecuente, ruido en disco duro', 'Em Andamento', 'normal', 'desktop', 'Dell', 'OptiPlex 7080', 'DELL789012', 'Negro', 450.00, DATE_ADD(CURDATE(), INTERVAL 3 DAY)),
(3, 4, 3, '202601-0003', 'Impresora Epson L3150', 'No imprime, cabezal obstruido', 'Aguardando Peças', 'baja', 'impresora', 'Epson', 'L3150', 'EPS345678', 'Negro', 200.00, DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
(1, 4, 2, '202601-0004', 'Laptop Lenovo ThinkPad', 'Teclado no funciona, algunas teclas pegadas', 'Finalizado', 'normal', 'laptop', 'Lenovo', 'ThinkPad T480', 'LEN901234', 'Negro', 350.00, CURDATE()),
(4, 4, 3, '202601-0005', 'Tablet Samsung Galaxy Tab', 'Pantalla rota, no responde al tacto', 'Aberto', 'urgente', 'tablet', 'Samsung', 'Galaxy Tab S7', 'SAM567890', 'Azul', 0.00, DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
(5, 4, 2, '202601-0006', 'Laptop ASUS ROG', 'Sobrecalentamiento, ventilador ruidoso', 'Em Andamento', 'alta', 'laptop', 'ASUS', 'ROG Strix G15', 'ASUS112233', 'Negro/Rojo', 300.00, DATE_ADD(CURDATE(), INTERVAL 4 DAY)),
(6, 4, NULL, '202601-0007', 'Desktop genérica', 'Lenta, posible virus', 'Aberto', 'baja', 'desktop', 'Genérica', 'Custom Build', 'N/A', 'Negro', 0.00, DATE_ADD(CURDATE(), INTERVAL 10 DAY));

-- Actualizar diagnósticos para algunas OS
UPDATE os SET diagnostico = 'Pasta térmica seca, ventilador obstruido con polvo', solucion_aplicada = 'Limpieza interna, cambio de pasta térmica' WHERE idOs = 4;
UPDATE os SET diagnostico = 'Disco duro con sectores dañados, RAM en buen estado' WHERE idOs = 2;

-- Servicios para OS
INSERT INTO servicos_os (os_id, descricao, preco, quantidade, subTotal) VALUES
(2, 'Diagnóstico completo', 100.00, 1, 100.00),
(2, 'Respaldo de información', 150.00, 1, 150.00),
(4, 'Cambio de pasta térmica', 75.00, 1, 75.00),
(4, 'Limpieza interna', 100.00, 1, 100.00),
(6, 'Limpieza de ventilador', 50.00, 1, 50.00);

-- Productos/Repuestos para OS
INSERT INTO produtos_os (os_id, descricao, preco, quantidade, subTotal) VALUES
(2, 'Disco SSD 500GB Samsung', 200.00, 1, 200.00),
(4, 'Pasta térmica Arctic MX-4', 75.00, 1, 75.00),
(4, 'Pad térmico', 100.00, 1, 100.00),
(6, 'Pasta térmica', 50.00, 1, 50.00),
(6, 'Ventilador de repuesto', 200.00, 1, 200.00);

-- Ventas
INSERT INTO vendas (clientes_id, usuarios_id, valorTotal, valorFinal, status) VALUES
(1, 1, 500.00, 500.00, 'Pago'),
(2, 1, 1200.00, 1100.00, 'Pago'),
(3, 2, 350.00, 350.00, 'Pendente');

-- Items de ventas
INSERT INTO itens_de_vendas (vendas_id, descricao, preco, quantidade, subTotal) VALUES
(1, 'Licencia Windows 11 Pro', 450.00, 1, 450.00),
(1, 'Instalación de SO', 50.00, 1, 50.00),
(2, 'Licencia Office 365 Business', 600.00, 2, 1200.00),
(3, 'Antivirus ESET NOD32 1 año', 350.00, 1, 350.00);

-- Cobranzas
INSERT INTO cobrancas (clientes_id, os_id, descricao, valor, dataVencimento, status) VALUES
(1, 4, 'Reparación Laptop ThinkPad', 350.00, DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'Pendente'),
(2, 2, 'Reparación Desktop Dell', 450.00, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Pendente'),
(5, 6, 'Reparación Laptop ASUS', 300.00, DATE_ADD(CURDATE(), INTERVAL -5 DAY), 'Vencido');

-- ============================================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================================
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_documento ON clientes(documento);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_os_clientes ON os(clientes_id);
CREATE INDEX idx_os_status ON os(status);
CREATE INDEX idx_os_numero ON os(numero_orden);

-- ============================================================
-- MENSAJE FINAL
-- ============================================================
SELECT '✅ Base de datos mapos_local creada exitosamente!' AS mensaje;
SELECT CONCAT('👤 Usuarios: ', COUNT(*)) AS total FROM usuarios;
SELECT CONCAT('👥 Clientes: ', COUNT(*)) AS total FROM clientes;
SELECT CONCAT('📋 Órdenes: ', COUNT(*)) AS total FROM os;
SELECT CONCAT('💰 Ventas: ', COUNT(*)) AS total FROM vendas;
