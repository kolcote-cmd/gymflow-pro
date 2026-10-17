# GymFlow Pro

Crea una aplicación web completa, profesional y de nivel comercial llamada "IronCore Gym Management System" (ERP y Punto de Venta para Gimnasios) utilizando React, Tailwind CSS, Lucide Icons, Shadcn UI y Supabase para el backend, autenticación y base de datos relacional.



### 1. ESTILO VISUAL & UI/UX (Industrial Dark Mode Pro)

- Tema por defecto: Dark Mode Industrial deportivo de alto impacto.

  - Fondo Base: `#0D1117` o `#121418`.

  - Tarjetas y Contenedores: `#161B22` o `#1E222B` con bordes sutiles en `#2D323E`.

  - Acento Primario: Neón Lima Eléctrico (`#E5FE40`) para botones de acción (CTA), estados activos y bordes en focus.

  - Acento Secundario: Naranja Intenso (`#FF5A1F`) para alertas de cobro y promociones.

  - Estados: Éxito Verde Neón (`#00E676`), Advertencia Ámbar (`#F59E0B`), Peligro/Denegado Rojo Carmesí (`#FF3B30`).

- Interfaz 100% responsiva (móvil, tablet y escritorio), con animaciones fluidas, barra lateral colapsable, métricas visuales y notificaciones toast.



### 2. AUTENTICACIÓN Y ROLES (Supabase Auth)

- Pantalla de inicio de sesión y registro seguro vinculada a la tabla `profiles`.

- Selector de roles con permisos diferenciados:

  1. `ADMIN` (Control total: finanzas, auditoría, configuración y gestión general).

  2. `RECEPCION` (Registro de socios, cobro de cuotas, torniquete de acceso y tienda POS).

  3. `ENTRENADOR` (Visualización de socios, asignación de rutinas y evaluaciones corporales).

  4. `SOCIO` (Portal del cliente: ver estado de suscripción, código QR personal, pagos y rutinas).

- Protección de rutas según el rol y soporte para cierre de sesión.



### 3. MÓDULOS Y VISTAS PRINCIPALES



1. **Dashboard Ejecutivo (Panel Principal):**

   - KPI Cards en tiempo real: Socios Activos Hoy, Aforo en Sala en Tiempo Real (ej. 42/80), Ingresos del Día ($) y Membresías por Vencer en los próximos 7 días.

   - Gráfica interactiva de afluencia por horas (horas pico vs valle).

   - Gráfica de ingresos mensuales por suscripciones vs tienda POS.

   - Feed lateral de actividad con los últimos 10 check-ins en tiempo real (con foto del socio y hora).



2. **Terminal de Control de Acceso & Torniquete (Check-In en Recepción):**

   - Buscador rápido por código de tarjeta, DNI o escáner de código QR.

   - Semáforo visual interactivo en pantalla completa o tarjeta central:

     - VERDE (`#00E676`): Acceso Aprobado (Membresía activa, muestra foto del socio, plan vigente y días restantes). Sonido de aprobación.

     - ROJO (`#FF3B30`): Acceso Denegado (Membresía vencida, socio inactivo o sin saldo). Motivo claro del bloqueo en pantalla.

   - Botón simulador de "Apertura Manual de Torniquete".



3. **Gestión Integral de Socios (CRUD Avanzado):**

   - Tabla reactiva con búsqueda instantánea por nombre, teléfono, código QR o DNI.

   - Filtros rápidos por estado: [Todos], [Activos], [Por Vencer], [Inactivos / Deudores].

   - Modal completo de registro y edición:

     - Pestaña 1: Datos Personales (nombres, apellidos, documento, teléfono, correo, contacto de emergencia).

     - Pestaña 2: Foto de perfil (soporte para subir imagen o activar webcam simulada) y generación de código QR único.

     - Pestaña 3: Ficha médica (padecimientos, alergias, observaciones).

   - Acciones: Ver expediente completo, renovar plan, editar datos y dar de baja lógica (`activo = false`).



4. **Membresías, Planes y Cobros (Facturación):**

   - Catálogo interactivo de planes: Pase Diario, Mensual Básico, Trimestral Pro, Anual VIP.

   - Punto de cobro rápido: seleccionar socio, elegir plan, método de pago (Efectivo, Tarjeta, Transferencia) y aplicar descuento.

   - Generación instantánea de comprobante o recibo digital imprimible en formato ticket POS y opción de exportar a PDF.



5. **Tienda POS (Punto de Venta e Inventario del Gimnasio):**

   - Cuadrícula táctil con fotos de productos: Suplementos (proteína, creatina), Bebidas hidratantes, Barras energéticas y Accesorios.

   - Carrito de compras lateral con cálculo automático de subtotal, impuestos y cambio en efectivo.

   - Alertas visuales de stock mínimo para reposición de mercancía.

   - Módulo de arqueo de caja (apertura, registro de ventas y cierre de turno).



6. **Rutinas y Evaluaciones Corporales:**

   - Asignador de rutinas semanales por grupo muscular (Día A, B, C) con series, repeticiones y descansos.

   - Ficha antropométrica de evolución: registro de peso, % de grasa corporal, masa muscular y medidas corporales.



7. **Configuración, Auditoría y Seguridad:**

   - Panel de control de usuarios del sistema y asignación de roles.

   - Historial de accesos y registro de auditoría de transacciones.



### 4. ESQUEMA DE BASE DE DATOS (Supabase PostgreSQL)

Genera la integración considerando las siguientes tablas relacionales con Row Level Security (RLS):

- `profiles` (id, email, full_name, role ['ADMIN', 'RECEPCION', 'ENTRENADOR', 'SOCIO'], avatar_url)

- `socios` (id, profile_id, codigo_socio, nombres, apellidos, dni, telefono, email, foto_url, qr_code, contacto_emergencia, notas_medicas, activo)

- `planes_membresia` (id, nombre, duracion_dias, precio, descripcion, activo)

- `suscripciones` (id, socio_id, plan_id, fecha_inicio, fecha_fin, estado ['ACTIVA', 'VENCIDA', 'CANCELADA'], total_pagado)

- `registros_acceso` (id, socio_id, fecha_hora, estado ['PERMITIDO', 'DENEGADO'], motivo_denegado)

- `productos` (id, codigo_barras, nombre, categoria, precio_venta, stock_actual, stock_minimo)

- `ventas_pos` (id, usuario_id, socio_id, total, metodo_pago, fecha_hora)

- `detalle_ventas_pos` (id, venta_id, producto_id, cantidad, precio_unitario, subtotal)



Incluye datos de prueba realistas (mock data) precargados con socios con membresía activa, socios con cuota vencida, productos en la tienda y estadí

sticas para poder navegar y probar la app de inmediato en todos los roles.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7d368224-cc9b-48a8-b830-92de2f6a1f4a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
