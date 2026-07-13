# Propuesta de Desarrollo
## Plataforma de Talento Profesional — Cámara Petrolera de Venezuela (CPV)

**Preparado para:** Cámara Petrolera de Venezuela
**Preparado por:** SISTEG
**Fecha:** Julio 2026
**Versión:** 1.0

---

## 1. Resumen ejecutivo

Proponemos desarrollar una **plataforma web de talento profesional** para la Cámara Petrolera de Venezuela: un espacio donde los profesionales del sector petrolero registran su perfil una sola vez, y las empresas afiliadas a la CPV pueden **buscar y contactar** ese talento de forma segura y controlada.

El proyecto se construye con un enfoque de **desarrollo asistido por Inteligencia Artificial**, lo que reduce significativamente las horas de trabajo (y por tanto el costo) **sin sacrificar calidad, seguridad ni acabado profesional**. El resultado es una propuesta económicamente muy competitiva: la plataforma completa (MVP) se entrega en aproximadamente **131 horas de trabajo especializado (~2 semanas)**, con una **inversión total de USD $1.965 (pago único)** —casi la mitad de lo que costaría un desarrollo tradicional— y un costo de operación mensual que puede iniciar en **prácticamente $0** apoyándose en planes gratuitos de servicios en la nube.

Un punto clave: **el sitio web actual de la CPV no se toca ni se pone en riesgo.** La nueva plataforma se publica en un subdominio (por ejemplo `talento.camarapetrolera.org`) de manera totalmente independiente.

---

## 2. El objetivo

La CPV agrupa a las empresas del sector petrolero venezolano. Existe una necesidad concreta: **conectar a los profesionales del sector con las empresas miembro** que buscan talento calificado, de forma centralizada, confiable y respetando la privacidad de los datos personales.

Hoy ese proceso ocurre de manera dispersa (referencias, correos, contactos informales). La plataforma lo convierte en un **directorio profesional único, curado por la CPV**, con reglas claras de acceso y protección de datos.

---

## 3. La solución: ¿qué hace la plataforma?

La plataforma atiende a **tres tipos de usuarios**, cada uno con su propio flujo:

### 👤 El profesional del sector
Se registra a través de un **formulario guiado de 4 pasos**, simple e intuitivo:
1. **Datos personales y de contacto** (nombre, documento, correo, teléfono, ubicación).
2. **Perfil profesional** (área, especialidad, años de experiencia, último cargo, resumen).
3. **Competencias y preferencias** (formación, idiomas, certificaciones, disponibilidad, expectativa salarial).
4. **Revisión y consentimiento** — revisa un resumen de su perfil y acepta los términos de privacidad antes de enviar.

El registro es gratuito y el perfil queda **pendiente de revisión** por la CPV antes de hacerse visible.

### 🏢 La empresa afiliada
- Se registra y, una vez **aprobada por la CPV**, accede a un **buscador de profesionales** con filtros (área, especialidad, experiencia, ubicación, palabra clave).
- **Nunca ve directamente** el correo ni el teléfono del profesional. Si le interesa un perfil, pulsa **"Solicitar contacto"**, y el sistema gestiona el acercamiento de forma controlada. Esto protege a los profesionales de spam y de la extracción masiva de datos.

### 🛡️ El administrador de la CPV
Un panel privado donde la CPV:
- **Modera** los perfiles de profesionales (aprobar / rechazar).
- **Aprueba** a las empresas que solicitan acceso (verificando que sean miembros legítimos).
- **Gestiona los catálogos** del sistema (áreas, especialidades, sectores, certificaciones).
- Mantiene el control y la trazabilidad de quién accede a la información sensible.

---

## 4. Beneficios para la CPV

- **Valor agregado para los miembros:** un servicio tangible y exclusivo para las empresas afiliadas.
- **Posicionamiento:** consolida a la CPV como el punto de encuentro del talento del sector.
- **Control total:** la CPV decide qué perfiles y qué empresas entran; nada es automático ni abierto al público.
- **Protección de datos:** los datos personales de los profesionales están cifrados y nunca se exponen sin control.
- **Bajo costo de operación:** construida sobre servicios en la nube con planes gratuitos para el volumen inicial.
- **Sin riesgo para el sitio actual:** se despliega aparte, en un subdominio propio.

