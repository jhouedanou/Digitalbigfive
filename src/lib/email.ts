import nodemailer from "nodemailer";
import { google } from "googleapis";

// ─── Gmail API via Service Account (domain-wide delegation) ───────────────────
function getGmailClient() {
  const serviceAccountEmail = process.env.GMAIL_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const gmailUser = process.env.GMAIL_USER;

  if (!serviceAccountEmail || !privateKey || !gmailUser) {
    throw new Error(
      "Variables Gmail manquantes : GMAIL_SERVICE_ACCOUNT_EMAIL, GMAIL_PRIVATE_KEY, GMAIL_USER"
    );
  }

  const jwtClient = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
    subject: gmailUser,
  });

  return google.gmail({ version: "v1", auth: jwtClient });
}

// Construire un email RFC 2822 brut depuis les options nodemailer
function buildRawEmail(options: {
  from?: string;
  to: string;
  subject: string;
  html: string;
}): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const fromAddr = options.from || process.env.EMAIL_FROM || process.env.GMAIL_USER || "";
  const lines = [
    `From: ${fromAddr}`,
    `To: ${options.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString("base64")}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(options.html).toString("base64").replace(/(.{76})/g, "$1\n"),
    ``,
    `--${boundary}--`,
  ];
  return lines.join("\r\n");
}

// Envoyer un email via l'API Gmail (pas SMTP)
async function sendMailViaGmail(mailOptions: {
  from?: string;
  to: string;
  subject: string;
  html: string;
}) {
  const gmail = getGmailClient();
  const raw = buildRawEmail(mailOptions);

  // Encoder en base64url pour l'API Gmail
  const encodedMessage = Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  });

  return result.data;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://digitalbigfive.vercel.app";

// ─── Layout de base ──────────────────────────────────────────────────────────
function baseLayout(content: string) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#80368D,#29358B);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">Big Five</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Ressources digitales \u00b7 Abidjan</p>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:40px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">\u00a9 ${new Date().getFullYear()} Big Five Agency \u00b7 Abidjan, C\u00f4te d'Ivoire</p>
            <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">
              <a href="${APP_URL}" style="color:#80368D;text-decoration:none;">bigfiveabidjan.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, url: string) {
  return `
  <div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#80368D,#29358B);color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">
      ${label}
    </a>
  </div>`;
}

// ─── 1. Email de bienvenue ────────────────────────────────────────────────────
export async function sendWelcomeEmail({
  to,
  firstName,
}: {
  to: string;
  firstName: string;
}) {
  await sendMailViaGmail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Bienvenue sur Big Five, ${firstName} ! 🎉`,
    html: baseLayout(`
      <h2 style="color:#1f2937;margin:0 0 16px;">Bienvenue, ${firstName} ! 👋</h2>
      <p style="color:#4b5563;line-height:1.7;">
        Votre compte <strong>Big Five</strong> a bien été créé. Vous avez maintenant accès à notre catalogue de ressources digitales pour développer vos compétences et votre entreprise.
      </p>
      <div style="background:#f0e8f5;border-left:4px solid #80368D;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
        <p style="margin:0;color:#6b21a8;font-size:14px;font-weight:600;">Ce que vous pouvez faire dès maintenant :</p>
        <ul style="margin:8px 0 0;padding-left:20px;color:#4b5563;font-size:14px;line-height:2;">
          <li>Parcourir notre catalogue de ressources</li>
          <li>Télécharger les ressources gratuites</li>
          <li>Acheter des guides et formations premium</li>
          <li>Accéder à vos produits depuis votre espace</li>
        </ul>
      </div>
      ${ctaButton("Explorer les ressources", `${APP_URL}/ressources`)}
      <p style="color:#9ca3af;font-size:13px;text-align:center;">
        Une question ? Répondez directement à cet email.
      </p>
    `),
  });
}

