import { useRef, useState, useEffect } from 'react'
import { X, Check, RotateCcw, Pen } from 'lucide-react'

export default function SignaturePad({ onSave, onClose, titre = 'Signature', sousTitre = '' }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [signataireNom, setSignataireNom] = useState('')
  const [signataireFonction, setSignataireFonction] = useState('client') // client, poseur, responsable

  // ─── Init canvas ───
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    // Ajuster la taille du canvas à sa taille CSS
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    
    // Style du trait
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    // Fond transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Ligne de signature
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.moveTo(20, rect.height - 40)
    ctx.lineTo(rect.width - 20, rect.height - 40)
    ctx.stroke()
    
    // Texte indicatif
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Signez ici avec votre doigt', rect.width / 2, rect.height / 2)
    
    // Réinitialiser le style pour le dessin
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2.5
  }, [])

  // ─── Dessin tactile & souris ───
  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches ? e.touches[0] : e
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }

  const startDraw = (e) => {
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true)
    
    // Effacer le texte indicatif au premier trait
    if (!hasDrawn) {
      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
      
      // Redessiner la ligne
      ctx.save()
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = 1
      ctx.moveTo(20, rect.height - 40)
      ctx.lineTo(rect.width - 20, rect.height - 40)
      ctx.stroke()
      ctx.restore()
      
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    }
  }

  const draw = (e) => {
    e.preventDefault()
    if (!isDrawing) return
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasDrawn(true)
  }

  const endDraw = (e) => {
    e.preventDefault()
    setIsDrawing(false)
  }

  // ─── Effacer ───
  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    
    // Redessiner la ligne et le texte
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.moveTo(20, rect.height - 40)
    ctx.lineTo(rect.width - 20, rect.height - 40)
    ctx.stroke()
    
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Signez ici avec votre doigt', rect.width / 2, rect.height / 2)
    ctx.restore()
    
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    setHasDrawn(false)
  }

  // ─── Sauvegarder ───
  const handleSave = () => {
    if (!hasDrawn || !signataireNom.trim()) return
    
    const canvas = canvasRef.current
    const signatureData = canvas.toDataURL('image/png')
    
    onSave({
      signatureImage: signatureData,
      signataire: signataireNom.trim(),
      fonction: signataireFonction,
      timestamp: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-end">
      <div className="w-full bg-gray-900 rounded-t-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Pen size={20} className="text-rose" />
              <span>{titre}</span>
            </h2>
            {sousTitre && <p className="text-[10px] text-gray-500 mt-0.5">{sousTitre}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Nom du signataire */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase">Nom du signataire *</label>
          <input
            type="text"
            value={signataireNom}
            onChange={e => setSignataireNom(e.target.value)}
            placeholder="Nom et prénom"
            className="w-full h-12 px-4 mt-1 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose/50"
          />
        </div>

        {/* Fonction */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase mb-2 block">Qualité</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 'client', label: '👤 Client' },
              { v: 'poseur', label: '👷 Poseur' },
              { v: 'responsable', label: '👔 Responsable' },
            ].map(opt => (
              <button
                key={opt.v}
                onClick={() => setSignataireFonction(opt.v)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  signataireFonction === opt.v
                    ? 'bg-rose/20 border-rose/50 text-rose'
                    : 'bg-white/5 border-white/10 text-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zone de signature */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-gray-500 uppercase">Signature *</label>
            <button
              onClick={clearCanvas}
              className="flex items-center space-x-1 text-[10px] text-gray-500 hover:text-white"
            >
              <RotateCcw size={10} />
              <span>Effacer</span>
            </button>
          </div>
          <div className="rounded-xl border-2 border-dashed border-white/20 bg-white/[0.03] overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full touch-none"
              style={{ height: '200px' }}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
            />
          </div>
        </div>

        {/* Boutons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-xl bg-white/5 text-gray-400 font-bold text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!hasDrawn || !signataireNom.trim()}
            className={`flex-1 py-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 ${
              hasDrawn && signataireNom.trim()
                ? 'bg-emerald-500 text-white active:bg-emerald-600'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
          >
            <Check size={18} />
            <span>Valider la signature</span>
          </button>
        </div>

        {/* Mention légale */}
        <p className="text-[8px] text-gray-600 text-center">
          En signant, vous confirmez que les travaux ont été réalisés conformément au devis.
          Cette signature a valeur d'accusé de réception.
        </p>
      </div>
    </div>
  )
}
