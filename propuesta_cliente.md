# Propuesta de Desarrollo
## Plataforma de Talento Profesional — Cámara Petrolera de Venezuela (CPV)

**Preparado para:** Cámara Petrolera de Venezuela
**Preparado por:** SISTEG
**Fecha:** Julio 2026
**Versión:** 1.0

---

## 1. Resumen ejecutivo

Proponemos desarrollar una **plataforma web de talento profesional** para la Cámara Petrolera de Venezuela: un espacio donde los profesionales del sector petrolero registran su perfil una sola vez, y las empresas afiliadas a la CPV pueden **buscar y contactar** ese talento de forma segura y controlada.

El proyecto se construye con un enfoque de **desarrollo asistido por Inteligencia Artificial**, lo que reduce significativamente las horas de trabajo (y por tanto el costo) **sin sacrificar calidad, seguridad ni acabado profesional**. El resultado es una propuesta económicamente muy competitiva: la plataforma completa (MVP) se entrega en aproximadamente **155 horas de trabajo especializado (~2.5 semanas)**, con una **inversión total de USD $2.325 (pago único)** —casi la mitad de lo que costaría un desarrollo tradicional— y un costo de operación mensual que puede iniciar en **prácticamente $0** apoyándose en planes gratuitos de servicios en la nube.

Un punto clave: **el sitio web actual de la CPV no se toca ni se pone en riesgo.** La nueva plataforma se publica en el dominio `talento.camarapetrolera.app` (ya registrado y cargado en Cloudflare) de manera totalmente independiente.

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

El registro es gratuito y el perfil queda **pendiente de revisión** por la CPV. Tras su aprobación, el profesional recibe un correo con un **enlace/token persistente y seguro** que le permite:
- Gestionar y corregir los datos de su perfil.
- Actualizar su disponibilidad en cualquier momento.
- Marcar de forma sencilla si ha sido **contratado** (especificando si fue gracias al portal o por vía externa) para alimentar las métricas de efectividad de la CPV.

### 🏢 La empresa afiliada
- Se registra y, una vez **aprobada por la CPV**, accede a un **buscador de profesionales** con filtros (área, especialidad, experiencia, ubicación, palabra clave).
- En los resultados de búsqueda se muestra la **antigüedad del registro profesional** (para identificar candidatos recientemente actualizados o registrados).
- **Nunca ve directamente** el correo ni el teléfono del profesional. Si le interesa un perfil, pulsa **"Solicitar contacto"**, y el sistema gestiona el acercamiento. 30 días después, el sistema solicitará a la empresa un feedback rápido (prompt simple al iniciar sesión o por email) indicando si concretaron la contratación.

### 🛡️ El administrador de la CPV
Un panel privado donde la CPV:
- **Modera** los perfiles de profesionales (aprobar / rechazar).
- **Aprueba** a las empresas que solicitan acceso (verificando que sean miembros legítimos).
- **Gestiona los catálogos** del sistema (áreas, especialidades, sectores, certificaciones).
- **Visualiza Estadísticas e Indicadores Gerenciales:**
  - Tipos de profesionales más solicitados (basado en solicitudes de contacto).
  - Empresas que realizan más contactos.
  - Indicadores de efectividad del portal (cantidad de profesionales contratados gracias al portal vs. de forma externa, tasa de conversión de contactos).
  - Distribución de registros por antigüedad, área y ubicación geográfica.
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

- **Menos horas → menor costo.** Un desarrollo tradicional de este alcance rondaría las **281 horas**; con desarrollo asistido por IA lo entregamos en **~155 horas** (≈ **45% menos**).
- **Sin sacrificar calidad.** La IA **no reemplaza** el criterio de ingeniería en lo crítico: seguridad, cifrado, autenticación y experiencia de usuario se revisan y validan manualmente. Por eso esas áreas se optimizan menos: la calidad se protege donde importa.
- **Mayor alcance por el mismo esfuerzo.** Incluimos funciones adicionales (estadísticas gerenciales, bucle de feedback automatizado para contratación, antigüedad del perfil, verificación de correo, auto-corrección, auditoría de accesos) que en un esquema tradicional encarecerían el proyecto.

> **En resumen:** la IA nos permite ofrecer un producto **más completo, más rápido y más económico**, manteniendo estándares profesionales de seguridad y calidad.

---

## 7. Alcance del MVP (Producto Mínimo Viable)

**Incluido en esta propuesta:**
- ✅ Formulario guiado de registro de profesionales (4 pasos) con guardado de progreso.
- ✅ Registro seguro con cifrado de datos sensibles y verificación de correo.
- ✅ Enlace de auto-corrección y actualización de disponibilidad por token persistente (sin necesidad de crear usuario/clave).
- ✅ Registro e inicio de sesión de empresas.
- ✅ Buscador de profesionales con filtros, paginación e indicador de **antigüedad del registro** (solo perfiles aprobados).
- ✅ Solicitud de contacto controlada (sin exponer datos personales).
- ✅ Bucle de retroalimentación de contratación (encuesta simple a empresas a los 30 días del contacto y actualización de disponibilidad de profesionales).
- ✅ Panel administrativo de la CPV: moderación de perfiles y empresas, gestión de catálogos, auditoría de PII.
- ✅ **Estadísticas y Dashboard Gerencial** para la administración de la CPV (profesionales más solicitados, empresas activas, indicadores de contratación y efectividad del portal).
- ✅ Protección anti-spam (Turnstile + límites de uso) y notificaciones por correo.
- ✅ Pruebas automatizadas de los flujos críticos.

