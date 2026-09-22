/**
 * Mide CA-2.8 / RNF-2.2: el login debe tardar lo mismo exista o no el correo.
 * Uso: npx ts-node scripts/timing-login.ts <urlBase> <correoExistente> <intentos>
 */
const [, , base = 'http://localhost:3993/api', existing = 'ana@test.com', nStr = '100'] =
  process.argv;
const n = Number(nStr);

const measure = async (email: string): Promise<number> => {
  const times: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'ContraseñaIncorrecta9' }),
    });
    times.push(performance.now() - t0);
  }
  return times.reduce((a, b) => a + b, 0) / times.length;
};

void (async () => {
  const existente = await measure(existing);
  const inexistente = await measure(`no-existe-${Date.now()}@test.com`);
  const diff = (Math.abs(existente - inexistente) / Math.max(existente, inexistente)) * 100;

  console.log(`  correo existente:   ${existente.toFixed(1)} ms`);
  console.log(`  correo inexistente: ${inexistente.toFixed(1)} ms`);
  console.log(`  diferencia: ${diff.toFixed(1)} %  ${diff < 10 ? '✅ < 10 %' : '❌ >= 10 %'}`);
})();