---

## 5. Tecnología propuesta y su justificación

Elegimos tecnologías **modernas, estándar de la industria y de bajo costo operativo**. Explicamos cada una en términos del beneficio para la CPV:

| Tecnología | Qué es | Por qué la usamos |
| :--- | :--- | :--- |
| **Next.js / React** | Marco para construir la interfaz web (lo que ve el usuario). | Es el estándar actual para sitios rápidos y modernos. Carga veloz, buena experiencia en móvil y escritorio, y excelente posicionamiento. |
| **Hono (Node.js/TypeScript)** | Motor del servidor que procesa registros, búsquedas y reglas de negocio. | Ligero, moderno y diseñado para ejecutarse en la red de Cloudflare. Misma robustez que un servidor tradicional, con mejor rendimiento y menor costo. |
| **PostgreSQL (Supabase)** | Base de datos donde se guarda toda la información. | Una de las bases de datos más confiables del mundo, gestionada por **Supabase** (el cliente ya dispone de cuenta). Incluye **búsqueda por texto avanzada** ideal para el buscador, sin costo de licencia. |
| **TypeScript** | Lenguaje de programación con verificación de errores. | Reduce fallos antes de llegar a producción → menos errores, menos soporte, código más mantenible. |
| **Cifrado AES-256** | Estándar de cifrado de grado bancario/militar. | Protege los datos sensibles (cédula, teléfono) incluso ante una eventual filtración de la base de datos. |
| **Cloudflare (Pages + Workers + Turnstile)** | Plataforma de nube donde se aloja y protege la aplicación. | Aloja la web y el servidor en la **red global de Cloudflare** (rápida y con planes gratuitos), incluye protección anti-robots y cortafuegos, y **evita comprar o mantener servidores físicos**. |
| **Supabase + Cloudflare Hyperdrive** | Base de datos gestionada, conectada de forma acelerada a la aplicación. | Aprovecha la cuenta Supabase existente y una conexión optimizada desde Cloudflare, con **copias de seguridad diarias** en su plan Pro. |

Todas son tecnologías **abiertas y con comunidad enorme**: la CPV no queda "atrapada" con un único proveedor, y cualquier equipo de desarrollo puede darle mantenimiento en el futuro.

---

## 6. Desarrollo acelerado con Inteligencia Artificial

La diferencia central de esta propuesta es el **método de trabajo**. Empleamos herramientas de IA de programación asistida (del mismo tipo que usan hoy las principales empresas de software) para acelerar las partes repetitivas y voluminosas del desarrollo: generación de formularios, validaciones, estructura de la base de datos, y pruebas automatizadas.

**¿Qué significa esto para la CPV?**

- **Menos horas → menor costo.** Un desarrollo tradicional de este alcance rondaría las **239 horas**; con desarrollo asistido por IA lo entregamos en **~131 horas** (≈ **45% menos**).
- **Sin sacrificar calidad.** La IA **no reemplaza** el criterio de ingeniería en lo crítico: seguridad, cifrado, autenticación y experiencia de usuario se revisan y validan manualmente. Por eso esas áreas se optimizan menos: la calidad se protege donde importa.
- **Mayor alcance por el mismo esfuerzo.** Incluimos funciones adicionales (verificación de correo, auto-corrección de perfil, auditoría de accesos) que en un esquema tradicional encarecerían el proyecto.

> **En resumen:** la IA nos permite ofrecer un producto **más completo, más rápido y más económico**, manteniendo estándares profesionales de seguridad y calidad.

---

## 7. Alcance del MVP (Producto Mínimo Viable)

