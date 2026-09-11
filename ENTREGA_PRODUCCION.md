# Entrega de correcciones — 11 de septiembre de 2026

## Cambios

- Menú administrativo común en profesionales, empresas, vacantes, catálogos, estadísticas, contactos y correos. La sección seleccionada queda en la URL y admite atrás/adelante y recarga.
- La cabecera reconoce la sesión y permite regresar al panel desde el portal público. Menú equivalente para empresas; recuperación de acceso enlazada al login; tratamiento de sesión expirada; enlaces del pie de página con destinos funcionales.
- Bandeja administrativa para autorizar o bloquear solicitudes de contacto. La notificación facilita el correo de la empresa al profesional; no entrega los datos privados del candidato a la empresa.
- Correos persistidos en una cola cifrada con cinco intentos automáticos y reintento administrativo. Se distingue aceptación del proveedor de entrega al destinatario. El contenido se elimina al aceptar el proveedor. La cola usa arrendamientos para evitar procesamiento simultáneo; como otros sistemas de entrega al menos una vez, una caída después de enviar y antes de persistir puede ocasionar duplicación.
- Corrección de perfiles rechazados por token de un solo uso, incluidos correo y teléfono. Un cambio de correo requiere una nueva verificación.
- Revocación de sesiones de empresa al restablecer contraseña o desactivar la cuenta; consumo atómico del enlace de recuperación.
- Perfiles sin verificar o inactivos no pueden aparecer en búsquedas/contactos. Las vacantes de empresas inactivas o no aprobadas no aparecen en el portal.
- Turnstile real para registros de profesionales y empresas, con verificación de dominio y acción. Límites persistentes: 3 registros/IP/hora, 20 intentos de autenticación/recuperación/IP/hora, 60 solicitudes de enlaces/IP/hora, 100 búsquedas/empresa/hora y 30 contactos/empresa/hora. Las direcciones IP del limitador se guardan como HMAC.
- RLS y revocación de permisos cliente en las tablas del proyecto; el backend conserva su acceso. Respuestas de error inesperado sin detalles internos de base de datos.
- Next.js 16.3.4, OpenNext 1.20.6, Wrangler 4.131.0, Hono 4.13.7 y Vitest 5.0.0. Lockfile conciliado y auditoría sin vulnerabilidades.
- CI de build, lint, tests y audit. Página de ayuda que explica el flujo y el tratamiento actual de datos; no sustituye una política jurídica aprobada.

## Evidencia previa a publicación

- 24 pruebas unitarias y 6 pruebas de integración correctas.
- Integración ejecutada sobre esquemas temporales exclusivos `cpv_qa_<timestamp>`, eliminados al finalizar. Prueba persistencia, contacto, fallo/reintento de correo, visibilidad, desactivación, recuperación, corrección y límites. No envía correos reales ni modifica perfiles reales.
- Lint sin errores ni advertencias. Compilación TypeScript y artefacto OpenNext correctos.
- `npm audit`: cero vulnerabilidades.
- 10 migraciones aplicadas en Supabase. Cero tablas públicas sin RLS y cero grants a `anon`/`authenticated`. Ambos roles reciben `42501` al intentar consultar profesionales.
- Siete backups físicos completados consultados en Supabase, del 4 al 10 de septiembre de 2026. PITR deshabilitado. No se restauró producción ni se realizó un ensayo de restauración de un backup físico.

## Operación y reversión

Publicadas el 11 de septiembre de 2026, ambas al 100 %:

- Backend `3aa7a13d-e5f8-4dd5-961e-4058bc276aef`.
- Frontend `f370f845-b207-4ae8-864d-0241bc97fd75`.
- Código de aplicación: commit `4d2171b`, rama `release/production-readiness-20260910`.
- Candidatos comprobados antes de promoción. Tras publicar: `/health`, `/health/db`, `/api/v1/vacancies`, portada, contactos/correos administrativos y recuperación de contraseña responden HTTP 200 en sus dominios públicos. Un 200 de una página privada no acredita acceso autenticado.
- Cron `*/5 * * * *` publicado correctamente. No se enviaron correos a usuarios reales para estas comprobaciones.
- `BUILD_ID` público coincide exactamente con el artefacto local. Contactos, correos y búsqueda de profesionales devuelven 401 sin sesión.
- En Edge se comprobó la nueva página de login, sus enlaces y la carga del widget Turnstile real en registro de empresa (sin resolver el desafío ni crear cuentas). La sesión administrativa previa había caducado: el recorrido visual autenticado queda pendiente de que el usuario inicie sesión personalmente.

## Corrección posterior: datos de demostración

- La migración `20260911073637_restore_test_professional_visibility` restauró la verificación exclusivamente para los diez perfiles de demostración cargados juntos el 21 de julio de 2026. La migración aborta si no identifica exactamente esos diez perfiles.
- Verificación posterior: 10 profesionales visibles para empresas y 1 vacante pública aprobada. Los perfiles nuevos siguen requiriendo correo verificado.

Versiones previas a esta entrega:

- Backend `a3b6c260-5fd5-416b-bf36-111361a49f5d`.
- Frontend `a2eefb16-2c46-413b-aebf-922f23a836b6`.

La promoción se realiza con `node scripts/wrangler-agent-profile.mjs <frontend|backend> versions deploy <version>@100 --yes`. Las migraciones nuevas son aditivas; la reversión de código no debe quitar RLS ni borrar las tablas nuevas. Antes de volver al backend anterior, desactivar el cron nuevo, pues esa versión no tiene handler programado. Si se revierte el par de aplicaciones, se restaura también la configuración Turnstile de aquellas versiones, que usaba claves de prueba: esa reversión solo sirve como contingencia temporal y reduce la protección antiabuso.

Tras la promoción del backend se publican sus triggers con `node scripts/wrangler-agent-profile.mjs backend triggers deploy`. El cron de correo corre cada cinco minutos.

## Pendientes operativos que requieren seguimiento

- Confirmar el correo institucional para solicitudes sobre datos y el texto aprobado de privacidad. No se inventaron políticas de retención, obligaciones legales ni un destinatario institucional.
- Ensayar restauración de backup físico en un destino aislado; los backups existen, pero su restauración no está certificada por esta entrega.
- Probar recepción real de mensajes en un buzón controlado. Las pruebas de integración simulan el proveedor para evitar notificaciones a terceros.
- WAF externo y alertas externas de disponibilidad pendientes de revisión/configuración. La aplicación ya aplica límites propios y tiene observabilidad de Workers habilitada.
- El asesor de Supabase conserva una advertencia por la extensión `pg_trgm` instalada en `public`; su traslado requiere revisar las dependencias e índices antes de modificarla.
- La paginación completa de todos los listados y el recordatorio automático de resultados de contratación a 30 días continúan como mejoras posteriores (P2).
- Diez perfiles previamente aprobados carecen de verificación de correo: quedarán ocultos a empresas hasta verificar. El administrador dispone de «Reenviar verificación». No se verificaron automáticamente ni se les envió correo durante esta entrega.