// ─── 2. Confirmation d'achat ──────────────────────────────────────────────────
export async function sendOrderConfirmation({
  to,
  firstName,
  resourceTitle,
  amount,
  currency,
  orderId,
  dashboardUrl,
}: {
  to: string;
  firstName: string;
  resourceTitle: string;
  amount: number;
  currency: string;
  orderId: string;
  dashboardUrl: string;
}) {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  await sendMailViaGmail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `✅ Commande confirmée : ${resourceTitle}`,
    html: baseLayout(`
      <h2 style="color:#1f2937;margin:0 0 8px;">Merci pour votre achat, ${firstName} ! 🎉</h2>
      <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">
        Votre paiement a été reçu et votre accès est activé. Voici le récapitulatif de votre commande :
      </p>
      <table width="100%" cellpadding="12" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="color:#6b7280;font-size:14px;">Produit</td>
          <td style="color:#1f2937;font-weight:600;text-align:right;">${resourceTitle}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="color:#6b7280;font-size:14px;">Montant payé</td>
          <td style="color:#1f2937;font-weight:600;text-align:right;">${amount.toFixed(0)} ${currency.toUpperCase()}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="color:#6b7280;font-size:14px;">Date</td>
          <td style="color:#1f2937;text-align:right;font-size:14px;">${date}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;font-size:14px;">Référence</td>
          <td style="color:#80368D;font-family:monospace;text-align:right;font-size:13px;">${orderId.slice(0, 8).toUpperCase()}</td>
        </tr>
      </table>
      ${ctaButton("Accéder à mon produit", dashboardUrl)}
      <p style="color:#9ca3af;font-size:13px;text-align:center;">
        Votre produit est disponible dans votre espace client à tout moment.
      </p>
    `),
  });
}

// ─── 3. Accès à un produit (après achat ou ajout manuel) ─────────────────────
export async function sendProductAccessEmail({
  to,
  firstName,
  resourceTitle,
  dashboardUrl,
}: {
  to: string;
  firstName: string;
  resourceTitle: string;
  dashboardUrl: string;
}) {
  await sendMailViaGmail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `🔓 Votre accès à "${resourceTitle}" est prêt`,
    html: baseLayout(`
      <h2 style="color:#1f2937;margin:0 0 16px;">Votre ressource est disponible !</h2>
      <p style="color:#4b5563;line-height:1.7;">
        Bonjour ${firstName}, votre accès à <strong>${resourceTitle}</strong> vient d'être activé. Vous pouvez le consulter et le télécharger depuis votre espace client.
      </p>
      ${ctaButton("Accéder à ma ressource", dashboardUrl)}
      <p style="color:#9ca3af;font-size:13px;text-align:center;">
        Accessible 24h/24 depuis votre espace personnel.
      </p>
    `),
  });
}

// ─── 4. Lien de téléchargement ────────────────────────────────────────────────
export async function sendDownloadEmail({
  to,
  firstName,
  resourceTitle,
  downloadUrl,
}: {
  to: string;
  firstName: string;
  resourceTitle: string;
  downloadUrl: string;
}) {
  await sendMailViaGmail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `📥 Téléchargez votre ressource : ${resourceTitle}`,
    html: baseLayout(`
      <h2 style="color:#1f2937;margin:0 0 16px;">Votre lien de téléchargement</h2>
      <p style="color:#4b5563;line-height:1.7;">
        Bonjour ${firstName}, voici votre lien pour télécharger <strong>${resourceTitle}</strong> :
      </p>
      ${ctaButton("Télécharger maintenant", downloadUrl)}
      <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin:0 0 24px;">
        <p style="margin:0;color:#92400e;font-size:13px;">⏱ Ce lien expire dans <strong>48 heures</strong>.</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;">
        Problème avec le lien ? Contactez-nous à <a href="mailto:contacts@bigfiveabidjan.com" style="color:#80368D;">contacts@bigfiveabidjan.com</a>
      </p>
    `),
  });
}

// ─── 5. Réinitialisation de mot de passe ─────────────────────────────────────
export async function sendPasswordResetEmail({
  to,
  firstName,
  resetUrl,
}: {
  to: string;
  firstName: string;
  resetUrl: string;
}) {
  await sendMailViaGmail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `🔐 Réinitialisation de votre mot de passe`,
    html: baseLayout(`
      <h2 style="color:#1f2937;margin:0 0 16px;">Réinitialiser votre mot de passe</h2>
      <p style="color:#4b5563;line-height:1.7;">
        Bonjour ${firstName}, vous avez demandé la réinitialisation de votre mot de passe Big Five. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
      </p>
      ${ctaButton("Réinitialiser mon mot de passe", resetUrl)}
      <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;margin:0 0 24px;">
        <p style="margin:0;color:#991b1b;font-size:13px;">⏱ Ce lien expire dans <strong>1 heure</strong>.</p>
        <p style="margin:4px 0 0;color:#991b1b;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    `),
  });
}

