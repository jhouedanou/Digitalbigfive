import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

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
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Votre ressource : ${resourceTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bonjour ${firstName} !</h2>
        <p>Merci pour votre intérêt. Voici votre lien de téléchargement pour <strong>${resourceTitle}</strong> :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${downloadUrl}"
             style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Télécharger la ressource
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Ce lien expire dans 48 heures.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">Big Five Agency - Ressources digitales</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmation({
  to,
  firstName,
  resourceTitle,
  amount,
  currency,
  dashboardUrl,
}: {
  to: string;
  firstName: string;
  resourceTitle: string;
  amount: number;
  currency: string;
  dashboardUrl: string;
}) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Confirmation de commande : ${resourceTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Merci pour votre achat, ${firstName} !</h2>
        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p><strong>Produit :</strong> ${resourceTitle}</p>
          <p><strong>Montant :</strong> ${amount.toFixed(2)} ${currency.toUpperCase()}</p>
        </div>
        <p>Vous pouvez accéder à votre produit depuis votre espace client :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}"
             style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Accéder à mon espace
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">Big Five Agency - Ressources digitales</p>
      </div>
    `,
  });
}
