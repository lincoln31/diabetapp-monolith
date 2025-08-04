// Importamos la librería Express
import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';

// Creamos una instancia de la aplicación Express
const app: Application = express();

// Definimos el puerto en el que escuchará nuestro servidor
// Usará el puerto que nos dé el hosting (process.env.PORT) o el 3000 si estamos en local
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] 📥 ${req.method} ${req.originalUrl}`);
  next();
});
// Configurar CORS para permitir peticiones desde tu app móvil
app.use(cors({
  origin: '*', // En producción, especifica tu dominio
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para que Express pueda entender JSON en el cuerpo de las peticiones
app.use(express.json());

// Ruta de bienvenida en la raíz
app.get('/', (req: Request, res: Response) => {
    res.status(200).send('Bienvenido al edificio de la API de DiabetApp. Visita /api para ver los datos.');
  });
// Definimos una ruta de prueba en la raíz de nuestra API ("/")
// Req = Petición (Request), Res = Respuesta (Response)
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ message: '¡Hola, DiabetApp! El backend está funcionando.' });
});

// 2. Le decimos a la app que use nuestras nuevas rutas bajo el prefijo /api/auth
app.use('/api/auth', authRoutes);

// 🔍 DEBUGGING: Capturar rutas no encontradas
app.use( (req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Ruta no encontrada',
    method: req.method,
    url: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /api',
      'GET /api/test',
      'POST /api/auth/login',
      'POST /api/auth/register'
    ]
  });
});
// Ponemos el servidor a escuchar en el puerto definido
// Ponemos el servidor a escuchar en el puerto definido
app.listen(PORT, '0.0.0.0', () => { // 👈 IMPORTANTE: '0.0.0.0' para aceptar conexiones externas
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📱 Para móvil: http://192.168.1.9:${PORT}`);
  console.log(`🔍 Rutas disponibles:`);
  console.log(`   GET  http://192.168.1.9:${PORT}/`);
  console.log(`   GET  http://192.168.1.9:${PORT}/api`);
  console.log(`   GET  http://192.168.1.9:${PORT}/api/test`);
  console.log(`   POST http://192.168.1.9:${PORT}/api/auth/login`);
});