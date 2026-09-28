const { withGradleProperties } = require('@expo/config-plugins');

// Sube la memoria de Gradle (spec fase 16): con los 2048m por defecto que trae Expo, el build
// "release" (make release) fallaba en `mergeDexRelease` con `OutOfMemoryError: Java heap space`
// — el debug no minifica ni optimiza tanto, así que no lo sufre. `android/` se regenera con
// `expo prebuild` en cada cambio relevante de app.json/package.json, así que esto tiene que
// vivir en un plugin (no en `android/gradle.properties` a mano, que se perdería).
const withGradleHeap = (config) =>
  withGradleProperties(config, (config) => {
    const key = 'org.gradle.jvmargs';
    const value = '-Xmx4096m -XX:MaxMetaspaceSize=1024m';
    const existing = config.modResults.find((item) => item.type === 'property' && item.key === key);

    if (existing) {
      existing.value = value;
    } else {
      config.modResults.push({ type: 'property', key, value });
    }

    return config;
  });

module.exports = withGradleHeap;