**No incluido en el MVP (posibles fases futuras):**
- ⬜ Aplicación móvil nativa (la web ya es responsiva).
- ⬜ Mensajería interna entre empresa y profesional dentro de la plataforma.
- ⬜ Cobros / membresías en línea.
- ⬜ Autenticación de dos factores para administradores (recomendada como mejora posterior).

---

## 8. Despliegue y uso del dominio

La plataforma utilizará el dominio **talento.camarapetrolera.app**, el cual ya está registrado y cargado en Cloudflare.

**Beneficios de esta decisión:**

* **Aislamiento total y seguridad:** Al utilizar un dominio independiente (`.app` en lugar de `.org`), el sitio web actual (`camarapetrolera.org`) y el correo institucional en Google Workspace permanecen **100% aislados y protegidos**. No existe ningún riesgo de caída o mala configuración.
* **Sin cambios de DNS en el dominio principal:** No es necesario migrar los DNS ni cambiar los servidores de nombres (nameservers) de `camarapetrolera.org`.
* **Configuración inmediata:** Dado que el dominio `talento.camarapetrolera.app` ya se encuentra activo en Cloudflare, la integración con Cloudflare Pages y Workers es inmediata y directa.

**Arquitectura de despliegue propuesta:**
* `camarapetrolera.org` → sitio actual y correo Google Workspace (**sin ningún cambio ni intervención de DNS**).
* `talento.camarapetrolera.app` → interfaz de la plataforma (**Cloudflare Pages**).
* `api.talento.camarapetrolera.app` → servidor de la aplicación/API (**Cloudflare Workers**).
* Base de datos **PostgreSQL en Supabase** (cuenta ya existente del cliente), conectada de forma acelerada mediante **Cloudflare Hyperdrive**, con **copias de seguridad diarias** (plan Pro de Supabase).
* Correos de la plataforma enviados con un proveedor transaccional (Resend/Brevo) desde el dominio `talento.camarapetrolera.app` (ej. `mail.talento.camarapetrolera.app`), configurado en Cloudflare para **no interferir** con el correo corporativo actual.

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
| **Semana 1** | Infraestructura, base de datos, flujos de registro de profesionales, tokens de disponibilidad, autenticación de empresas y base del panel administrativo. |
| **Semanas 2 - 3** | Buscador de empresas con antigüedad, bucle de feedback automatizado, panel de moderación, desarrollo de estadísticas y dashboard gerencial, pruebas automatizadas, despliegue y puesta en marcha. |

**Entrega estimada del MVP: ~2.5 semanas** desde el inicio (equipo de 2 desarrolladores + control de calidad), incluyendo la publicación en el dominio principal `.app`.

---

## 11. Inversión

### Esfuerzo de desarrollo (por módulo)

Tarifa aplicada: **USD $15 / hora**.

| Módulo | Descripción | Horas | Subtotal |
| :--- | :--- | :---: | ---: |
| Infraestructura y despliegue | Supabase + Hyperdrive, entornos, CI/CD, publicación en Cloudflare con dominio custom. | 17 | $255 |
| Base técnica compartida | Estructura del servidor (Hono/Workers) y de la interfaz, validaciones y tipos comunes. | 12 | $180 |
| Registro e interacción de profesionales | Formulario guiado, cifrado de datos, verificación de correo, auto-corrección y bucle de feedback de disponibilidad por token. | 42 | $630 |
| Portal de búsqueda (empresas) | Registro/login, buscador con filtros y visualización de antigüedad, solicitud de contacto y feedback de contratación. | 37 | $555 |
| Panel administrativo CPV y Estadísticas | Moderación de perfiles/empresas, catálogos, auditoría de accesos y dashboard de estadísticas gerenciales. | 30 | $450 |
| Calidad y pruebas | Pruebas unitarias, de integración, bucle de feedback y extremo a extremo. | 17 | $255 |
| **Total** | | **155 h** | **$2.325** |

> ### 💰 Inversión total de desarrollo: **USD $2.325** (pago único, MVP completo)

**El valor del enfoque con IA — comparativo:**

| Enfoque | Horas | Costo a $15/h |
| :--- | :---: | ---: |
| Desarrollo tradicional (manual) | 281 h | $4.215 |
| **Desarrollo asistido por IA (esta propuesta)** | **155 h** | **$2.325** |
| **Ahorro para la CPV** | **–126 h** | **–$1.890 (≈ 45%)** |

El mismo alcance, con estándares profesionales de seguridad y calidad, por **casi la mitad del costo** de un desarrollo convencional.

**Forma de pago sugerida:** 50% al inicio ($1.162,50) y 50% contra entrega del MVP ($1.162,50). *(Ajustable según acuerdo.)*

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
3. **Configuración del dominio custom** `talento.camarapetrolera.app` en la cuenta de Cloudflare existente.
4. **Inicio del desarrollo** (arranque del cronograma de 2.5 semanas).

---

*Quedamos a disposición para presentar una demostración y resolver cualquier consulta técnica o comercial.*

**[Su empresa / consultor] — [correo] — [teléfono]**