**Incluido en esta propuesta:**
- ✅ Formulario guiado de registro de profesionales (4 pasos) con guardado de progreso.
- ✅ Registro seguro con cifrado de datos sensibles y verificación de correo.
- ✅ Enlace de auto-corrección del perfil por tiempo limitado (sin necesidad de crear usuario/clave).
- ✅ Registro e inicio de sesión de empresas.
- ✅ Buscador de profesionales con filtros y paginación (solo perfiles aprobados).
- ✅ Solicitud de contacto controlada (sin exponer datos personales).
- ✅ Panel administrativo de la CPV: moderación de perfiles y empresas, gestión de catálogos, auditoría.
- ✅ Protección anti-spam (Turnstile + límites de uso) y notificaciones por correo.
- ✅ Pruebas automatizadas de los flujos críticos.

**No incluido en el MVP (posibles fases futuras):**
- ⬜ Aplicación móvil nativa (la web ya es responsiva).
- ⬜ Mensajería interna entre empresa y profesional dentro de la plataforma.
- ⬜ Cobros / membresías en línea.
- ⬜ Reportes y estadísticas avanzadas.
- ⬜ Autenticación de dos factores para administradores (recomendada como mejora posterior).

---

## 8. Despliegue y uso del dominio

Verificamos la configuración actual del dominio **camarapetrolera.org**:
- El sitio web actual está alojado en un **hosting compartido con Apache**.
- El correo institucional funciona sobre **Google Workspace**.
- El DNS lo administra el proveedor de hosting actual.

**Sobre su pregunta del subdominio — respuesta clara:**

> ✅ **Sí se puede usar un subdominio del dominio actual** (por ejemplo `talento.camarapetrolera.org`) para publicar la plataforma, alojada en **Cloudflare + Supabase**, sin afectar el sitio ni el correo actuales.

**Cómo se hace:** se lleva la administración del DNS del dominio a **Cloudflare** (se cambian los "nameservers"). Esto habilita la web, el servidor de la aplicación y el cortafuegos (WAF), todo dentro de la red de Cloudflare, y permite publicar los subdominios `talento.` y `api.`.

- Es un cambio **no invasivo**: antes de activarlo se **copian a Cloudflare todos los registros actuales** (el sitio Apache y el correo de Google Workspace), de modo que **siguen funcionando exactamente igual, sin interrupciones**.
- Se **verifica que todo resuelve correctamente** (el sitio carga y el correo fluye) **antes** de completar el cambio, dejando el DNS anterior disponible como respaldo durante la propagación.
- Beneficio adicional: la CPV queda con un **único panel** para seguridad, certificados HTTPS y protección anti-ataques.

**Arquitectura de despliegue propuesta:**
- `camarapetrolera.org` → sitio actual y correo Google Workspace (**sin cambios**).
- `talento.camarapetrolera.org` → interfaz de la plataforma (**Cloudflare Pages**).
- `api.camarapetrolera.org` → servidor de la aplicación (**Cloudflare Workers**).
- Base de datos **PostgreSQL en Supabase** (cuenta ya existente del cliente), conectada de forma acelerada mediante **Cloudflare Hyperdrive**, con **copias de seguridad diarias** (plan Pro de Supabase).
- Correos de la plataforma enviados con un proveedor transaccional (Resend/Brevo) desde un **subdominio de correo propio**, configurado para **no interferir** con el Google Workspace actual.

---

## 9. Seguridad y protección de datos

Dado que se manejan datos personales de profesionales (cédula, teléfono), la seguridad es prioritaria:

- 🔒 **Cifrado de datos sensibles** (cédula y teléfono) con estándar AES-256.
- 🔒 **Datos de contacto ocultos** para las empresas hasta que la CPV facilite el acercamiento.
- 🔒 **Consentimiento registrado** de cada profesional (fecha, versión de términos e IP), en línea con buenas prácticas de protección de datos.
- 🔒 **Auditoría de accesos:** queda registrado cada vez que un administrador consulta datos sensibles.
- 🔒 **Protección anti-robots y límites de uso** para evitar spam y extracción masiva.
- 🔒 **HTTPS obligatorio** y copias de seguridad automáticas de la base de datos.

---

## 10. Cronograma estimado

| Semana | Actividades |
| :--- | :--- |
| **Semana 1** | Infraestructura, base de datos, registro de profesionales, autenticación de empresas, base del panel administrativo. |
| **Semana 2** | Buscador de empresas, panel de moderación CPV, correos, pruebas automatizadas, despliegue y puesta en marcha. |

