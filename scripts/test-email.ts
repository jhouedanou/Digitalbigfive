import * as fs from "fs";
import * as path from "path";

// Charger .env.local AVANT tout le reste (avant tout import de modules)
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^"(.*)"$/, "$1");
    process.env[key] = val;
  }
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://digitalbigfive.vercel.app";
const TEST_EMAIL = "contacts@bigfiveabidjan.com";

async function runTests() {
  const {
    sendWelcomeEmail,
    sendOrderConfirmation,
    sendProductAccessEmail,
    sendDownloadEmail,
    sendPasswordResetEmail,
    sendContactConfirmationEmail,
    sendAdminNewOrderNotification,
    sendAdminNewContactNotification,
  } = await import("../src/lib/email.js");

  const tests = [
    { name: "1. Bienvenue (inscription)", fn: () => sendWelcomeEmail({ to: TEST_EMAIL, firstName: "Kofi" }) },
    { name: "2. Confirmation d achat", fn: () => sendOrderConfirmation({ to: TEST_EMAIL, firstName: "Kofi", resourceTitle: "Guide Marketing Digital 2025", amount: 15000, currency: "xof", orderId: "cmd_abc123def456", dashboardUrl: `${APP_URL}/dashboard/produits` }) },
    { name: "3. Acces produit active", fn: () => sendProductAccessEmail({ to: TEST_EMAIL, firstName: "Kofi", resourceTitle: "Guide Marketing Digital 2025", dashboardUrl: `${APP_URL}/dashboard/produits` }) },
    { name: "4. Lien de telechargement", fn: () => sendDownloadEmail({ to: TEST_EMAIL, firstName: "Kofi", resourceTitle: "Template Business Plan", downloadUrl: `${APP_URL}/api/download/token_abc123` }) },
    { name: "5. Reinitialisation mot de passe", fn: () => sendPasswordResetEmail({ to: TEST_EMAIL, firstName: "Kofi", resetUrl: `${APP_URL}/reset-password?token=reset_abc123` }) },
    { name: "6. Confirmation contact (client)", fn: () => sendContactConfirmationEmail({ to: TEST_EMAIL, firstName: "Kofi", message: "Bonjour, je suis interesse par vos formations." }) },
    { name: "7. Notif admin - nouvel achat", fn: () => sendAdminNewOrderNotification({ customerName: "Kofi Mensah", customerEmail: "kofi@example.com", resourceTitle: "Guide Marketing Digital 2025", amount: 15000, currency: "xof", orderId: "cmd_abc123def456" }) },
    { name: "8. Notif admin - nouveau contact", fn: () => sendAdminNewContactNotification({ contactName: "Kofi Mensah", contactEmail: "kofi@example.com", message: "Bonjour, je suis interesse par vos formations." }) },
  ];

  console.log("Gmail Service Account :", process.env.GMAIL_SERVICE_ACCOUNT_EMAIL);
  console.log("Gmail User (impersonation) :", process.env.GMAIL_USER);
  console.log("Destination :", TEST_EMAIL);
  console.log("-".repeat(55));

  let passed = 0;
  for (const test of tests) {
    try {
      await test.fn();
      console.log("OK", test.name);
      passed++;
    } catch (err: any) {
      console.error("FAIL", test.name, "->", err.message);
    }
    // Pause entre chaque envoi (Gmail rate limit)
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("-".repeat(55));
  console.log(`Resultat : ${passed}/${tests.length} emails envoyes avec succes`);
}

runTests();
