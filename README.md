# Sistema de Gestión de Biblioteca Pública

Aplicación web para administrar socios, materiales, ejemplares, préstamos y reservas de una biblioteca pública.

## Integrantes

- FLORES FRANCO, ADRIANA MARIA
- CCARHUAS FLORES, LISSANIA JUMARA
- ROMERO ROMUCHO, DANILO VICTOR
- SANCHEZ IRIGOYEN, JORGE NOE
- SALAZAR CARTAGENA, JARED SAHIR
- FLORES RIVERA, JULIO GUILLERMO

## Tecnologías

- React 19 y React Router
- Tailwind CSS y Bootstrap Icons
- Node.js y Express
- PostgreSQL en Supabase
- Autenticación por token firmado

## Estructura

```text
src/                 Frontend React
public/              Recursos públicos
backend/             API Express
backend/routes/      Rutas de la API
backend/controllers/ Controladores
backend/services/    Lógica de negocio
backend/models/      Acceso a datos
bd_biblioteca_public.txt  Script PostgreSQL/Supabase
```

## Ejecución local

1. Instala las dependencias:

```bash
npm install
npm install --prefix backend
```

2. Copia las variables de ejemplo:

```bash
copy .env.example .env
copy backend\.env.example backend\.env
```

3. Configura las credenciales de Supabase y `SESSION_SECRET`.

4. Ejecuta frontend y backend:

```bash
npm start
```

También pueden ejecutarse por separado:

```bash
npm run start:frontend
npm run start:backend
```

La interfaz estará disponible en `http://localhost:3000` y la API en `http://localhost:5000`.

### Generar `SESSION_SECRET` en PowerShell

En VS Code, abre PowerShell y ejecuta localmente:

```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

Copia el resultado directamente en `backend\.env` como valor de `SESSION_SECRET`. No lo envíes por chat, no lo incluyas en capturas ni lo guardes en el repositorio. `backend\.env.example` contiene solo un marcador; reemplázalo únicamente en el archivo local ignorado por Git.

`SUPABASE_SERVICE_ROLE_KEY`, `FACTILIZA_TOKEN` y `SESSION_SECRET` son valores privados del backend y nunca deben agregarse a variables `REACT_APP_*`. La clave publicable de Supabase y los datos de contacto de Yape no son claves secretas, pero deben configurarse en el entorno correspondiente. Si un secreto real se compartió en una captura o mensaje, rótalo desde el proveedor.

La pantalla de métodos de pago solo muestra las opciones y su configuración. No procesa cobros. Antes de habilitar tarjetas o confirmar pagos Yape, el equipo debe elegir un proveedor y conectar su API/webhook exclusivamente desde el backend.

### Base de datos y comprobación

La aplicación está adaptada al esquema final de Supabase: `lector`, `libro`, `ejemplar`, `prestamo`, `detalle_prestamo`, `reserva`, `autor`, `editorial`, `categoria`, `usuario` y `rol`. En la interfaz, Socios consulta `lector` y Materiales consulta `libro`; no se requiere una tabla `sede`. Las reservas usan `estado` para su flujo (`PENDIENTE`, `ATENDIDA`, `VENCIDA` o `CANCELADA`), no como indicador de baja lógica.

Configura `REACT_APP_SUPABASE_URL` y `SUPABASE_URL` para que frontend y backend apunten al mismo proyecto de Supabase. Aplica tambien la migracion `backend/migrations/20261126_mejora_base_datos.sql` en el SQL Editor de Supabase para agregar restricciones, indices, auditoria automatica y vistas de consulta. Si aparece `Could not find the table ... in the schema cache` para una tabla incluida en el respaldo, confirma que el esquema se importó a ese proyecto y actualiza la caché del esquema de la API de Supabase. No ejecutes migraciones de un esquema anterior sin revisar que coincidan con esta base.

Las altas, modificaciones y bajas del catálogo (`autor`, `editorial`, `categoria`, `libro` y `ejemplar`) pasan por la API autenticada y requieren `SUPABASE_SERVICE_ROLE_KEY` únicamente en `backend/.env`. No crees políticas RLS abiertas para `anon` ni expongas esa clave al frontend; el acceso a estas rutas requiere una sesión válida con el módulo `CATALOGO`.

Ejecuta las verificaciones locales:

```bash
npm test -- --watchAll=false
npm test --prefix backend
npm run build
```

Prueba el flujo de registro de socio, inicio de sesión, consulta de DNI con una sesión válida, acceso al catálogo y lectura en tamaños de pantalla distintos. Los pagos con tarjeta requieren seleccionar e integrar un proveedor antes de aceptar pagos reales; no se deben simular como transacciones completadas.
