import type { Env } from "../config/env";

const RESEND_API_URL = "https://api.resend.com/emails";

interface SendVerificationEmailParams {
  to: string;
  firstName: string;
  token: string;
}

/**
 * Sends the registration email-verification link via Resend. Best-effort: a
 * missing RESEND_API_KEY (email provider not yet provisioned, INF-2) or a
 * delivery failure is logged, not thrown — registration must still succeed
 * even if the confirmation email can't go out yet.
 */
export async function sendVerificationEmail(env: Env, params: SendVerificationEmailParams): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.error(`RESEND_API_KEY not configured — skipped verification email to ${params.to}`);
    return;
  }

  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${params.token}`;

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: "Confirma tu correo — Bolsa de Talento CPV",
      html: `<p>Hola ${params.firstName},</p><p>Gracias por registrarte en la Bolsa de Talento de la Cámara Petrolera de Venezuela. Confirma tu correo con el siguiente enlace:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    }),
  });

  if (!response.ok) {
    console.error(`Failed to send verification email to ${params.to}: ${response.status} ${await response.text()}`);
  }
}

interface SendAvailabilityEmailParams {
  to: string;
  firstName: string;
  token: string;
}

/**
 * Sends the persistent availability/hired-status link a candidate gets once
 * approved (implementation_plan.md §4.8). Best-effort, same degrade-to-log
 * behavior as sendVerificationEmail — approval must still succeed without it.
 */
export async function sendAvailabilityEmail(env: Env, params: SendAvailabilityEmailParams): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.error(`RESEND_API_KEY not configured — skipped availability email to ${params.to}`);
    return;
  }

  const availabilityUrl = `${env.FRONTEND_URL}/disponibilidad/${params.token}`;

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: "Su perfil fue aprobado — Bolsa de Talento CPV",
      html: `<p>Hola ${params.firstName},</p><p>Su perfil en la Bolsa de Talento de la Cámara Petrolera de Venezuela fue aprobado y ya es visible para las empresas registradas.</p><p>Si consigue empleo o desea actualizar su disponibilidad, use este enlace personal en cualquier momento:</p><p><a href="${availabilityUrl}">${availabilityUrl}</a></p>`,
    }),
  });

  if (!response.ok) {
    console.error(`Failed to send availability email to ${params.to}: ${response.status} ${await response.text()}`);
  }
}
