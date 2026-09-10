# Revisión para retomar BolsaEmpleoCPV

Fecha: 2026-09-10. Revisión de código local, comandos de validación, HTTP público e historial de despliegues. No se modificó la aplicación ni se desplegó. No se hicieron escrituras en la base de datos ni envíos de correo.

## Dictamen

El MVP está ampliamente implementado y ya publicado, pero no reúne todavía evidencia suficiente para cerrar su salida a producción. Hay defectos funcionales, alertas de dependencias y verificaciones operativas pendientes. Esta revisión no es una certificación de seguridad ni una prueba integral de navegador.

## Estado comprobado

- Rama `main`, HEAD `6386fa0`. Antes de este informe: 21 archivos modificados y 14 entradas sin seguimiento (algunas son directorios), incluidas cuatro migraciones. Un checkout de HEAD no reproduce el árbol local revisado.
- `npm run build`: 3 paquetes correctos. El frontend compila con Next.js 16.2.10. Este comando no construye el artefacto OpenNext ni demuestra equivalencia con lo servido.
- `npm test`: 20 pruebas correctas en 6 archivos del backend. No hay suite E2E ni pruebas frontend en los scripts revisados.
- `npm run lint --workspace=frontend`: falla, 2 errores y 7 advertencias. Errores en `apps/frontend/src/app/admin/page.tsx:126` y `apps/frontend/src/app/verify-email/page.tsx:18`.
- `npm audit --omit=dev --json`: 14 paquetes señalados: 1 crítico, 9 altos, 4 moderados. Incluye dependencias de herramientas de construcción; hay que distinguir su alcance del runtime publicado.
- HTTP: portada y `/vacantes` responden 200; API `/health`, `/health/db` y `/api/v1/vacancies` responden 200. `/health/db` devuelve 10 áreas. Búsqueda sin autenticación devuelve 401.
- Dominios comprobados: `https://talento.camarapetrolera.app` y `https://api.talento.camarapetrolera.app`.
- Wrangler muestra como último despliegue backend `a3b6c260-5fd5-416b-bf36-111361a49f5d`, frontend `a2eefb16-2c46-413b-aebf-922f23a836b6`, ambos del 17 de agosto, al 100%. No se comparó su contenido con el árbol local.

## Funcionalidad existente

Registro profesional con cifrado, deduplicación, consentimiento y Turnstile; verificación por correo; registro/login de empresas; aprobación y desactivación; búsqueda de profesionales; solicitud y feedback de contactos; administración de perfiles, empresas y catálogos; estadísticas; disponibilidad por enlace; vacantes con moderación, edición, cierre, reapertura y enlace externo; recuperación de contraseña de empresa mediante API y página de consumo del token.

## Pendientes por prioridad

