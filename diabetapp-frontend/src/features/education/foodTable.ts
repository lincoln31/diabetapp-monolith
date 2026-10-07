/**
 * Tabla de equivalencias de carbohidratos (spec fase 17, D-17.4): contenido fijo en el
 * frontend, igual que `TIPS`/`GUIDES`/`FAQS` (fase 10) — sin backend ni edición desde la app.
 * Transcrita de la lista de alimentos con contenido de carbohidratos compartida por el usuario
 * (bibliografía: atlas de porciones UIS, listas de intercambio ADA/universidades colombianas).
 */
export interface FoodItem {
  id: string;
  name: string;
  category: string;
  /** Descripción de la porción, p. ej. "1 unidad mediana". */
  portion: string;
  /** Peso o volumen de la porción, en gramos o mililitros. */
  portionGrams: number;
  /** Gramos de carbohidratos de esa porción. */
  carbsGrams: number;
}

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

type RawFood = [string, string, number, number];

const CEREALES: RawFood[] = [
  ['Almojábana', '1 unidad mediana', 100, 30],
  ['Amaranto cocido', '8 cdas soperas', 80, 15],
  ['Arepa de maíz (blanco o amarillo)', '1 unidad del tamaño de un CD y 1/2 cm de grosor', 80, 30],
  ['Arepa paisa', '1 unidad del tamaño de un CD', 40, 15],
  ['Arepa redonda pequeña', '1 unidad', 30, 10],
  ['Arroz cocido', '1 taza', 150, 45],
  ['Avena cruda en hojuelas', '3 cdas soperas rasas', 20, 15],
  ['Buñuelo', '1 unidad mediana', 80, 30],
  ['Cereal integral (Fitness Nestlé)', '1 bolsa de tamaño personal', 35, 29],
  ['Cereal Corn Flakes', '1/2 taza', 19, 15],
  ['Cebada perlada cocida', '3 cdas soperas rasas', 30, 23],
  ['Cuscús cocido', '1 taza', 160, 45],
  ['Cruasán (mantequilla o queso)', '1 unidad mediana', 70, 33],
  ['Empanada', '1 unidad mediana', 52, 30],
  ['Envuelto de mazorca', '1 unidad mediana', 100, 30],
  ['Fécula de maíz', '4 cdas soperas rasas', 30, 24],
  ['Galleta soda (saltina o integral)', '3 unidades', 20, 15],
  ['Granola', '1/2 taza', 45, 30],
  ['Harina de trigo', '3 cdas soperas rasas', 20, 15],
  ['Maíz pira preparado', '1 taza', 12, 5],
  ['Mantecada (ponqué o torta sin crema)', '1 tajada mediana', 63, 35],
  ['Mazorca cocida', '1 unidad grande', 150, 30],
  ['Mazorca desgranada', '1 cda sopera rasa', 15, 3],
  ['Pan tajado (blanco, centeno, integral)', '1 tajada', 30, 15],
  ['Pan (blandito, rollo, mantequilla, de panadería)', '1 unidad pequeña', 40, 20],
  ['Pan perro', '1 unidad mediana', 68, 35],
  ['Pan hamburguesa', '1 unidad mediana', 92, 45],
  ['Pan de bono', '1 unidad mediana', 40, 30],
  ['Pan de yuca', '1 unidad grande', 70, 30],
  ['Pan pita', '1 unidad del tamaño de un CD', 50, 30],
  ['Pasta', '1 taza', 134, 45],
  ['Tostada / calado', '1 unidad pequeña', 13, 10],
  ['Tortilla mexicana', '1 unidad mediana', 30, 15],
  ['Taco mexicano vacío', '1 unidad', 13, 8],
  ['Quinua cocida', '7 cdas soperas rasas', 70, 15],
  ['Waffle', '1 unidad rectangular de 14x7 cm', 45, 15],
  ['Pancake', '1 unidad del tamaño de un CD y 1/2 cm de grosor', 30, 15],
];

