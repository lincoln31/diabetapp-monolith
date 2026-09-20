declare global {
  namespace Express {
    interface Request {
      /** Usuario autenticado (lo rellena el middleware `authenticate`). */
      user?: {
        id: string;
        email?: string;
      };
      /** Datos de query/params ya validados por el middleware `validate`. */
      validated?: {
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
