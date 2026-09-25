import { Application } from 'express';
import supertest from 'supertest';
import { createApp } from '../../src/app';

/**
 * Cliente HTTP contra la app, sin abrir ningún puerto (spec fase 1, RF-1.12).
 *
 * La app se crea **una sola vez por archivo de test**: los contadores de
 * `express-rate-limit` viven en la instancia, así que crear una app por
 * petición haría imposible probar los límites.
 */
let app: Application | null = null;

export const api = () => {
  app ??= createApp();
  return supertest(app);
};