const TUBERCULOS: RawFood[] = [
  ['Arracacha', '1/2 unidad mediana', 75, 15],
  ['Papa común', '1 unidad mediana', 77, 15],
  ['Papa criolla', '3 unidades pequeñas', 84, 15],
  ['Papa francesa', '20 unidades delgadas', 80, 30],
  ['Plátano (colí o guineo con cáscara)', '1 unidad pequeña', 145, 15],
  ['Plátano hartón', '1/2 unidad mediana o 4 tajadas medianas', 100, 30],
  ['Ñame', '1 trozo mediano', 67, 15],
  ['Yuca', '1 astilla pequeña', 48, 15],
  ['Olluco / chuguas', '7 unidades grandes', 118, 15],
];

const LEGUMINOSAS: RawFood[] = [
  ['Arveja seca cocida', '1 taza', 150, 30],
  ['Frijol rojo cocido', '1 taza', 150, 30],
  ['Garbanzo cocido', '1 taza', 150, 30],
  ['Lenteja cocida', '1 taza', 150, 30],
  ['Carve cocido', '1 taza', 100, 33],
  ['Bienestarina', '1 cda sopera colmada', 20, 12],
  ['Colombiarina', '1 cda sopera colmada', 11, 7],
];

const LACTEOS: RawFood[] = [
  ['Leche entera', '1 vaso', 200, 10],
  ['Leche semi/descremada', '1 vaso', 200, 10],
  ['Leche deslactosada', '1 vaso', 200, 10],
  ['Leche en polvo entera', '3 cdas colmadas', 27, 10],
  ['Yogur Finesse', '1 vaso', 180, 11],
  ['Yogur Slight Colanta', '1 vaso', 200, 12],
  ['Yogur Benecol', '1 unidad', 100, 4],
  ['Avena Finesse', '1 vaso', 250, 15],
  ['Yogur Pasco (tipo postre sin azúcar)', '1 vaso', 150, 5],
  ['Yogur Slim Natural (Doña Leche)', '1 vaso', 200, 12],
  ['Helado light Mimos', '1 bola', 70, 18],
  ['Paleta light Robin Hood', '1 unidad', 60, 20],
];

const VERDURAS: RawFood[] = [
  ['Verdura cocida', '1 taza', 185, 10],
  ['Verdura cruda', '1 taza', 100, 5],
];

const FRUTAS: RawFood[] = [
  ['Aguacate', '1/4 de unidad mediana', 80, 3.5],
  ['Anón', '1 unidad pequeña', 150, 15],
  ['Banano común', '1/2 unidad mediana', 100, 15],
  ['Banano bocadillo', '1 unidad pequeña', 70, 15],
  ['Chirimoya', '1/2 unidad mediana', 150, 15],
  ['Chontaduro', '1 unidad pequeña', 27, 10],
  ['Ciruela común', '3 unidades pequeñas', 116, 15],
  ['Ciruela importada', '1 unidad mediana', 116, 15],
  ['Ciruela pasa', '3 unidades pequeñas', 25, 15],
  ['Coco', '3 cdas postreras', 15, 2],
  ['Curuba', '6 unidades medianas', 238, 15],
  ['Durazno nacional', '2 unidades pequeñas', 147, 15],
  ['Durazno importado (nectarín)', '1 unidad mediana', 120, 15],
  ['Feijoa', '2 unidades medianas', 125, 15],
  ['Fresa', '13 unidades pequeñas', 200, 15],
  ['Granadilla', '2 unidades medianas', 225, 15],
  ['Guayaba', '2 unidades medianas', 128, 15],
  ['Guanábana', '6 cdas soperas rasas', 170, 15],
  ['Higo', '3 unidades medianas', 360, 15],
  ['Mandarina', '1 unidad grande o 2 pequeñas', 230, 15],
  ['Mango de azúcar', '1 unidad pequeña', 165, 15],
  ['Mango Tommy', '3/4 de taza', 107, 15],
  ['Manzana', '1 unidad pequeña', 130, 15],
  ['Melón', '1 taza', 140, 15],
  ['Moras', '22 unidades', 235, 15],
  ['Níspero sin semillas', '2 unidades pequeñas', 110, 15],
  ['Naranja', '1 unidad mediana', 285, 15],
  ['Papaya', '1 taza picada', 140, 15],
  ['Pera', '1 unidad mediana', 100, 15],
  ['Piña', '1/2 taza picada o 1 tajada delgada', 100, 15],
  ['Tomate de árbol', '2 unidades grandes', 335, 15],
  ['Toronja', '1 unidad grande', 335, 15],
  ['Uchuva', '13 unidades', 75, 15],
  ['Uva nacional', '20 unidades', 205, 15],
  ['Zapote', '1 unidad mediana', 410, 15],
  ['Pitahaya', '1 unidad grande', 220, 15],
  ['Sandía / patilla', '1 tajada delgada', 180, 15],
  ['Tamarindo', '1 y 1/2 cdas soperas', 50, 15],
];

