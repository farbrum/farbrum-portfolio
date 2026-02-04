// ═══════════════════════════════════════════════════════════
// PDF Compte-Rendu d'Installation — F_Arbrum v7.3
// Même charte graphique que le devis, sans chiffrage
// Photos horodatées + commentaires par étape + poseur identifié
// ═══════════════════════════════════════════════════════════

import { jsPDF } from 'jspdf'
import { LOGO_B64 } from './logoData.js'
import { PROCEDURE_ANC } from '../store/chantierStore'

const ROSE = [195, 56, 121]
const ROSE_LIGHT = [235, 180, 210]
const ENT = {
  nom: 'F.Arbrum', sousTitre: 'Assainissement Non Collectif',
  adresse: '5 impasse de la Colombette', cp: '31000', ville: 'Toulouse',
  siret: '90115928500021', tva: 'FR82901159285',
}

function drawBorder(doc) {
  doc.setDrawColor(...ROSE); doc.setLineWidth(0.5); doc.roundedRect(5, 5, 200, 287, 7, 7)
}
function drawPageNum(doc, p, t) {
  const cx = 192, cy = 278, r = 10
  doc.setDrawColor(...ROSE); doc.setFillColor(...ROSE); doc.circle(cx, cy, r, 'F')
  doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.setTextColor(255, 255, 255)
  doc.text(`${p}/${t}`, cx, cy + 2, { align: 'center' })
}
function drawFooter(doc) {
  doc.setDrawColor(...ROSE); doc.setLineWidth(0.5); doc.line(10, 273, 200, 273)
  try { doc.addImage(LOGO_B64, 'PNG', 10, 274.5, 18, 14) } catch (e) {}
  doc.setFontSize(5.5); doc.setFont(undefined, 'normal'); doc.setTextColor(130, 130, 130)
  doc.text(`${ENT.nom} — ${ENT.adresse}, ${ENT.cp} ${ENT.ville} | SIRET: ${ENT.siret} | TVA: ${ENT.tva}`, 105, 291, { align: 'center' })
}
function np(doc) { doc.addPage(); drawBorder(doc); return 18 }
function ck(doc, y, n = 20) { return y + n > 268 ? np(doc) : y }

