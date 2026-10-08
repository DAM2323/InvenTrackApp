# InvenTrack
Sistema de gestión de inventarios para pymes con sucursales. TB1 Arquitectura de Aplicaciones Web, Grupo 6.

## Estado del proyecto
Proyecto base listo para implementar las historias de usuario del negocio (venta, compra y recepción, traslado, inventario y alertas, kárdex y reportes).

## Qué incluye la base
- Spring Boot 4.1.1, Java 25, Maven y PostgreSQL.
- Entidades y repositorios de las 17 tablas.
- Manejo global de errores y carga automática de la base (`DB_INIT=true`).
- CRUD de datos de apoyo: sucursal, usuario, categoría, marca, producto, proveedor, producto-proveedor, cliente y método de pago.
- Login: `POST /auth/login`.
- Script `db/inventrack.sql` con mínimo 10 registros por tabla y diagrama en `db/DIAGRAMA_BD.png`.
- `Dockerfile` para el despliegue en Render.

## Variables de entorno
`DB_URL`, `DB_USER`, `DB_PASSWORD`, `DB_INIT` (true solo en una base vacía) y `PORT`.

## Ejecutar
```
cd inventrack
./mvnw spring-boot:run
```

## Cómo implementar una HU
Cada HU se arma por capas, igual que los módulos de apoyo que ya existen (por ejemplo `ProveedorController`, `ProveedorService` y `ProveedorRequest`):
1. `dto/`: el request del POST/PUT, con los mismos campos que el prototipo y siempre con `idUsuario` (quien registra).
2. `service/`: la lógica de negocio con `@Transactional`; ahí se actualiza `Inventario` y se registra `MovimientoInventario`.
3. `controller/`: las rutas de la HU; los registrar responden `201 Created`.
4. Errores: lanzar `BadRequestException` (400), `NotFoundException` (404) o `ConflictException` (409); `GlobalExceptionHandler` arma la respuesta.

Todas las tablas ya tienen su entidad y su repositorio (incluidos `TrasladoRepository` y `DetalleTrasladoRepository`). Si una HU necesita otra consulta, se agrega el método en el repositorio correspondiente.