| Prioridad | Hallazgo y evidencia local | Trabajo y criterio de cierre |
| --- | --- | --- |
| P0 | Next.js 16.2.10 aparece con severidad crítica en npm audit. | Actualizar dependencias con compatibilidad OpenNext comprobada; repetir audit, build y pruebas sobre candidato. Evaluar cada aviso: no se demostró explotación en Cloudflare. |
| P0 | `professional-search.service.ts:16` filtra aprobado/activo, pero no `emailVerified`; `admin-moderation.service.ts:82` tampoco exige correo verificado al aprobar. | Exigir verificación antes de publicar y contactar. Probar que un perfil aprobado sin verificar permanece oculto. |
| P0 | `contact.service.ts:11` permite contactar a cualquier profesional aprobado aunque esté inactivo o sin correo verificado. `vacancy.service.ts`, `listPublicVacancies`, no filtra empresa activa/aprobada. | Aplicar criterios de elegibilidad en cada lectura/acción. Probar desactivación de profesional y empresa con IDs conocidos y vacantes ya aprobadas. |
| P0 | `contact.service.ts` crea solicitudes, pero no existe ruta/panel administrativo para enviarlas o bloquearlas. | Completar bandeja administrativa y notificación con trazabilidad; demostrar solicitud → resolución → entrega → feedback. Es parte del propósito central del portal. |
| P0, verificación | No hay limiter en Worker ni configuración WAF versionada. Las migraciones no contienen RLS/GRANT/REVOKE. | Revisar reglas WAF efectivas, límites de login/registro/reset/búsqueda y permisos/RLS del proyecto real. Ausencia en archivos no demuestra ausencia remota. |
| P0, verificación | Cuatro migraciones nuevas sin seguimiento y estado remoto no contrastado. | Consultar historial y esquema remotos en lectura; reconciliar divergencias; registrar migraciones en Git y probar reconstrucción en entorno aislado. Un healthcheck no demuestra paridad del esquema. |
| P1 | `email.ts:27` absorbe fallos de envío; el endpoint administrativo afirma que envió instrucciones aunque el proveedor falle. | Persistir estado/reintentos, diferenciar aceptado de entregado y probar entrega real de verificación, recuperación y aprobación con cuentas controladas. |
| P1 | `resubmitProfessional` solo cambia rejected → pending; no permite editar. El plan sí contempla autoedición. | Implementar corrección segura por token o acordar y documentar un flujo asistido completo. Incluir corrección de correo/teléfono, no solo datos profesionales. |
| P1 | API de solicitud de reset presente, pero login sin acceso a «olvidé mi contraseña». Reset no invalida JWT ya emitidos; validación y consumo del token son operaciones separadas. | Completar entrada UI, revocación de sesiones y consumo atómico del token; probar expiración, reutilización y concurrencia. |
| P1 | Lint falla y pruebas actuales no cubren vacantes, moderación, recuperación ni persistencia de los flujos principales. | Corregir lint y añadir pruebas de integración y navegador que comprueben autorizaciones y registros persistidos, además de respuestas HTTP. |
| P1 | Sin `.github/workflows` en este checkout; configuración sin staging separado. | Establecer CI con build/lint/tests/audit; candidato OpenNext y smoke antes de promover; documentar rollback de aplicación y recuperación de datos por separado. |
| P1 | Consentimiento menciona términos de privacidad, pero no se encontró página de política en las rutas. Backups, alertas y restauración no comprobados. | Publicar texto aprobado y enlazado, definir atención de solicitudes sobre datos y responsables; verificar backups y ensayar restauración, configurar alertas de API/DB/correo. |
| P2 | Listados de vacantes y administración sin paginación; recordatorios de feedback a 30 días sin cron implementado. | Añadir paginación y automatización según volumen/alcance aceptado. |

Aviso oficial contrastado para Next.js: https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4 . Describe riesgo al optimizar AVIF y versión corregida 16.3.3; npm audit propone 16.3.4. La actualización concreta debe verificarse con OpenNext. Turnstile usa validación servidor en el código, coherente con https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ ; no se probó el widget con un envío real.

## Secuencia para retomar

1. Consolidar el trabajo existente en una rama y commits revisables, preservando todos los cambios actuales. Conciliar esquema remoto y versiones desplegadas.
2. Resolver alertas aplicables, elegibilidad de perfiles/vacantes y controles antiabuso. Corregir lint.
3. Cerrar contacto, corrección de perfiles y recuperación/entrega de correos.
4. Ejecutar integración y E2E con profesional, empresa y administrador; cubrir rechazo, desactivación, tokens inválidos, errores de entrega y límites.
5. Validar permisos de base de datos, backups/restauración, políticas y monitorización. Construir candidato OpenNext y probarlo antes de promoción reversible.

No se fija fecha de lanzamiento hasta completar los P0 y aclarar el alcance de los P1. Los documentos de planificación contienen referencias antiguas a Pages y proveedores de correo: el código actual usa Workers/OpenNext y Cloudflare Email; actualizar el handoff al consolidar la versión.

## Límites de esta revisión

No se inspeccionaron registros personales ni secretos. No se verificaron directamente `_prisma_migrations`, RLS, grants, reglas WAF, configuración de backups, entrega de correo, sesiones autenticadas, rendimiento bajo carga ni paridad de bundle local/remoto. Son verificaciones pendientes, no fallos remotos confirmados. La memoria histórica se usó solo para orientar la revisión; la disponibilidad y despliegues aquí descritos se consultaron de nuevo.
