# 🚀 Propuestas de Mejoras para "La Romana"

He analizado el código actual (`admin_api.php`, `AdminDashboard.jsx`, etc.) y he anotado las siguientes mejoras críticas y recomendaciones para el proyecto, enfocadas en seguridad, escalabilidad y buenas prácticas.

## 1. 🔒 Seguridad en el Backend (`admin_api.php`)
> [!CAUTION]
> El archivo actual de la API expone rutas críticas sin validación.

*   **Falta de Autenticación/Autorización:** Actualmente no hay validación de sesión (por ejemplo, `session_start()` y verificar `$_SESSION['admin_id']`). Cualquier persona con la URL podría acceder a los endpoints o modificar datos.
*   **Vulnerabilidad en Subida de Archivos:** La acción `upload_image` confía en la extensión del archivo provista por el usuario. Se debe usar `finfo_file` para validar el tipo MIME real y evitar la subida de shells PHP maliciosos.
*   **Manejo de Errores DB:** Las consultas PDO no están envueltas en bloques `try...catch`. Si falla una consulta, la ejecución se corta y podría revelar información de la estructura (Stack Traces) al cliente.

## 2. 🧩 Arquitectura y Refactorización Frontend (`AdminDashboard.jsx`)
> [!TIP]
> Un archivo de 1700+ líneas es difícil de mantener. Modularizar el código acelerará el desarrollo.

*   **División de Componentes:** Se recomienda encarecidamente extraer las pestañas a componentes individuales (ej: `<TabCaja />`, `<TabBodega />`, `<TabCalendario />`, `<TabCRM />`).
*   **Optimización de Promesas:** En `cargarDashboard()`, se hacen varios `fetch` secuenciales con `await`. Usar `Promise.all([fetch1, fetch2...])` cargaría los datos de forma concurrente, bajando el tiempo de espera casi a la mitad.
*   **Optimización del Polling:** Actualmente hay un `setInterval` cada 60 segundos que vuelve a solicitar mucha información al servidor. Considerar recargar solo los datos más dinámicos (Caja/Citas) y dejar los estáticos (Servicios/Categorías) fuera del polling.

## 3. ⚙️ Estructura del Servidor y Base de Datos
> [!WARNING]
> A medida que la aplicación crezca, el código espagueti será un bloqueador.

*   **Patrón de Enrutador (Router):** El archivo `admin_api.php` es un `switch` gigante de casi 500 líneas. Debería dividirse en controladores lógicos (ej: `Controllers/CajaController.php`, `Controllers/BodegaController.php`).
*   **Consultas N+1 (Rendimiento SQL):** En `get_crm_clientes`, se hacen subconsultas `(SELECT COUNT(*) ...)` directamente en el `SELECT`. Cuando haya muchos clientes, esto ralentizará la API. Es mejor usar un `LEFT JOIN` con `GROUP BY`.
*   **Transacciones SQL:** Acciones que implican más de una escritura (por ejemplo, cobrar una cita y actualizar la caja, o entregar premio y restar stock en `entregar_premio_crm`) deberían usar transacciones (`$pdo->beginTransaction()`, `$pdo->commit()`) para mantener la consistencia de los datos si ocurre un error a medias.

## 4. 💅 Experiencia de Usuario (UI/UX)
*   **Manejo Global de Estados (Zustand/Context API):** Para no tener 20+ `useState` en el mismo archivo, usar un gestor de estados para agrupar variables (ej: información del modal, filtros, carrito).
*   **Optimistic UI:** Al realizar acciones como cambiar estado a un pedido o agendar una cita, actualizar la UI localmente primero mientras se manda el fetch en segundo plano. Esto da la sensación de ser una app instantánea.
*   **Feedback Estandarizado:** Implementar consistentemente la función `showToast` en todas las acciones (éxito y errores) y no solo en algunas. Algunas funciones como `guardarNotasCRM` no dan alerta al usuario de que se guardó exitosamente.

## 5. 📝 Tareas Pendientes Solicitadas (Implementación 2.0)
> [!NOTE]
> Peticiones directas a implementar próximamente en la plataforma.

*   **Horarios de Atención para Barberos:** En el apartado de barberos (equipo/configuración), añadir soporte para definir y gestionar sus horarios de atención.
*   **Datos de Transferencia en UI:** En el portal del cliente, antes de finalizar un pedido o agendar el ticket (cita), mostrar explícitamente los datos bancarios para realizar la transferencia.
*   **Datos de Transferencia por Correo:** Enviar los datos para transferir directamente mediante correo electrónico al cliente tras generar su pedido o ticket.
*   **Comprobante por WhatsApp:** Añadir un mensaje destacado (en la UI y/o en el correo) indicando al cliente: *"Enviar comprobante por WhatsApp al +569 35379392 para adelantar el pedido"*.
*   **Acceso de Clientes sin Contraseña:** Modificar el login de clientes para que solo requiera ingresar el RUT. Si el RUT ya existe en el sistema, ingresa de inmediato. Si no está registrado, se le pedirá rellenar un formulario con Nombre y Correo (para poder enviarle notificaciones) creando su cuenta al instante.
*   **Módulo de RRHH (Estilo Villy Car):** Implementar la gestión de Recursos Humanos basada en el modelo de Villy Car (control de asistencia, perfiles, etc.).
*   **Sistema de Pagos y Cobros (Estilo Villy Car):** Integrar la lógica de pagos y cobros utilizada en Villy Car para un control financiero más completo.

---
**¿Te gustaría que empecemos a implementar alguna de estas mejoras en específico? (Por ejemplo: asegurar el API, dividir el AdminDashboard o mejorar las consultas).**