function secH(doc, y, t) {
  y = ck(doc, y, 15)
  doc.setFillColor(...ROSE); doc.rect(12, y - 1, 3, 7, 'F')
  doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.setTextColor(...ROSE)
  doc.text(t, 18, y + 4)
  return y + 9
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtDateCourt(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ═══════════════════════════════════════════════════════════
// Génération du PDF Compte-Rendu
// ═══════════════════════════════════════════════════════════
export function genererCompteRenduPDF(devis, chantier, controleur = null) {
  const doc = new jsPDF()
  drawBorder(doc)
  let y = 12

  // ─── EN-TÊTE ───
  try { doc.addImage(LOGO_B64, 'PNG', 14, y, 35, 27) } catch (e) {}
  doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.setTextColor(...ROSE)
  doc.text("COMPTE-RENDU D'INSTALLATION", 55, y + 8)
  doc.setFontSize(9); doc.setTextColor(80, 80, 80); doc.setFont(undefined, 'normal')
  doc.text(`Devis N° ${devis.numeroDevis || ''}`, 55, y + 14)
  doc.text(`Date : ${fmtDateCourt(chantier?.dateCreation || devis.dateCreation)}`, 55, y + 19)
  doc.setFontSize(8); doc.setTextColor(120, 120, 120)
  doc.text(ENT.nom, 185, y + 2, { align: 'right' })
  doc.text(ENT.sousTitre, 185, y + 6, { align: 'right' })
  doc.text(ENT.adresse, 185, y + 10, { align: 'right' })
  doc.text(`${ENT.cp} ${ENT.ville}`, 185, y + 14, { align: 'right' })
  y += 32
  doc.setDrawColor(...ROSE); doc.setLineWidth(0.8); doc.line(12, y, 198, y)
  y += 6

  // ─── CLIENT ───
  doc.setFillColor(252, 245, 248); doc.roundedRect(12, y, 186, 22, 2, 2, 'F')
  doc.setDrawColor(...ROSE_LIGHT); doc.setLineWidth(0.3); doc.roundedRect(12, y, 186, 22, 2, 2)
  doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(...ROSE)
  doc.text('CLIENT', 16, y + 6)
  doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(40, 40, 40)
  doc.text(devis.client?.nomComplet || devis.client?.nom || '', 16, y + 11)
  doc.text(`${devis.client?.adresse || ''}, ${devis.client?.codePostal || ''} ${devis.client?.ville || ''}`, 16, y + 16)
  if (devis.client?.telephone) doc.text(`Tél: ${devis.client.telephone}`, 16, y + 21)
  y += 28

  // ─── CONTRÔLEUR SPANC (si renseigné) ───
  if (controleur?.nom) {
    doc.setFillColor(240, 245, 255); doc.roundedRect(12, y, 186, 18, 2, 2, 'F')
    doc.setDrawColor(180, 200, 230); doc.setLineWidth(0.3); doc.roundedRect(12, y, 186, 18, 2, 2)
    doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(50, 80, 180)
    doc.text('CONTRÔLEUR SPANC', 16, y + 6)
    doc.setFont(undefined, 'normal'); doc.setTextColor(40, 40, 40)
    doc.text(`${controleur.nom}${controleur.organisme ? ' — ' + controleur.organisme : ''}`, 16, y + 11)
    if (controleur.email) doc.text(`Email: ${controleur.email}`, 16, y + 16)
    if (controleur.telephone) doc.text(`Tél: ${controleur.telephone}`, 110, y + 16)
    y += 24
  }

  // ─── INSTALLATION ───
  y = secH(doc, y, 'INSTALLATION')
  const lines = [
    ['Modèle ANC', devis.produitNom || '—'],
    ['Type', devis.typeInstallation || '—'],
    ['Mode', devis.modeInstallation || '—'],
    ['Rejet', devis.typeRejet || '—'],
  ]
  if (devis.tuyauxAvantFiliere > 0) lines.push(['PVC avant filière', `${devis.tuyauxAvantFiliere} ml`])
  if (devis.tuyauxApresFiliere > 0) lines.push(['PVC après filière', `${devis.tuyauxApresFiliere} ml`])
  if (devis.nbCoudesPVC > 0) lines.push(['Coudes PVC', `${devis.nbCoudesPVC}`])
  if (devis.longueurAeration > 0) lines.push(['Aération', `${devis.longueurAeration} ml`])
  if (devis.longueurVentilation > 0) lines.push(['Ventilation', `${devis.longueurVentilation} ml`])
  if (devis.posteRelevage) lines.push(['Poste relevage', 'OUI'])
  if (devis.epandage) {
    lines.push(['Épandage', `${devis.epandage.surfaceM2} m² — ${devis.epandage.nbDrains} drains × ${devis.epandage.longueurParDrain} ml`])
  }

  for (const [label, val] of lines) {
    y = ck(doc, y, 6)
    doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(100, 70, 85)
    doc.text(label, 14, y)
    doc.setFont(undefined, 'normal'); doc.setTextColor(40, 40, 40)
    doc.text(String(val), 58, y)
    y += 4.5
  }
  y += 4

  // ─── PROCÉDURE — ÉTAPES AVEC PHOTOS ───
  y = secH(doc, y, 'DÉROULEMENT DES TRAVAUX')

  if (!chantier) {
    doc.setFontSize(9); doc.setTextColor(150, 150, 150)
    doc.text('Aucun suivi chantier enregistré.', 14, y)
    y += 8
  } else {
    for (const phase of PROCEDURE_ANC) {
      y = ck(doc, y, 18)

      // Titre de phase
      doc.setFillColor(252, 245, 248)
      doc.roundedRect(12, y - 1, 186, 9, 1, 1, 'F')
      doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(...ROSE)
      doc.text(`${phase.icon || ''} Phase ${phase.phase} — ${phase.titre}`, 14, y + 5)
      y += 12

      for (const etape of phase.etapes) {
        const etat = chantier.etapes?.[etape.id]
        const photos = (chantier.photos || []).filter(p => p.etapeId === etape.id)
        const fait = etat?.fait

        y = ck(doc, y, 10)

        // Checkbox + label
        const icon = fait ? '✅' : '⬜'
        doc.setFontSize(8); doc.setFont(undefined, fait ? 'bold' : 'normal')
        doc.setTextColor(fait ? 40 : 150, fait ? 40 : 150, fait ? 40 : 150)
        doc.text(`${icon} ${etape.label}`, 16, y)

        // Horodatage + poseur
        if (etat?.timestamp) {
          doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(120, 120, 120)
          doc.text(`${etat.poseur || ''} — ${fmtDate(etat.timestamp)}`, 120, y)
        }
        y += 4

        // Description
        if (etape.description) {
          doc.setFontSize(7); doc.setFont(undefined, 'italic'); doc.setTextColor(150, 150, 150)
          doc.text(etape.description, 20, y)
          y += 3.5
        }

        // Photos de l'étape (miniatures en ligne)
        if (photos.length > 0) {
          y = ck(doc, y, 30)
          let px = 20
          for (const photo of photos) {
            if (px + 30 > 190) {
              // Nouvelle ligne de photos
              y += 28
              y = ck(doc, y, 30)
              px = 20
            }
            // Essayer d'insérer l'image
            const imgSrc = photo.photoUrl || photo.dataUrl
            if (imgSrc) {
              try {
                doc.addImage(imgSrc, 'JPEG', px, y, 25, 20, undefined, 'FAST')
              } catch (e) {
                // Image non disponible — dessiner un placeholder
                doc.setFillColor(240, 240, 240)
                doc.rect(px, y, 25, 20, 'F')
                doc.setFontSize(6); doc.setTextColor(180, 180, 180)
                doc.text('📷', px + 10, y + 10)
              }
            }
            // Légende sous la photo
            doc.setFontSize(5); doc.setFont(undefined, 'normal'); doc.setTextColor(130, 130, 130)
            doc.text(`${photo.poseur || ''} ${fmtDate(photo.timestamp)}`, px, y + 22)
            if (photo.geo) {
              doc.setFontSize(4.5); doc.setTextColor(80, 160, 80)
              doc.text(`📍 ${photo.geo.lat?.toFixed(4)}, ${photo.geo.lng?.toFixed(4)}`, px, y + 24.5)
            }
            px += 30
          }
          y += 28
        }

        y += 2
      }
      y += 3
    }

    // ─── PASSAGES / POINTAGES ───
    if (chantier.passages?.length > 0) {
      y = ck(doc, y, 20)
      y = secH(doc, y, 'HISTORIQUE DES PASSAGES')
      for (let i = 0; i < chantier.passages.length; i++) {
        const p = chantier.passages[i]
        y = ck(doc, y, 6)
        doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.setTextColor(40, 40, 40)
        const depart = p.depart ? ` → Départ ${fmtDate(p.depart)}` : ' (en cours)'
        const raison = p.raison === 'termine' ? ' — FIN' : p.raison === 'spanc' ? ' — ATTENTE SPANC' : ''
        doc.text(`Passage ${i + 1} (${p.poseur || '?'}) : Arrivée ${fmtDate(p.arrivee)}${depart}${raison}`, 16, y)
        y += 5
      }
      y += 4
    }

    // ─── VISITES SPANC ───
    if (chantier.spanc?.length > 0) {
      y = ck(doc, y, 20)
      y = secH(doc, y, 'VISITES SPANC')
      for (const v of chantier.spanc) {
        y = ck(doc, y, 10)
        doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(40, 40, 40)
        const statut = v.conforme === true ? '✅ CONFORME' : v.conforme === false ? '❌ NON CONFORME' : '⏳ EN ATTENTE'
        doc.text(`${v.inspecteur || 'Inspecteur'} — ${statut}`, 16, y)
        doc.setFont(undefined, 'normal'); doc.setTextColor(120, 120, 120); doc.setFontSize(7)
        doc.text(fmtDate(v.timestamp), 16, y + 4)
        if (v.commentaire) {
          doc.setFontSize(7); doc.setTextColor(80, 80, 80)
          const lines = doc.splitTextToSize(v.commentaire, 170)
          y += 7
          for (const l of lines) { y = ck(doc, y, 4); doc.text(l, 20, y); y += 3.5 }
        }
        y += 6
      }
    }

    // ─── NOTES ───
    if (chantier.notes) {
      y = ck(doc, y, 15)
      y = secH(doc, y, 'NOTES & OBSERVATIONS')
      doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.setTextColor(50, 50, 50)
      const lines = doc.splitTextToSize(chantier.notes, 178)
      for (const l of lines) { y = ck(doc, y, 5); doc.text(l, 14, y); y += 3.5 }
      y += 4
    }

    // ─── SIGNATURES ───
    if (chantier.signatures?.length > 0) {
      y = ck(doc, y, 30)
      y = secH(doc, y, 'SIGNATURES')
      for (const sig of chantier.signatures) {
        y = ck(doc, y, 25)
        doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(40, 40, 40)
        const role = sig.fonction === 'client' ? '👤 Client' : sig.fonction === 'poseur' ? '👷 Poseur' : '👔 Responsable'
        doc.text(`${sig.signataire || '—'} (${role})`, 16, y)
        doc.setFont(undefined, 'normal'); doc.setTextColor(120, 120, 120); doc.setFontSize(7)
        doc.text(fmtDate(sig.timestamp), 16, y + 4)
        if (sig.signatureImage) {
          try { doc.addImage(sig.signatureImage, 'PNG', 16, y + 6, 50, 16) } catch (e) {}
          y += 24
        } else {
          y += 7
        }
      }
    }
  }

  // ─── PAGINATION ───
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); drawBorder(doc); drawPageNum(doc, i, pages); drawFooter(doc)
  }

  return doc
}

// ─── Export en base64 (pour pièce jointe email) ───
export function compteRenduToBase64(devis, chantier, controleur) {
  const doc = genererCompteRenduPDF(devis, chantier, controleur)
  if (!doc) return null
  return doc.output('datauristring').split(',')[1] // base64 pur
}

// ─── Télécharger le PDF ───
export function telechargerCompteRendu(devis, chantier, controleur) {
  const doc = genererCompteRenduPDF(devis, chantier, controleur)
  if (!doc) return
  doc.save(`CompteRendu_${devis.numeroDevis || 'X'}.pdf`)
}

// ─── Ouvrir dans un nouvel onglet ───
export function ouvrirCompteRendu(devis, chantier, controleur) {
  const doc = genererCompteRenduPDF(devis, chantier, controleur)
  if (!doc) return
  try {
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.target = '_blank'; a.rel = 'noopener'
    document.body.appendChild(a); a.click()
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 1000)
  } catch (e) {
    telechargerCompteRendu(devis, chantier, controleur)
  }
}
