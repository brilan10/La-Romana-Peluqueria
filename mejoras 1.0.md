# Backlog de Mejoras y Nuevas Funcionalidades (La Romana)

Este documento detalla los requerimientos técnicos y funcionales pendientes de implementación en el sistema de gestión de la barbería La Romana, organizados por módulos.

## 📊 1. Analítica y Reportes
- [ ] **Exportación Segmentada a Excel:** Modificar la exportación de reportes para generar un archivo con múltiples hojas (una por barbero). Cada hoja detallará el volumen de servicios y los ingresos generados en el rango de fechas seleccionado.
- [ ] **Desglose Automático de Comisiones:** Incorporar, tanto en el panel visual como en los reportes de Excel, el cálculo automatizado de ganancias (monto del barbero vs. monto de la tienda), aplicando el esquema de comisiones correspondiente a cada jornada.

## 📅 2. Calendario y Gestión de Citas
- [ ] **Filtros en la Agenda del Día:** Implementar un filtro dinámico en la tabla "Agenda del Día" para segmentar y visualizar de manera aislada los turnos de un barbero específico.
- [ ] **Calendario Interactivo Multiusuario:** Desarrollar una vista gráfica avanzada de calendario que consolide la agenda de todo el equipo, incorporando controles rápidos para filtrar la vista por profesional.
- [ ] **Agendamiento Express (Perfil Barbero):** Habilitar un flujo rápido de agendamiento para que los barberos creen citas desde su panel. Debe incluir la opción de registrar a un nuevo cliente en el acto solicitando únicamente Nombre y RUT.

## 👥 3. Gestión de Clientes (CRM)
- [ ] **Módulo de Cartera de Clientes:** Construir un directorio centralizado (CRM) que capture y organice automáticamente los datos de todo nuevo cliente, permitiendo llevar un historial de atención y facilitando el seguimiento a futuro.

## 💰 4. Pagos, Precios y Flujo de Caja
- [ ] **Descuentos Manuales en Servicios:** Conceder al barbero o administrador  la opción de ajustar o rebajar el precio base del servicio al momento de la atención, permitiendo aplicar descuentos justificados (ej. tarifa preferencial para tercera edad).
- [ ] **Centralización de Pagos (Cobro por Administrador):** 
  - Modificar el flujo de venta: el barbero finaliza el servicio y deriva al cliente a caja, 2 cosas, el barbero lo cierra diciendo que pago en la aplicacion o el ladministrador en caja lo cierra igual.
  - El Administrador, desde el panel principal o calendario, gestiona el proceso de pago.
  - El Administrador confirma el servicio, aplica rebajas finales si corresponde, define el método de pago y cierra la cita como "Pagada".

## 🏦 5. Contabilidad y Comisiones Dinámicas
- [ ] **Esquema de Comisiones Variables:** Proveer al administrador la capacidad de configurar los porcentajes de repartición de forma diaria (ej. Día hábil: 60% Barbero / 40% Tienda; Día feriado: 70% Barbero / 30% Tienda).
- [ ] **Historial Inmutable de Cierres de Caja:** Crear un registro histórico en la base de datos para los cierres diarios, almacenando de forma permanente la configuración de porcentajes utilizada ese día para asegurar la integridad contable.
- [ ] **Cálculo sobre Ingresos Reales:** Ajustar la lógica del sistema para que las comisiones se calculen estrictamente sobre el **monto final efectivamente cobrado en caja** (después de descuentos), aplicando la tasa de comisión activa de esa fecha.
