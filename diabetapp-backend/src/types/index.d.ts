import { User } from '../../models/User'; // o la interfaz que tengas

declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}
