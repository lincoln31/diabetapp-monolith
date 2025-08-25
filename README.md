# 🩸 DiabetApp (in progress)

Una aplicación móvil completa para el seguimiento y gestión de la diabetes, construida con React Native (Expo) y Node.js.

## 📋 Descripción

DiabetApp es una solución integral que ayuda a las personas con diabetes a monitorear sus niveles de glucosa, mantener un registro de sus medicamentos y seguir un plan de tratamiento personalizado. La aplicación está diseñada con un enfoque en la usabilidad y la experiencia del usuario, proporcionando herramientas esenciales para el manejo diario de la diabetes.

## ✨ Características Principales

### 🔐 Autenticación y Seguridad
- Sistema de registro e inicio de sesión seguro
- Autenticación JWT
- Encriptación de contraseñas con bcrypt
- Protección de datos médicos sensibles

### 📊 Monitoreo de Glucosa
- Registro de lecturas de glucosa con timestamp
- Categorización por momento del día (ayunas, después de comidas, etc.)
- Notas personalizadas para cada registro
- Validación de rangos de valores (20-600 mg/dL)

### 👤 Perfil Personalizado
- Información personal y médica
- Tipo de diabetes (Tipo 1, Tipo 2, Gestacional, Prediabetes)
- Metas personalizadas de HbA1c y glucosa
- Configuración de medicamentos y actividad física

### 🎯 Metas y Seguimiento
- Establecimiento de metas diarias de glucometrías
- Objetivos de ejercicio físico
- Seguimiento de progreso personalizado

## 🏗️ Arquitectura del Proyecto

El proyecto está estructurado como un monorepo con dos componentes principales:

```
diabetapp-monolith/
├── diabetapp-backend/     # API REST con Node.js + Express
├── diabetapp-frontend/    # App móvil con React Native + Expo
└── README.md
```

### Backend (`diabetapp-backend/`)
- **Framework**: Node.js con Express
- **Base de datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT + bcrypt
- **Validación**: Zod
- **Contenedorización**: Docker Compose

### Frontend (`diabetapp-frontend/`)
- **Framework**: React Native con Expo
- **Navegación**: Expo Router
- **UI Components**: Componentes personalizados
- **Estado**: React Hooks
- **HTTP Client**: Axios



## 📱 Uso de la Aplicación

### Registro e Inicio de Sesión
1. Abre la aplicación en tu dispositivo móvil
2. Crea una cuenta nueva o inicia sesión con credenciales existentes
3. Completa el proceso de onboarding con tu información médica

### Registro de Glucosa
1. Toca el botón "+" para agregar una nueva lectura
2. Ingresa el valor de glucosa en mg/dL
3. Selecciona el momento del día
4. Agrega notas opcionales
5. Guarda el registro

### Seguimiento
- Revisa tu historial de lecturas
- Monitorea tu progreso hacia las metas establecidas
- Recibe recordatorios personalizados



## 🗄️ Base de Datos

### Modelos Principales

#### User
- Información personal y médica
- Configuración de metas y preferencias
- Datos de autenticación

#### GlucoseReading
- Valores de glucosa
- Timestamp y contexto
- Notas del usuario

## 🔒 Seguridad

- Contraseñas encriptadas con bcrypt (12 rounds)
- Autenticación JWT
- Validación de datos con Zod
- Protección CORS configurada
- Manejo seguro de datos médicos

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación
- **bcrypt** - Encriptación de contraseñas
- **Zod** - Validación de esquemas
- **TypeScript** - Tipado estático

### Frontend
- **React Native** - Framework móvil
- **Expo** - Plataforma de desarrollo
- **Expo Router** - Navegación
- **TypeScript** - Tipado estático
- **Axios** - Cliente HTTP
- **React Native Vector Icons** - Iconografía

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.




---

**DiabetApp** - Tu compañero digital para el manejo de la diabetes 💙
