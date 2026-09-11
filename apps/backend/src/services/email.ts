import type { Env } from "../config/env";
import { createPrismaClient } from "../config/db";
import { enqueueEmail, processEmailJob } from "./email-outbox.service";

interface SendVerificationEmailParams {
  to: string;
  firstName: string;
  token: string;
}

interface SendAvailabilityEmailParams {
  to: string;
  firstName: string;
  token: string;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

async function sendTransactionalEmail(
  env: Env,
  message: { to: string; subject: string; html: string; text: string },
): Promise<void> {
  const prisma = createPrismaClient(env);
  const job = await enqueueEmail(prisma, env, message);
  await processEmailJob(prisma, env, job.id);
}

/** Sends email verification without blocking registration if delivery fails. */
export async function sendVerificationEmail(env: Env, params: SendVerificationEmailParams): Promise<void> {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(params.token)}`;
  const firstName = escapeHtml(params.firstName);
  await sendTransactionalEmail(env, {
    to: params.to,
    subject: "Confirma tu correo — Bolsa de Talento CPV",
    html: `<p>Hola ${firstName},</p><p>Gracias por registrarte en la Bolsa de Talento de la Cámara Petrolera de Venezuela. Confirma tu correo con el siguiente enlace:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    text: `Hola ${params.firstName},\n\nGracias por registrarte en la Bolsa de Talento de la Cámara Petrolera de Venezuela. Confirma tu correo aquí:\n${verifyUrl}`,
  });
}

export async function sendResubmissionEmail(env: Env, params: { to: string; firstName: string; token: string; reason: string }): Promise<void> {
  const url = `${env.FRONTEND_URL}/reenvio/${encodeURIComponent(params.token)}`;
  const firstName = escapeHtml(params.firstName);
  const reason = escapeHtml(params.reason);
  await sendTransactionalEmail(env, {
    to: params.to,
    subject: "Acción requerida para su perfil — Bolsa de Talento CPV",
    html: `<p>Hola ${firstName},</p><p>Su perfil requiere ajustes antes de ser aprobado.</p><p><strong>Observación:</strong> ${reason}</p><p>Cuando esté listo para reenviarlo a revisión, use este enlace:</p><p><a href="${url}">${url}</a></p>`,
    text: `Hola ${params.firstName},\n\nSu perfil requiere ajustes antes de ser aprobado.\n\nObservación: ${params.reason}\n\nCuando esté listo para reenviarlo a revisión, use este enlace:\n${url}`,
  });
}

export async function sendCompanyPasswordResetEmail(env: Env, params: { to: string; companyName: string; token: string }): Promise<void> {
  const url = `${env.FRONTEND_URL}/company/reset-password/${encodeURIComponent(params.token)}`;
  const companyName = escapeHtml(params.companyName);
  await sendTransactionalEmail(env, {
    to: params.to,
    subject: "Restablezca el acceso de su empresa — Bolsa de Talento CPV",
    html: `<p>Hola ${companyName},</p><p>Recibimos una solicitud para restablecer su acceso.</p><p><a href="${url}">${url}</a></p><p>El enlace vence en una hora y solo puede usarse una vez.</p>`,
    text: `Hola ${params.companyName},\n\nRecibimos una solicitud para restablecer su acceso.\n${url}\n\nEl enlace vence en una hora y solo puede usarse una vez.`,
  });
}

/** Sends the availability link after a professional profile is approved. */
export async function sendAvailabilityEmail(env: Env, params: SendAvailabilityEmailParams): Promise<void> {
  const availabilityUrl = `${env.FRONTEND_URL}/disponibilidad/${encodeURIComponent(params.token)}`;
  const firstName = escapeHtml(params.firstName);
  await sendTransactionalEmail(env, {
    to: params.to,
    subject: "Su perfil fue aprobado — Bolsa de Talento CPV",
    html: `<p>Hola ${firstName},</p><p>Su perfil en la Bolsa de Talento de la Cámara Petrolera de Venezuela fue aprobado y ya es visible para las empresas registradas.</p><p>Si consigue empleo o desea actualizar su disponibilidad, use este enlace personal en cualquier momento:</p><p><a href="${availabilityUrl}">${availabilityUrl}</a></p>`,
    text: `Hola ${params.firstName},\n\nSu perfil en la Bolsa de Talento de la Cámara Petrolera de Venezuela fue aprobado y ya es visible para las empresas registradas.\n\nSi consigue empleo o desea actualizar su disponibilidad, use este enlace personal en cualquier momento:\n${availabilityUrl}`,
  });
}
