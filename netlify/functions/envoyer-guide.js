const guidesData = require("./guides-data.js");

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "guides@iaichouchene-immo.fr";

const GUIDES = {
  vendeur: {
    file: "guide-vendeur.pdf",
    nom: "Guide du vendeur",
    sujet: "Votre Guide du vendeur — EI IAICHOUCHENE IMMOBILIER",
  },
  acquereur: {
    file: "guide-acquereur.pdf",
    nom: "Guide de l'acquéreur",
    sujet: "Votre Guide de l'acquéreur — EI IAICHOUCHENE IMMOBILIER",
  },
  fdc: {
    file: "guide-cession-fdc-entreprise.pdf",
    nom: "Guide du cédant",
    sujet: "Votre Guide du cédant — EI IAICHOUCHENE IMMOBILIER",
  },
  "exemple-estimation": {
    file: "exemple-estimation.pdf",
    nom: "Exemple de dossier d'estimation",
    sujet: "Votre exemple de dossier d'estimation — EI IAICHOUCHENE IMMOBILIER",
  },
};

const PHONE_REGEX = /^0[1-9](?:[\s.\-]?\d{2}){4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeAndValidatePhone(phone) {
  if (!phone || typeof phone !== "string") return null;
  const cleaned = phone.replace(/[\s.\-]/g, "");
  if (!/^0[1-9]\d{8}$/.test(cleaned)) return null;
  return cleaned;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const params = new URLSearchParams(event.body);
    const guideChoisi = params.get("guideChoisi");
    const email = params.get("guideEmail") || params.get("email");
    const nom = params.get("nom") || "";
    const tel = params.get("tel") || "";
    const moment = params.get("moment") || "";
    const telAutorise = params.get("telAutorise") || "";

    if (!guideChoisi || !email || !tel) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Paramètres manquants",
        }),
      };
    }

    const guide = GUIDES[guideChoisi];
    if (!guide) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Guide invalide" }),
      };
    }

    if (!EMAIL_REGEX.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Adresse email invalide" }),
      };
    }

    const validatedPhone = normalizeAndValidatePhone(tel);
    if (!validatedPhone) {
      return { statusCode: 400, body: JSON.stringify({ error: "Numéro de téléphone invalide" }) };
    }
    if (telAutorise === "Oui" && !validatedPhone) {
      return { statusCode: 400, body: JSON.stringify({ error: "Un numéro est nécessaire pour être rappelé(e)" }) };
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY manquante.");
      return {
        statusCode: 503,
        body: JSON.stringify({ error: "Service d'envoi momentanément indisponible" }),
      };
    }

    const pdfData = guidesData[guide.file];
    if (!pdfData) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "PDF non trouvé" }),
      };
    }

    // Email HTML anti-spam
    const safeName = nom ? escapeHtml(nom.trim().slice(0, 80)) : "";
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="background: #C1502E; padding: 20px; color: white; text-align: center;">
    <h1 style="margin: 0; font-size: 20px; font-weight: bold;">EI IAICHOUCHENE IMMOBILIER</h1>
    <p style="margin: 4px 0 0; font-style: italic; font-size: 14px;">Mandataire immobilier — Résidentiel &amp; Commerce</p>
  </div>
  <div style="padding: 28px; background: #FAFAF8; max-width: 600px; margin: 0 auto;">
    <p>Bonjour${safeName ? " " + safeName : ""},</p>
    <p>Merci pour votre demande. Vous trouverez en pièce jointe votre <strong>${guide.nom}</strong>.</p>
    <p>Ce guide a été conçu pour vous aider à préparer votre projet immobilier en toute clarté. N'hésitez pas à me contacter pour toute question ou pour organiser une estimation gratuite et sans engagement.</p>
    <div style="background: #EDE6D6; border-left: 4px solid #C1502E; padding: 16px 20px; margin: 24px 0;">
      <p style="margin: 0; font-weight: bold;">📞 06 60 47 62 46</p>
      <p style="margin: 4px 0;">✉️ imou931@hotmail.com</p>
      <p style="margin: 4px 0;">🌐 https://iaichouchene-immo.fr</p>
    </div>
    <p style="color: #7C8B72; font-size: 12px; margin-top: 24px; border-top: 1px solid #DDD; padding-top: 16px;">
      <strong>Vos données personnelles:</strong> Votre email et votre prénom sont utilisés uniquement pour vous envoyer ce guide et les suivis que vous autorisez. Conformément à la loi Informatique et Libertés, vous pouvez nous demander l'accès, la modification ou la suppression de vos données.
    </p>
    <p style="color: #999; font-size: 11px; margin-top: 12px;">
      EI IAICHOUCHENE IMMOBILIER — RSAC Bobigny n°401500830 · RCPro n°7.953.190 / 47995 — EDIIFICE Assurances, 26 rue Pagès, 92150 Suresnes · Gagny, Chelles et alentours
    </p>
  </div>
</body>
</html>
    `;

    // Appel direct à l'API Resend : aucun module npm externe n'est nécessaire.
    // C'est volontairement robuste pour les déploiements Netlify manuels.
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `EI IAICHOUCHENE IMMOBILIER <${FROM_EMAIL}>`,
        to: [email],
        reply_to: "imou931@hotmail.com",
        subject: guide.sujet,
        html: htmlContent,
        attachments: [
          {
            filename: guide.file,
            content: pdfData,
          },
        ],
      }),
    });

    const resendResult = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      console.error("Resend a refusé l'envoi du guide.", {
        status: resendResponse.status,
        result: resendResult,
      });
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Erreur envoi email" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: resendResult.id }),
    };
  } catch (error) {
    console.error("Erreur interne lors de l'envoi du guide.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur" }),
    };
  }
};
