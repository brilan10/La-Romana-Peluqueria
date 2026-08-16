-- Vaciar datos existentes para evitar duplicados (Opcional, pero recomendado para el mock)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE trabajadores;
TRUNCATE TABLE clientes;
TRUNCATE TABLE servicios;
TRUNCATE TABLE citas;
TRUNCATE TABLE cita_detalle;
TRUNCATE TABLE productos;
TRUNCATE TABLE categorias;
TRUNCATE TABLE pedidos;
TRUNCATE TABLE pedido_detalle;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insertar Trabajadores (Barberos y Admin)
INSERT INTO trabajadores (id, nombre, email, foto_perfil) VALUES
(1, 'Admin', 'admin@laromana.cl', 'https://i.pravatar.cc/150?u=admin'),
(2, 'Juan Pérez', 'juan@laromana.cl', 'https://i.pravatar.cc/150?u=juan'),
(3, 'Carlos Gómez', 'carlos@laromana.cl', 'https://i.pravatar.cc/150?u=carlos'),
(4, 'Diego López', 'diego@laromana.cl', 'https://i.pravatar.cc/150?u=diego');

-- 2. Insertar Clientes
INSERT INTO clientes (id, rut, nombre, email, telefono, cortes_acumulados, notas_crm) VALUES
(1, '11111111-1', 'Roberto Martínez', 'roberto@email.com', '+56911112222', 1, 'Le gusta el degradado bajo'),
(2, '22222222-2', 'Ignacio Silva', 'ignacio@email.com', '+56933334444', 3, 'Conversador, VIP casi listo'),
(3, '33333333-3', 'Matías Fernández', 'matias@email.com', '+56955556666', 4, 'Cliente VIP - Entregar crema premium'),
(4, '44444444-4', 'Andrés Herrera', 'andres@email.com', '+56977778888', 0, ''),
(5, '55555555-5', 'express_mock@temporal.com', 'Cliente Express', '', 0, '');

-- 3. Insertar Servicios
INSERT INTO servicios (id, nombre, descripcion, precio, es_corte) VALUES
(1, 'Corte Clásico', 'Corte con tijera o máquina simple', 12000, TRUE),
(2, 'Corte Degradado (Fade)', 'Fade desde cero', 14000, TRUE),
(3, 'Perfilado de Barba', 'Arreglo y perfilado', 8000, FALSE),
(4, 'Corte + Barba', 'Combo completo', 20000, TRUE),
(5, 'Decoloración / Tinte', 'Colorimetría', 25000, FALSE);

-- 4. Insertar Categorías y Productos (Tienda)
INSERT INTO categorias (id, nombre) VALUES
(1, 'Cuidado Capilar'),
(2, 'Cuidado de Barba'),
(3, 'Perfumes');

INSERT INTO productos (id, categoria_id, nombre, descripcion, precio, stock, imagen_url) VALUES
(1, 1, 'Pomada Mate Suavecito', 'Fijación fuerte sin brillo', 15000, 20, 'https://via.placeholder.com/150/222/D4AF37?text=Pomada'),
(2, 2, 'Aceite de Barba Premium', 'Hidrata y suaviza', 12000, 15, 'https://via.placeholder.com/150/222/D4AF37?text=Aceite'),
(3, 1, 'Polvos Texturizadores', 'Para volumen extremo', 10000, 5, 'https://via.placeholder.com/150/222/D4AF37?text=Polvos'),
(4, 3, 'Decant Creed Aventus 10ml', 'Premio VIP o Venta', 25000, 50, 'https://via.placeholder.com/150/222/D4AF37?text=Decant');

-- 5. Insertar Pedidos (Tienda)
INSERT INTO pedidos (id, cliente_id, total, estado, fecha_creacion) VALUES
(1, 1, 15000, 'Entregado', NOW() - INTERVAL 2 DAY),
(2, 3, 22000, 'Pendiente', NOW()),
(3, 2, 25000, 'Preparando', NOW());

INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario) VALUES
(1, 1, 1, 15000),
(2, 2, 1, 12000),
(2, 3, 1, 10000),
(3, 4, 1, 25000);

-- 6. Insertar Citas (Hoy y Pasadas)
-- Cita 1: Completada ayer (Juan)
INSERT INTO citas (id, cliente_id, trabajador_id, fecha, hora, estado, descuento, metodo_pago) VALUES
(1, 1, 2, CURDATE() - INTERVAL 1 DAY, '15:00:00', 'Completada', 0, 'Efectivo');
INSERT INTO cita_detalle (cita_id, servicio_id, precio_cobrado) VALUES (1, 2, 14000);

-- Cita 2: Hoy - Pendiente (Carlos)
INSERT INTO citas (id, cliente_id, trabajador_id, fecha, hora, estado) VALUES
(2, 4, 3, CURDATE(), '11:00:00', 'Pendiente');
INSERT INTO cita_detalle (cita_id, servicio_id, precio_cobrado) VALUES (2, 1, 12000);

-- Cita 3: Hoy - Terminado, Esperando Pago en Caja (Juan)
INSERT INTO citas (id, cliente_id, trabajador_id, fecha, hora, estado) VALUES
(3, 2, 2, CURDATE(), '13:00:00', 'Terminado_Esperando_Pago');
INSERT INTO cita_detalle (cita_id, servicio_id, precio_cobrado) VALUES (3, 4, 20000);

-- Cita 4: Hoy - Completada por el Barbero (Diego)
INSERT INTO citas (id, cliente_id, trabajador_id, fecha, hora, estado, descuento, metodo_pago) VALUES
(4, 3, 4, CURDATE(), '14:30:00', 'Completada', 5000, 'Transferencia');
INSERT INTO cita_detalle (cita_id, servicio_id, precio_cobrado) VALUES (4, 4, 20000), (4, 3, 5000);

-- Cita 5: Hoy - Pendiente (Juan)
INSERT INTO citas (id, cliente_id, trabajador_id, fecha, hora, estado) VALUES
(5, 1, 2, CURDATE(), '16:00:00', 'Pendiente');
INSERT INTO cita_detalle (cita_id, servicio_id, precio_cobrado) VALUES (5, 2, 14000);

-- Cita 6: Hoy - Cancelada (Carlos)
INSERT INTO citas (id, cliente_id, trabajador_id, fecha, hora, estado) VALUES
(6, 5, 3, CURDATE(), '17:00:00', 'Cancelada');
INSERT INTO cita_detalle (cita_id, servicio_id, precio_cobrado) VALUES (6, 1, 12000);

-- 7. Actualizar ingresos del mes en base a estas citas
-- (Esto se calcula on the fly en el dashboard, por lo que con esto basta)
