# Spec F7 — Perfil diabético y metas personales

| Campo | Valor |
|---|---|
| Fase | 7 |
| Estado | Aprobada |
| Fecha | 2026-09-23 |
| Depende de | Fase 2 (sesión), Fase 3 (estructura por funcionalidades y formularios), Fase 5 (dashboard que lee el rango meta), Fase 6 (proyección de HbA1c que lee `targetHba1c`) |
| Issues relacionados | Cierra #14, #15, #21. Se cierran por ya estar entregados (verificado en código): #13, #17, #18. Fuera de esta fase: #16 |
| Plan / Tareas | [plan.md](plan.md) · [tasks.md](tasks.md) |

## 1. Contexto y problema

| Hallazgo | Evidencia |
|---|---|
| H7.1 Las metas del usuario existen pero nadie puede cambiarlas | `User.targetGlucoseMin/Max` (80–180 por defecto) y `User.targetHba1c` (siempre `null`) están en el modelo, y las fases 5 y 6 ya los **leen** (marca «dentro/fuera de rango», comparación con la meta de HbA1c), pero ninguna pantalla ni endpoint los **escribe**. Todos los usuarios quedan con el rango por defecto. |
| H7.2 No hay pantalla de perfil | El registro captura nombre, correo, teléfono, fecha de nacimiento y contraseña; después el dato no se puede corregir ni completar (tipo de diabetes, peso, altura, actividad). `requiresOnboarding` se devuelve al registrarse, pero nada lo consume ni lo completa. |
| H7.3 No hay aviso al registrar un valor fuera de rango | `AddGlucoseScreen` guarda cualquier valor entre 20 y 600 sin decirle al paciente si está bajo o alto respecto a su meta. |
| H7.4 Tres issues del backlog ya están hechos | #13 (esquema de usuario ampliado): el modelo `User` ya tiene tipo de diabetes, metas, peso, altura, actividad, insulina, etc. #17 (momento del día) y #18 (notas): `AddGlucoseScreen` ya los tiene con `MOMENT_OF_DAY_OPTIONS` y `notes`. |

## 2. Objetivo

Que el paciente pueda **definir sus propias metas** (rango de glucosa y HbA1c) y completar su perfil diabético, y que la app las use: el dashboard y la proyección de HbA1c ya se adaptan solos, y al registrar una glucosa recibe un aviso visual claro si el valor queda fuera de su rango.

## 3. Alcance

