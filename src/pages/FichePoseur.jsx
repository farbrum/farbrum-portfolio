import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useChantierStore, PROCEDURE_ANC } from '../store/chantierStore'
import { useDevisStore } from '../store/devisStore'
import { Camera, Check, ChevronDown, ChevronUp, Clock, LogOut, Shield, X, Trash2, MessageSquare, Image, AlertTriangle, CheckCircle } from 'lucide-react'

// ─── Compression photo ───
function compressImage(dataUrl, maxWidth = 1200, quality = 0.6) {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

// ─── Format date ───
function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function fmtHeure(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function FichePoseur() {
  const { devisId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const poseurNom = searchParams.get('poseur') || searchParams.get('uid') || 'Poseur'
  const role = searchParams.get('role') || 'poseur'

  const devis = useDevisStore(s => s.getDevisById(devisId))
  const {
    getChantier, initChantier, pointerArrivee, pointerDepart,
    validerEtape, devaliderEtape, ajouterPhoto, supprimerPhoto,
    ajouterSPANC, setNotes, getProgression, getPhotosEtape
  } = useChantierStore()

  const chantier = useChantierStore(s => s.chantiers[devisId])

  // Calculer la progression de façon réactive
  const progression = useMemo(() => {
    if (!chantier) return { total: 0, fait: 0, pct: 0 }
    const totalEtapes = PROCEDURE_ANC.reduce((acc, phase) => acc + phase.etapes.length, 0)
    const etapesFaites = Object.values(chantier.etapes || {}).filter(e => e.fait).length
    const photosDone = PROCEDURE_ANC.flatMap(p => p.etapes).filter(e => e.type === 'photo' && (chantier.photos || []).some(p => p.etapeId === e.id)).length
    const fait = Math.max(etapesFaites, etapesFaites) // photos counted via etapes.fait
    return { total: totalEtapes, fait: etapesFaites, pct: Math.round((etapesFaites / totalEtapes) * 100) }
  }, [chantier])

  // ─── Init chantier au premier accès ───
  useEffect(() => {
    if (devisId && !chantier) {
      initChantier(devisId, poseurNom)
    }
  }, [devisId])

  // ─── State UI ───
  const [phaseOuverte, setPhaseOuverte] = useState(null)
  const [showSPANC, setShowSPANC] = useState(false)
  const [showDepart, setShowDepart] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showPhotoView, setShowPhotoView] = useState(null)
  const [spancForm, setSpancForm] = useState({ inspecteur: '', conforme: null, commentaire: '' })
  const photoRef = useRef()
  const spancPhotoRef = useRef()
  const [captureEtapeId, setCaptureEtapeId] = useState(null)

  // ─── Auto-ouvrir la première phase non terminée ───
  useEffect(() => {
    if (chantier && phaseOuverte === null) {
      const idx = PROCEDURE_ANC.findIndex(phase =>
        phase.etapes.some(e => !chantier.etapes[e.id]?.fait)
      )
      setPhaseOuverte(idx >= 0 ? idx : 0)
    }
  }, [chantier])

  // ─── Vérifier si on est "pointé" (passage en cours) ───
  const passageEnCours = chantier?.passages?.length > 0 &&
    !chantier.passages[chantier.passages.length - 1].depart

  // ─── Pointer à l'arrivée automatiquement ───
  useEffect(() => {
    if (chantier && !passageEnCours && chantier.statut !== 'termine') {
      pointerArrivee(devisId, poseurNom)
    }
  }, [devisId, chantier?.statut])

  // ─── Photo capture handler ───
  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !captureEtapeId) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target.result)
      ajouterPhoto(devisId, captureEtapeId, compressed, poseurNom)
      setCaptureEtapeId(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const triggerPhoto = (etapeId) => {
    setCaptureEtapeId(etapeId)
    setTimeout(() => photoRef.current?.click(), 50)
  }

  // ─── SPANC photo handler ───
  const handleSpancPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target.result)
      setSpancForm(f => ({ ...f, photoUrl: compressed }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const submitSPANC = () => {
    ajouterSPANC(devisId, spancForm)
    setSpancForm({ inspecteur: '', conforme: null, commentaire: '' })
    setShowSPANC(false)
  }

  // ─── Départ chantier ───
  const handleDepart = (raison) => {
    pointerDepart(devisId, raison)
    setShowDepart(false)
  }

  // ─── Phase terminée ? ───
  const isPhaseComplete = (phase) => {
    if (!chantier) return false
    return phase.etapes.every(e => {
      if (e.type === 'photo' && e.obligatoire) {
        const photos = chantier.photos?.filter(p => p.etapeId === e.id) || []
        return photos.length > 0
      }
      return chantier.etapes[e.id]?.fait
    })
  }

  // ─── Si pas de devis trouvé ───
  if (!devis) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Chantier non trouvé</h1>
          <p className="text-gray-400 text-sm">Ce QR code ne correspond à aucun devis.</p>
          <p className="text-gray-500 text-xs mt-2">ID: {devisId}</p>
        </div>
      </div>
    )
  }

  if (!chantier) return null

  const totalPhotos = chantier.photos?.length || 0

  return (
    <div className="min-h-screen bg-gray-950 pb-32">
      {/* ─── HEADER ─── */}
      <div className="sticky top-0 z-40 bg-gray-900 border-b border-white/10 safe-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-sm font-bold text-white">{devis.client?.nom || 'Client'}</h1>
              <p className="text-[10px] text-gray-500">{devis.client?.adresse || ''} • {devis.numeroDevis}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                👷 {poseurNom}
              </span>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progression.pct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">{progression.fait}/{progression.total} ({progression.pct}%)</span>
          </div>

          {/* Stats rapides */}
          <div className="flex items-center space-x-3 mt-2 text-[10px] text-gray-500">
            <span>📸 {totalPhotos} photos</span>
            <span>🔵 {chantier.spanc?.length || 0} visite{(chantier.spanc?.length || 0) > 1 ? 's' : ''} SPANC</span>
            <span>📋 Passage n°{chantier.passages?.length || 1}</span>
            {chantier.statut === 'termine' && <span className="text-emerald-400 font-bold">✅ TERMINÉ</span>}
            {chantier.statut === 'pause_spanc' && <span className="text-amber-400 font-bold">⏸️ ATTENTE SPANC</span>}
          </div>
        </div>
      </div>

      {/* ─── INPUT PHOTO CACHÉ ─── */}
      <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
      <input ref={spancPhotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleSpancPhoto} />

      {/* ─── PHASES ─── */}
      <div className="px-3 py-4 space-y-2">
        {PROCEDURE_ANC.map((phase, idx) => {
          const isOpen = phaseOuverte === idx
          const complete = isPhaseComplete(phase)
          const etapesFaites = phase.etapes.filter(e => chantier.etapes[e.id]?.fait || (e.type === 'photo' && chantier.photos?.some(p => p.etapeId === e.id))).length

          return (
            <div key={phase.id} className={`rounded-xl border transition-all ${complete ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
              {/* Header phase */}
              <button
                onClick={() => setPhaseOuverte(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{phase.icon}</span>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${complete ? 'text-emerald-400' : 'text-white'}`}>
                      {phase.phase}. {phase.titre}
                    </p>
                    <p className="text-[10px] text-gray-500">{etapesFaites}/{phase.etapes.length} étapes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {complete && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </div>
              </button>

              {/* Étapes */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-2">
                  {phase.etapes.map(etape => {
                    const etat = chantier.etapes[etape.id]
                    const fait = etat?.fait
                    const photos = chantier.photos?.filter(p => p.etapeId === etape.id) || []
                    const hasPhoto = photos.length > 0
                    const isPhotoStep = etape.type === 'photo'
                    const isAutoStep = etape.type === 'auto'
                    const isSignature = etape.type === 'signature'

                    return (
                      <div key={etape.id} className={`rounded-lg border p-3 ${fait || (isPhotoStep && hasPhoto) ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                        <div className="flex items-start space-x-3">
                          {/* Checkbox ou icône */}
                          {isPhotoStep ? (
                            <button
                              onClick={() => triggerPhoto(etape.id)}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${hasPhoto ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 text-rose-400 border border-dashed border-rose-500/30'}`}
                            >
                              {hasPhoto ? <CheckCircle size={20} /> : <Camera size={20} />}
                            </button>
                          ) : isSignature ? (
                            <button
                              onClick={() => {
                                if (!fait) {
                                  validerEtape(devisId, etape.id, poseurNom)
                                  handleDepart('termine')
                                }
                              }}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${fait ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}
                            >
                              {fait ? <CheckCircle size={20} /> : <Check size={20} />}
                            </button>
                          ) : (
                            <button
                              onClick={() => fait ? devaliderEtape(devisId, etape.id) : validerEtape(devisId, etape.id, poseurNom)}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all ${fait ? 'bg-emerald-500 text-white' : 'bg-white/5 border border-white/10 text-gray-500'}`}
                            >
                              {fait ? <Check size={20} /> : <span className="text-xs">○</span>}
                            </button>
                          )}

                          {/* Texte */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${fait || (isPhotoStep && hasPhoto) ? 'text-emerald-400' : 'text-white'}`}>
                              {etape.label}
                              {etape.obligatoire && !hasPhoto && <span className="text-rose-400 ml-1">*</span>}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{etape.description}</p>
                            {/* Timestamp */}
                            {etat?.timestamp && (
                              <p className="text-[9px] text-gray-600 mt-1">✓ {etat.poseur} — {fmtDate(etat.timestamp)}</p>
                            )}
                          </div>

                          {/* Bouton photo additionnel pour étapes non-photo */}
                          {!isPhotoStep && !isAutoStep && !isSignature && (
                            <button
                              onClick={() => triggerPhoto(etape.id)}
                              className="w-8 h-8 rounded flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10"
                            >
                              <Camera size={14} />
                            </button>
                          )}
                        </div>

                        {/* Photos de cette étape */}
                        {photos.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 ml-13">
                            {photos.map(photo => (
                              <div key={photo.id} className="relative group">
                                <img
                                  src={photo.dataUrl}
                                  alt=""
                                  className="w-16 h-16 rounded-lg object-cover border border-white/10 cursor-pointer"
                                  onClick={() => setShowPhotoView(photo)}
                                />
                                <button
                                  onClick={(e) => { e.stopPropagation(); supprimerPhoto(devisId, photo.id) }}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={10} />
                                </button>
                                <p className="text-[7px] text-gray-600 text-center mt-0.5">{fmtHeure(photo.timestamp)}</p>
                              </div>
                            ))}
                            {isPhotoStep && (
                              <button
                                onClick={() => triggerPhoto(etape.id)}
                                className="w-16 h-16 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-gray-600 hover:text-white hover:border-white/20"
                              >
                                <Camera size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* ─── HISTORIQUE PASSAGES ─── */}
        {chantier.passages?.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mt-4">
            <p className="text-xs font-bold text-gray-400 mb-2">📋 Historique des passages</p>
            {chantier.passages.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <div>
                  <span className="text-[10px] text-white">Passage {i + 1}</span>
                  <span className="text-[10px] text-gray-500 ml-2">({p.poseur})</span>
                </div>
                <div className="text-[10px] text-gray-400">
                  🟢 {fmtHeure(p.arrivee)}
                  {p.depart && <span> → 🔴 {fmtHeure(p.depart)}{p.raison === 'spanc' ? ' (SPANC)' : p.raison === 'termine' ? ' (FIN)' : ''}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── VISITES SPANC ─── */}
        {chantier.spanc?.length > 0 && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 mt-2">
            <p className="text-xs font-bold text-blue-400 mb-2">🔵 Visites SPANC</p>
            {chantier.spanc.map((v, i) => (
              <div key={i} className="py-2 border-b border-blue-500/10 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white">{v.inspecteur || 'Inspecteur'}</span>
                  <span className={`text-[10px] font-bold ${v.conforme === true ? 'text-emerald-400' : v.conforme === false ? 'text-red-400' : 'text-amber-400'}`}>
                    {v.conforme === true ? '✅ Conforme' : v.conforme === false ? '❌ Non conforme' : '⏳ En attente'}
                  </span>
                </div>
                <p className="text-[9px] text-gray-500">{fmtDate(v.timestamp)}</p>
                {v.commentaire && <p className="text-[10px] text-gray-400 mt-1">{v.commentaire}</p>}
                {v.photoUrl && <img src={v.photoUrl} alt="PV SPANC" className="w-24 h-24 rounded mt-2 object-cover border border-white/10" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── BARRE D'ACTIONS FIXE EN BAS ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-white/10 safe-bottom">
        <div className="flex items-center justify-between px-3 py-3 gap-2">
          {/* Bouton SPANC */}
          <button
            onClick={() => setShowSPANC(true)}
            className="flex-1 flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold active:bg-blue-500/20"
          >
            <Shield size={16} />
            <span>SPANC</span>
          </button>

          {/* Bouton Notes */}
          <button
            onClick={() => setShowNotes(true)}
            className="flex-1 flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-bold active:bg-white/10"
          >
            <MessageSquare size={16} />
            <span>Notes</span>
          </button>

          {/* Bouton Quitter */}
          <button
            onClick={() => setShowDepart(true)}
            className="flex-1 flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold active:bg-rose-500/20"
          >
            <LogOut size={16} />
            <span>Quitter</span>
          </button>
        </div>
      </div>

      {/* ─── MODAL SPANC ─── */}
      {showSPANC && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-gray-900 rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-blue-400">🔵 Visite SPANC</h2>
              <button onClick={() => setShowSPANC(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase">Nom de l'inspecteur</label>
              <input
                type="text"
                value={spancForm.inspecteur}
                onChange={e => setSpancForm(f => ({ ...f, inspecteur: e.target.value }))}
                placeholder="Nom de l'inspecteur SPANC"
                className="w-full h-12 px-4 mt-1 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase mb-2 block">Résultat</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: true, label: '✅ Conforme', active: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' },
                  { v: false, label: '❌ Non conforme', active: 'bg-red-500/20 border-red-500/50 text-red-400' },
                  { v: null, label: '⏳ En attente', active: 'bg-amber-500/20 border-amber-500/50 text-amber-400' },
                ].map(opt => (
                  <button
                    key={String(opt.v)}
                    onClick={() => setSpancForm(f => ({ ...f, conforme: opt.v }))}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all ${spancForm.conforme === opt.v
                      ? opt.active
                      : 'bg-white/5 border-white/10 text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase">Commentaire</label>
              <textarea
                value={spancForm.commentaire}
                onChange={e => setSpancForm(f => ({ ...f, commentaire: e.target.value }))}
                placeholder="Observations, remarques..."
                rows={3}
                className="w-full px-4 py-3 mt-1 bg-white/5 border border-white/10 rounded-xl text-white text-sm resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase mb-1 block">Photo du PV</label>
              {spancForm.photoUrl ? (
                <div className="relative inline-block">
                  <img src={spancForm.photoUrl} alt="" className="w-32 h-32 rounded-xl object-cover border border-white/10" />
                  <button onClick={() => setSpancForm(f => ({ ...f, photoUrl: null }))} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => spancPhotoRef.current?.click()}
                  className="w-full py-4 rounded-xl border-2 border-dashed border-white/10 text-gray-500 text-sm flex items-center justify-center space-x-2"
                >
                  <Camera size={20} />
                  <span>Photographier le PV</span>
                </button>
              )}
            </div>

            <button
              onClick={submitSPANC}
              className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold text-sm active:bg-blue-600"
            >
              Enregistrer la visite SPANC
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL NOTES ─── */}
      {showNotes && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-gray-900 rounded-t-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">📝 Notes chantier</h2>
              <button onClick={() => setShowNotes(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <textarea
              value={chantier.notes || ''}
              onChange={e => setNotes(devisId, e.target.value)}
              placeholder="Notes, observations, problèmes rencontrés..."
              rows={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm resize-none"
            />
            <button
              onClick={() => setShowNotes(false)}
              className="w-full py-3 rounded-xl bg-white/10 text-white font-bold text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL DÉPART ─── */}
      {showDepart && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-gray-900 rounded-t-2xl p-5 space-y-3">
            <h2 className="text-lg font-bold text-white">Quitter le chantier</h2>
            <p className="text-xs text-gray-400">Votre progression est sauvegardée. Vous pourrez reprendre en re-scannant le QR code.</p>

            <button
              onClick={() => handleDepart('pause')}
              className="w-full py-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm"
            >
              ⏸️ Pause — je reviens plus tard
            </button>

            <button
              onClick={() => handleDepart('spanc')}
              className="w-full py-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-sm"
            >
              🔵 Attente SPANC — reprend après visite
            </button>

            {progression.pct === 100 && (
              <button
                onClick={() => handleDepart('termine')}
                className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm"
              >
                ✅ Chantier terminé
              </button>
            )}

            <button
              onClick={() => setShowDepart(false)}
              className="w-full py-3 rounded-xl bg-white/5 text-gray-400 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL PHOTO PLEIN ÉCRAN ─── */}
      {showPhotoView && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setShowPhotoView(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center z-10">
            <X size={20} className="text-white" />
          </button>
          <img src={showPhotoView.dataUrl} alt="" className="max-w-full max-h-full object-contain" />
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-xs text-gray-400">{showPhotoView.poseur} — {fmtDate(showPhotoView.timestamp)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
