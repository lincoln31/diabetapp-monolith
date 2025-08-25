# Middleware de Autenticación - DiabetApp Backend

## Descripción

Este middleware de autenticación verifica tokens JWT en las peticiones HTTP y extrae la información del usuario autenticado para que esté disponible en los controladores.

## Características

✅ **Verificación de Token JWT**: Valida tokens usando `jwt.verify()`
✅ **Extracción de userId**: Añade `req.user.id` a la petición
✅ **Manejo de Errores**: Respuestas HTTP apropiadas para diferentes tipos de errores
✅ **Seguridad**: Verifica formato "Bearer " y valida el token
✅ **Tipado TypeScript**: Extiende la interfaz `Request` de Express

## Uso

### 1. Aplicar a Rutas Específicas

```typescript
import { authenticateToken } from '../middleware/auth.middleware';

// Proteger una ruta específica
router.get('/profile', authenticateToken, getUserProfile);

// Proteger múltiples rutas
router.use(authenticateToken);
router.get('/', getAllItems);
router.post('/', createItem);
```

### 2. Acceder al Usuario en el Controlador

```typescript
export const getUserProfile = async (req: Request, res: Response) => {
  // req.user.id está disponible gracias al middleware
  const userId = req.user!.id;
  
  // Usar el userId para operaciones seguras
  const userProfile = await userService.getProfile(userId);
  res.json(userProfile);
};
```

### 3. Ejemplo Completo de Ruta Protegida

```typescript
// routes/glucoseRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { createGlucoseReading } from '../controllers/glucoseControllers';

const router = Router();

// Aplicar middleware a todas las rutas de este router
router.use(authenticateToken);

// Todas estas rutas requieren autenticación
router.post('/', createGlucoseReading);
router.get('/', getAllReadings);
router.get('/:id', getReadingById);

export default router;
```

## Respuestas de Error

El middleware maneja los siguientes errores con respuestas HTTP apropiadas:

| Error | Código HTTP | Descripción |
|-------|-------------|-------------|
| `ACCESS_TOKEN_REQUIRED` | 401 | No se proporcionó token de autorización |
| `INVALID_TOKEN_FORMAT` | 401 | Formato incorrecto (debe ser "Bearer <token>") |
| `INVALID_TOKEN` | 401 | Token JWT inválido |
| `TOKEN_EXPIRED` | 401 | Token JWT expirado |
| `SERVER_CONFIGURATION_ERROR` | 500 | JWT_SECRET no configurado |

## Configuración Requerida

### Variables de Entorno

```bash
# .env
JWT_SECRET=tu_secreto_jwt_muy_largo_y_seguro_de_al_menos_32_caracteres
```

### Generar JWT_SECRET Seguro

```bash
# Usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Usando OpenSSL
openssl rand -hex 32
```

## Estructura de Archivos

```
src/
├── middleware/
│   ├── auth.middleware.ts    # Middleware principal
│   └── index.ts             # Exportaciones
├── types/
│   └── express.d.ts         # Extensión de tipos de Express
└── config/
    └── env.ts               # Validación de variables de entorno
```

## Flujo de Autenticación

1. **Cliente envía petición** con header `Authorization: Bearer <token>`
2. **Middleware intercepta** la petición
3. **Verifica formato** del header
4. **Extrae token** JWT
5. **Valida token** usando `jwt.verify()`
6. **Extrae payload** (userId, email)
7. **Añade userId** a `req.user.id`
8. **Llama a next()** para continuar al controlador
9. **Controlador accede** a `req.user.id` de forma segura

## Seguridad

- ✅ Tokens expiran en 1 hora (configurable en `auth.service.ts`)
- ✅ Validación de formato "Bearer "
- ✅ Verificación criptográfica del token
- ✅ Manejo seguro de errores
- ✅ No expone información sensible en logs

## Testing

Para probar el middleware:

```bash
# 1. Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# 2. Login para obtener token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# 3. Usar token en ruta protegida
curl -X GET http://localhost:3000/api/glucose \
  -H "Authorization: Bearer <token_del_paso_2>"
```

## Troubleshooting

### Error: "JWT_SECRET no está configurado"
- Verifica que existe el archivo `.env`
- Asegúrate de que `JWT_SECRET` esté definido
- Reinicia el servidor después de cambiar `.env`

### Error: "Token inválido"
- Verifica que el token no haya expirado
- Asegúrate de que el formato sea `Bearer <token>`
- Verifica que el token sea válido

### Error: "Formato de token inválido"
- El header debe ser exactamente: `Authorization: Bearer <token>`
- No debe haber espacios extra
- El token debe estar después de "Bearer "
