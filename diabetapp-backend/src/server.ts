// Importamos la librería Express
import express, { Request, Response } from 'express';

// Creamos una instancia de la aplicación Express
const app = express();

// Definimos el puerto en el que escuchará nuestro servidor
// Usará el puerto que nos dé el hosting (process.env.PORT) o el 3000 si estamos en local
const PORT = process.env.PORT || 3000;

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

// Ponemos el servidor a escuchar en el puerto definido
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});