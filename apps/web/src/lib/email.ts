import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "SaveIt <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY non défini — email de reset non envoyé");
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Réinitialisation de votre mot de passe SaveIt",
    html: `
      <p>Bonjour,</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe SaveIt.</p>
      <p>
        <a href="${resetUrl}" style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p style="color:#888;font-size:12px;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `,
  });
}