**Entrega estimada del MVP: ~2 semanas** desde el inicio (equipo de 2 desarrolladores + control de calidad), incluyendo la publicación en el subdominio.

---

## 11. Inversión

### Esfuerzo de desarrollo (por módulo)

Tarifa aplicada: **USD $15 / hora**.

| Módulo | Descripción | Horas | Subtotal |
| :--- | :--- | :---: | ---: |
| Infraestructura y despliegue | Supabase + Hyperdrive, entornos, CI/CD, publicación en Cloudflare y el subdominio. | 17 | $255 |
| Base técnica compartida | Estructura del servidor (Hono/Workers) y de la interfaz, validaciones y tipos comunes. | 12 | $180 |
| Registro de profesionales | Formulario guiado, registro cifrado, verificación de correo, auto-corrección. | 36 | $540 |
| Portal de búsqueda (empresas) | Registro/login, buscador con filtros, solicitud de contacto, notificaciones. | 32 | $480 |
| Panel administrativo CPV | Moderación de perfiles y empresas, gestión de catálogos, auditoría. | 17 | $255 |
| Calidad y pruebas | Pruebas unitarias, de integración y de extremo a extremo. | 17 | $255 |
| **Total** | | **131 h** | **$1.965** |

> ### 💰 Inversión total de desarrollo: **USD $1.965** (pago único, MVP completo)

**El valor del enfoque con IA — comparativo:**

| Enfoque | Horas | Costo a $15/h |
| :--- | :---: | ---: |
| Desarrollo tradicional (manual) | 239 h | $3.585 |
| **Desarrollo asistido por IA (esta propuesta)** | **131 h** | **$1.965** |
| **Ahorro para la CPV** | **–108 h** | **–$1.620 (≈ 45%)** |

El mismo alcance, con estándares profesionales de seguridad y calidad, por **casi la mitad del costo** de un desarrollo convencional.

**Forma de pago sugerida:** 50% al inicio ($982,50) y 50% contra entrega del MVP ($982,50). *(Ajustable según acuerdo.)*

### Costo de operación mensual (infraestructura en la nube)

| Componente | Proveedor | Costo mensual (MVP) |
| :--- | :--- | :---: |
| Interfaz web + servidor | Cloudflare (Pages + Workers) | $0 – $5 |
| Base de datos | Supabase (PostgreSQL) | $0 – $25 |
| Aceleración de conexión | Cloudflare Hyperdrive | $0 |
| Envío de correos | Resend / Brevo | $0 |
| DNS / seguridad / anti-robots | Cloudflare (WAF + Turnstile) | $0 |
| Monitoreo de errores | Sentry | $0 |
| **Total mensual** | | **≈ $0 – $30** |

La plataforma puede **arrancar con planes gratuitos (~$0/mes)** y escalar a los planes de pago solo cuando el volumen de uso lo justifique. Para producción estable recomendamos el plan **Supabase Pro (~$25/mes)**, que evita pausas por inactividad e incluye copias de seguridad diarias. **No requiere comprar servidores** ni realizar inversión inicial en infraestructura.

---

## 12. Mantenimiento y fases futuras

Tras la entrega del MVP, ofrecemos (opcional):
- **Soporte y mantenimiento** mensual (corrección de incidencias, actualizaciones de seguridad).
- **Fase 2** según prioridades de la CPV: mensajería interna, estadísticas, autenticación reforzada, membresías, etc.

---

## 13. Próximos pasos

1. **Revisión y aprobación** de esta propuesta por parte de la CPV.
2. **Confirmación de decisiones clave** (ver documento técnico anexo): método de auto-corrección de perfiles, flujo de contacto, política de retención, etc.
3. **Traslado del DNS a Cloudflare** (importando los registros actuales del sitio y del correo) y acceso al registrador del dominio para el cambio de nameservers.
4. **Inicio del desarrollo** (arranque del cronograma de 2 semanas).

---

*Quedamos a disposición para presentar una demostración y resolver cualquier consulta técnica o comercial.*

**[Su empresa / consultor] — [correo] — [teléfono]**
