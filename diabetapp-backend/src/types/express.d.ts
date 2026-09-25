declare global {
  namespace Express {
    interface Request {
      /** Usuario autenticado (lo rellena el middleware `authenticate`). */
      user?: {
        id: string;
        email?: string;
      };
      /** Datos ya validados por el middleware `validate`. */
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
