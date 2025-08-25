#!/usr/bin/env node

/**
 * Script para generar un JWT_SECRET seguro
 * Uso: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

function generateJWTSecret() {
  // Generar 32 bytes (256 bits) de entropía aleatoria
  const secret = crypto.randomBytes(32).toString('hex');
  
  console.log('🔐 JWT_SECRET generado exitosamente!');
  console.log('');
  console.log('📋 Copia esta línea en tu archivo .env:');
  console.log('');
  console.log(`JWT_SECRET=${secret}`);
  console.log('');
  console.log('⚠️  IMPORTANTE:');
  console.log('   - Mantén este secreto seguro y no lo compartas');
  console.log('   - No lo subas a control de versiones');
  console.log('   - Usa diferentes secretos para desarrollo y producción');
  console.log('');
  console.log('✅ El secreto cumple con los requisitos de seguridad:');
  console.log(`   - Longitud: ${secret.length} caracteres`);
  console.log(`   - Entropía: ${32 * 8} bits`);
  
  return secret;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateJWTSecret();
}

module.exports = { generateJWTSecret };
