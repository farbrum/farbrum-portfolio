// ═══════════════════════════════════════════════════════════
// Service d'envoi d'emails — F_Arbrum v7.3
// Utilise Resend (gratuit 100 emails/mois) via API REST
// ═══════════════════════════════════════════════════════════

const RESEND_API_KEY = '' // À configurer dans Administration > Paramètres
const FROM_EMAIL = 'chantier@farbrum.fr'
const ENT_NOM = 'F.Arbrum — Assainissement Non Collectif'

// ─── Récupérer la clé API depuis les settings Supabase ───
async function getApiKey() {
  try {
    const { db } = await import('./supabase')
    const settings = await db.getSetting('resend_api_key')
    return settings || RESEND_API_KEY
  } catch { return RESEND_API_KEY }
}

// ─── Envoi d'email via Resend API ───
export async function envoyerEmail({ to, subject, html, attachments = [] }) {
  const apiKey = await getApiKey()
  if (!apiKey) {
    console.warn('[Email] Clé API Resend non configurée — email non envoyé')
    return { success: false, error: 'Clé API manquante' }
  }

  try {
    const body = {
      from: `${ENT_NOM} <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }

    // Pièces jointes (PDF en base64)
    if (attachments.length > 0) {
      body.attachments = attachments.map(a => ({
        filename: a.filename,
        content: a.content, // base64 string
        content_type: a.contentType || 'application/pdf',
      }))
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Email] Erreur:', err)
      return { success: false, error: err }
    }

    const data = await res.json()
    console.log('[Email] Envoyé:', data.id)
    return { success: true, id: data.id }
  } catch (err) {
    console.error('[Email] Erreur envoi:', err)
    return { success: false, error: err.message }
  }
}

// ─── Email notification d'avancement étape ───
export async function notifierSpancEtape({ controleur, devis, phase, etape, poseur, photos = [] }) {
  if (!controleur?.email || !controleur?.notifParEtape) return

  const photosHtml = photos.length > 0
    ? `<p style="margin-top:12px;color:#666;">📸 ${photos.length} photo(s) ajoutée(s) à cette étape</p>`
    : ''

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#C33879;padding:16px 24px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:18px;">F.Arbrum — Suivi chantier</h1>
      </div>
      <div style="padding:24px;background:#f9f9f9;border:1px solid #eee;">
        <p style="color:#333;">Bonjour ${controleur.nom},</p>
        <p style="color:#333;">Le chantier <strong>${devis.client?.nom || ''}</strong> (${devis.numeroDevis}) a progressé :</p>
        <div style="background:white;border:1px solid #ddd;border-radius:6px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;color:#C33879;font-weight:bold;">Phase ${phase.phase} — ${phase.titre}</p>
          <p style="margin:0 0 4px;color:#333;">✅ Étape validée : <strong>${etape.label}</strong></p>
          <p style="margin:0;color:#888;font-size:13px;">Par : ${poseur} — ${new Date().toLocaleString('fr-FR')}</p>
          ${photosHtml}
        </div>
        <p style="color:#333;font-size:12px;">Adresse : ${devis.client?.adresse || ''}, ${devis.client?.codePostal || ''} ${devis.client?.ville || ''}</p>
      </div>
      <div style="padding:12px 24px;background:#333;border-radius:0 0 8px 8px;">
        <p style="color:#999;font-size:11px;margin:0;">F.Arbrum — 5 impasse de la Colombette, 31000 Toulouse</p>
      </div>
    </div>
  `

  return envoyerEmail({
    to: controleur.email,
    subject: `[Chantier ${devis.numeroDevis}] ${phase.titre} — ${etape.label}`,
    html,
  })
}

// ─── Email final avec PDF compte-rendu ───
export async function notifierSpancFinal({ controleur, devis, pdfBase64 }) {
  if (!controleur?.email) return

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#C33879;padding:16px 24px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:18px;">F.Arbrum — Chantier terminé</h1>
      </div>
      <div style="padding:24px;background:#f9f9f9;border:1px solid #eee;">
        <p style="color:#333;">Bonjour ${controleur.nom},</p>
        <p style="color:#333;">Le chantier <strong>${devis.client?.nom || ''}</strong> (N° ${devis.numeroDevis}) est terminé.</p>
        <p style="color:#333;">Vous trouverez ci-joint le <strong>Compte-Rendu d'Installation</strong> comprenant toutes les photos horodatées et commentaires de chaque étape.</p>
        <div style="background:white;border:1px solid #ddd;border-radius:6px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 4px;color:#333;"><strong>Client :</strong> ${devis.client?.nom || ''}</p>
          <p style="margin:0 0 4px;color:#333;"><strong>Adresse :</strong> ${devis.client?.adresse || ''}, ${devis.client?.codePostal || ''} ${devis.client?.ville || ''}</p>
          <p style="margin:0 0 4px;color:#333;"><strong>Installation :</strong> ${devis.produitNom || ''}</p>
        </div>
        <p style="color:#333;">Merci de procéder au contrôle de conformité à votre convenance.</p>
      </div>
      <div style="padding:12px 24px;background:#333;border-radius:0 0 8px 8px;">
        <p style="color:#999;font-size:11px;margin:0;">F.Arbrum — 5 impasse de la Colombette, 31000 Toulouse</p>
      </div>
    </div>
  `

  return envoyerEmail({
    to: controleur.email,
    subject: `[Compte-Rendu] Installation ANC — ${devis.client?.nom || ''} (${devis.numeroDevis})`,
    html,
    attachments: pdfBase64 ? [{
      filename: `CompteRendu_${devis.numeroDevis || 'X'}.pdf`,
      content: pdfBase64,
      contentType: 'application/pdf',
    }] : [],
  })
}