// ─── 6. Confirmation de contact (formulaire de contact) ──────────────────────
export async function sendContactConfirmationEmail({
  to,
  firstName,
  message,
}: {
  to: string;
  firstName: string;
  message: string;
}) {
  await sendMailViaGmail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `✉️ Nous avons bien reçu votre message`,
    html: baseLayout(`
      <h2 style="color:#1f2937;margin:0 0 16px;">Message reçu, ${firstName} !</h2>
      <p style="color:#4b5563;line-height:1.7;">
        Merci de nous avoir contactés. Notre équipe reviendra vers vous dans les plus brefs délais (généralement sous 24h ouvrées).
      </p>
      <div style="background:#f9fafb;border-left:4px solid #80368D;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Votre message :</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">${message}</p>
      </div>
      <p style="color:#4b5563;font-size:14px;">
        Vous pouvez également nous joindre directement à <a href="mailto:contacts@bigfiveabidjan.com" style="color:#80368D;">contacts@bigfiveabidjan.com</a>
      </p>
    `),
  });
}

// ─── 7. Notification admin : nouvel achat ─────────────────────────────────────
export async function sendAdminNewOrderNotification({
  customerName,
  customerEmail,
  resourceTitle,
  amount,
  currency,
  orderId,
}: {
  customerName: string;
  customerEmail: string;
  resourceTitle: string;
  amount: number;
  currency: string;
  orderId: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "contacts@bigfiveabidjan.com";
  const date = new Date().toLocaleString("fr-FR");

  await sendMailViaGmail({
    from: process.env.EMAIL_FROM,
    to: adminEmail,
    subject: `💰 Nouvel achat : ${resourceTitle} — ${amount} ${currency.toUpperCase()}`,
    html: baseLayout(`
      <h2 style="color:#1f2937;margin:0 0 16px;">💰 Nouvel achat reçu !</h2>
      <table width="100%" cellpadding="12" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="color:#6b7280;font-size:14px;width:40%;">Client</td>
          <td style="color:#1f2937;font-weight:600;">${customerName}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="color:#6b7280;font-size:14px;">Email</td>
          <td style="color:#1f2937;">${customerEmail}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="color:#6b7280;font-size:14px;">Produit</td>
          <td style="color:#1f2937;font-weight:600;">${resourceTitle}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="color:#6b7280;font-size:14px;">Montant</td>
          <td style="color:#16a34a;font-weight:700;font-size:16px;">${amount.toFixed(0)} ${currency.toUpperCase()}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="color:#6b7280;font-size:14px;">Date</td>
          <td style="color:#1f2937;font-size:14px;">${date}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;font-size:14px;">Référence</td>
          <td style="color:#80368D;font-family:monospace;font-size:13px;">${orderId}</td>
        </tr>
      </table>
      ${ctaButton("Voir dans l'admin", `${APP_URL}/admin`)}
    `),
  });
}

// ─── 8. Notification admin : nouveau contact ──────────────────────────────────
export async function sendAdminNewContactNotification({
  contactName,
  contactEmail,
  message,
}: {
  contactName: string;
  contactEmail: string;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "contacts@bigfiveabidjan.com";

  await sendMailViaGmail({
    from: process.env.EMAIL_FROM,
    to: adminEmail,
    subject: `📩 Nouveau message de contact — ${contactName}`,
    html: baseLayout(`
      <h2 style="color:#1f2937;margin:0 0 16px;">📩 Nouveau message de contact</h2>
      <table width="100%" cellpadding="12" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="color:#6b7280;font-size:14px;width:30%;">Nom</td>
          <td style="color:#1f2937;font-weight:600;">${contactName}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;font-size:14px;">Email</td>
          <td><a href="mailto:${contactEmail}" style="color:#80368D;">${contactEmail}</a></td>
        </tr>
      </table>
      <div style="background:#f0e8f5;border-left:4px solid #80368D;padding:16px 20px;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Message :</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">${message}</p>
      </div>
      ${ctaButton("Répondre", `mailto:${contactEmail}`)}
    `),
  });
}
