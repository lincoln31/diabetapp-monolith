// en app/_layout.tsx
import { Slot } from 'expo-router';

export default function RootLayout() {
  // Slot simplemente renderizará la ruta activa
  // No tiene estilos, no tiene contenedores extra. Es el layout más simple posible.
  return <Slot />;
}