const PROCESADOS: RawFood[] = [
  ['Arroz con pollo', '1 taza', 170, 38],
  ['Pizza (Zenú)', '1 tajada mediana', 130, 35],
  ['Lasaña (Zenú)', '1 porción mediana', 445, 47],
  ['Hamburguesa (de pan Bimbo)', '1 unidad mediana', 210, 45],
  ['Nuggets de pollo (Zenú)', '5 unidades', 85, 14],
  ['Aborrajado (sin bocadillo, Kalisto)', '1 unidad pequeña', 112, 20],
  ['Tamal (santandereano, sin hojas)', '1 unidad mediana', 200, 75],
  ['Tamal (tolimense, sin hojas)', '1 unidad mediana', 325, 60],
  ['Salvado de trigo', '5 cdas rasas', 50, 32],
  ['All Bran', '6 cucharadas', 40, 30],
  ['Tostada Bimbo', '2 unidades', 31, 21],
  ['Paleta en agua (Mimos, light)', '1 unidad', 70, 4],
  ['Papas fritas (Margarita)', '1 paquete', 25, 12],
  ['Rosquitas (Cronch)', '1 paquete', 19, 13],
  ['Tajaditas de plátano (verde)', '1 paquete', 28, 20],
  ['Instacrem', '1 sobre', 4, 3],
  ['Chocolyne', '1 pastilla', 10, 3],
  ['Choco Express Lyne', '1 cucharadita en polvo', 4, 2],
  ['Maní', '1 paquete / 50 gramos', 50, 10],
  ['Marañón', '1 paquete', 40, 10],
  ['Mezcla de nueces', '1 paquete', 50, 11],
  ['Barra granola (Sport Lyne)', '1 unidad', 23, 16],
  ['Arequipe de Antaño (light)', '2 cdas soperas rasas', 25, 13.5],
];

const CATEGORIES: [string, RawFood[]][] = [
  ['Cereales y derivados', CEREALES],
  ['Tubérculos y plátanos', TUBERCULOS],
  ['Leguminosas', LEGUMINOSAS],
  ['Bebidas lácteas', LACTEOS],
  ['Verduras', VERDURAS],
  ['Frutas', FRUTAS],
  ['Alimentos procesados', PROCESADOS],
];

/** ~130 alimentos con su contenido de carbohidratos (RF-17.2). */
export const FOOD_TABLE: FoodItem[] = CATEGORIES.flatMap(([category, items]) =>
  items.map(([name, portion, portionGrams, carbsGrams]) => ({
    id: slugify(`${category}-${name}`),
    name,
    category,
    portion,
    portionGrams,
    carbsGrams,
  })),
);

/** Búsqueda por nombre, sin distinguir mayúsculas ni tildes (RF-17.2). */
export const searchFood = (query: string, limit = 15): FoodItem[] => {
  const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const needle = normalize(query.trim());
  if (needle === '') return [];

  return FOOD_TABLE.filter((item) => normalize(item.name).includes(needle)).slice(0, limit);
};