**Incluye:** H7.1 a H7.3 — endpoint de perfil (#14), pantalla «Mi perfil» (#15) y alerta visual al registrar (#21); y el cierre de #13, #17 y #18 por estar ya entregados.

**No incluye:**
- Preferencias de notificaciones (#16): dependen de configurar FCM (#51) y del módulo de notificaciones; sin eso no habría nada que preferir.
- Medicamentos (`currentMedications`, `insulinType` detallado): pertenecen al módulo de medicación (#29–#35).
- Cambiar correo o contraseña, o borrar la cuenta.
- Editar nombre, apellido, teléfono y fecha de nacimiento desde el perfil (se capturan en el registro; se agregan cuando haga falta, sin issue que lo pida hoy).
- Recomendaciones médicas: la alerta solo informa; no aconseja tratamiento.

## 4. Historias de usuario

- **HU-7.1** Como paciente, quiero definir mi rango meta de glucosa (mínimo y máximo), porque mi médico me fijó uno distinto al valor por defecto.
- **HU-7.2** Como paciente, quiero definir mi meta de HbA1c, para que la proyección del dashboard se compare con ella.
- **HU-7.3** Como paciente, quiero indicar mi tipo de diabetes, peso, altura y nivel de actividad, para que mi perfil esté completo.
- **HU-7.4** Como paciente, quiero ver mi perfil actual antes de editarlo y que mis cambios se guarden con un mensaje claro.
- **HU-7.5** Como paciente, quiero que la app me avise, en el momento de registrar una glucosa, si el valor está por debajo o por encima de mi rango.
- **HU-7.6** Como paciente, quiero que el dashboard refleje mi nuevo rango apenas lo cambio, sin cerrar la app.

## 5. Requisitos funcionales

### Backend

| ID | Requisito | HU |
|---|---|---|
| RF-7.1 | DEBE existir un endpoint que devuelva el perfil del usuario autenticado: tipo de diabetes, metas (`targetGlucoseMin`, `targetGlucoseMax`, `targetHba1c`), peso, altura, nivel de actividad y `onboardingCompleted`. Nunca incluye contraseña ni datos de sesión. | HU-7.4 |
| RF-7.2 | DEBE existir un endpoint de actualización **parcial**: solo cambia los campos enviados, exige al menos uno, y un campo opcional PUEDE enviarse como `null` para borrarlo. | HU-7.1 – HU-7.3 |
| RF-7.3 | Los campos editables DEBEN validarse con límites razonables (ver plan D-7.2) y con los mismos enums de la base de datos (`DiabetesType`, `ActivityLevel`). Fuera de límites → `VALIDATION_ERROR` con el campo señalado. | HU-7.1 – HU-7.3 |
| RF-7.4 | El mínimo del rango meta DEBE ser menor que el máximo, comprobado contra el **resultado final** (incluyendo el valor ya guardado si solo se envía uno de los dos). El error se asigna al campo que corresponde. | HU-7.1 |
| RF-7.5 | Solo se puede leer y editar el perfil propio; no hay parámetro de id. Exige sesión. | — |
| RF-7.6 | Un cambio de metas DEBE verse de inmediato en `GET /glucose/stats` (`target`) y `GET /glucose/hba1c` (`targetHba1c`), sin cambios en esos endpoints. | HU-7.6 |

### Frontend

| ID | Requisito | HU |
|---|---|---|
| RF-7.7 | DEBE existir una pantalla «Mi perfil», accesible desde el dashboard, con un formulario precargado con los valores actuales. | HU-7.4 |
| RF-7.8 | El formulario DEBE editar: tipo de diabetes, rango meta de glucosa (mínimo y máximo), meta de HbA1c, peso, altura y nivel de actividad. Todos opcionales; dejar uno vacío lo borra. | HU-7.1 – HU-7.3 |
| RF-7.9 | Las reglas de validación DEBEN repetir las del backend (principio P3) y los errores del servidor DEBEN colocarse bajo su campo (patrón de la fase 3). | HU-7.1 |
| RF-7.10 | Al guardar con éxito, la app DEBE confirmarlo y volver al dashboard, que DEBE mostrar el rango nuevo (refresco al recuperar el foco, RF-5.13). | HU-7.6 |
| RF-7.11 | Al registrar una glucosa, si el valor ingresado está por debajo del mínimo o por encima del máximo del usuario, `AddGlucoseScreen` DEBE mostrar un aviso visual **antes de guardar** (bajo / alto, con color distinto de la marca «dentro del rango») y **no bloquea** el guardado. | HU-7.5 |
| RF-7.12 | Si el usuario no tiene rango (valores `null`) o no se pudo cargar, el aviso NO DEBE mostrarse y el registro DEBE seguir funcionando igual que hoy. | HU-7.5 |
| RF-7.13 | El primer guardado exitoso del perfil DEBE marcar `onboardingCompleted` como verdadero (ver decisión pendiente §8). | HU-7.4 |

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-7.1 | Sigue las reglas ya vigentes: módulo del backend con la misma forma que los demás (P4), sin `any` (P5), validación con Zod en la frontera (P3) y tests de integración (P6). |
| RNF-7.2 | Los valores de salud del perfil (peso, altura, metas) NO DEBEN aparecer en los logs (principio P1). |
| RNF-7.3 | El formulario y el aviso de rango DEBEN verse correctos en pantalla angosta (mismo criterio que las fases 3 y 5). |

## 7. Criterios de aceptación

| ID | Dado | Cuando | Entonces | RF |
|---|---|---|---|---|
| CA-7.1 | Un usuario autenticado | Pide su perfil | Recibe sus campos de perfil, sin contraseña, y sin necesidad de indicar un id | RF-7.1, RF-7.5 |
| CA-7.2 | Un usuario | Envía solo `targetHba1c: 6.5` | Se guarda ese campo y los demás quedan intactos | RF-7.2 |
| CA-7.3 | Un usuario con `targetHba1c: 6.5` | Envía `targetHba1c: null` | El campo queda vacío | RF-7.2 |
| CA-7.4 | Un usuario | Envía un cuerpo vacío `{}` | Recibe `VALIDATION_ERROR` | RF-7.2 |
| CA-7.5 | Un usuario | Envía un valor fuera de límites o un enum inexistente | Recibe `VALIDATION_ERROR` con el campo señalado | RF-7.3 |
| CA-7.6 | Un usuario con rango 80–180 | Envía solo `targetGlucoseMin: 200` | Recibe `VALIDATION_ERROR` en `targetGlucoseMin` (el resultado sería 200–180) | RF-7.4 |
| CA-7.7 | Sin sesión | Pide o edita el perfil | Recibe `UNAUTHENTICATED` | RF-7.5 |
| CA-7.8 | Un usuario que cambió su rango a 90–140 | Pide `/glucose/stats` | `target` llega como 90–140 | RF-7.6 |
| CA-7.9 | El dashboard | El usuario toca «Mi perfil» | Ve el formulario con sus valores actuales | RF-7.7 |
| CA-7.10 | El formulario | El usuario ingresa mínimo 200 y máximo 100 | Ve el error bajo el campo y no se guarda | RF-7.9 |
| CA-7.11 | El formulario | El usuario guarda un rango válido | Ve confirmación, vuelve al dashboard y este muestra el rango nuevo | RF-7.10 |
| CA-7.12 | Un usuario con rango 80–180 | Escribe 65 al registrar una glucosa | Ve el aviso «bajo» antes de guardar y puede guardar igual | RF-7.11 |
| CA-7.13 | Un usuario con rango 80–180 | Escribe 220 | Ve el aviso «alto» | RF-7.11 |
| CA-7.14 | Un usuario con rango 80–180 | Escribe 120 | No ve ningún aviso | RF-7.11 |
| CA-7.15 | El perfil no se pudo cargar (backend caído) | El usuario abre «Registrar glucosa» | El formulario funciona sin aviso ni error extra | RF-7.12 |

## 8. Decisiones

- **Resuelta (2026-09-23):** la alerta usa **solo el rango del usuario**, dos estados (bajo / alto) y una línea neutra «Consulta a tu médico si se repite». Sin umbrales graves fijos: es una decisión clínica que se valida con un profesional antes de mostrarla como consejo.
- **Resuelta (2026-09-23):** el primer guardado del perfil marca `onboardingCompleted`; no se construye un flujo de onboarding aparte (el perfil es esa pantalla).
- **Resuelta (2026-09-23):** se aprueban los límites del plan D-7.2: glucosa meta 40–400 mg/dL, HbA1c 4–14 %, peso 20–400 kg, altura 50–250 cm.
- **Decisión tomada:** el perfil es un recurso propio (`/api/profile`, sin id) en un módulo nuevo, en vez de ampliar `/auth/me`: `me` es el usuario de la sesión (identidad mínima, RF-2.7); el perfil es dato de salud editable y crece con el tiempo.

## 9. Definición de terminado

- CA-7.1 … CA-7.15 verificados y marcados en el PR.
- `CLAUDE.md` actualizado con el módulo `profile` y la funcionalidad `profile` del frontend.
- Issues #14, #15 y #21 cerrados desde el PR; #13, #17 y #18 cerrados con un comentario que apunta al código que ya los cubre.
- Estado `Implementada` en [specs/README.md](../README.md).
