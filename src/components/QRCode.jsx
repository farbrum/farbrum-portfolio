import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

// ─── Composant QR Code ───
// Génère un QR code SVG à partir d'une URL
export default function QRCodeDisplay({ url, size = 150, label = '', className = '' }) {
  const [svgHtml, setSvgHtml] = useState('')

  useEffect(() => {
    if (!url) return
    QRCode.toString(url, {
      type: 'svg',
      width: size,
      margin: 1,
      color: { dark: '#ffffff', light: '#00000000' }
    }).then(svg => setSvgHtml(svg)).catch(() => {})
  }, [url, size])

  if (!svgHtml) return null

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div
        className="bg-white rounded-lg p-2"
        style={{ width: size + 16, height: size + 16 }}
        dangerouslySetInnerHTML={{ __html: svgHtml.replace(/#ffffff/g, '#000000').replace(/#00000000/g, '#ffffff') }}
      />
      {label && <p className="text-[9px] text-gray-500 mt-1 text-center max-w-[160px]">{label}</p>}
    </div>
  )
}

// ─── Générer un QR code en data URL (pour PDF) ───
export async function generateQRDataUrl(url, size = 200) {
  try {
    return await QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    })
  } catch {
    return null
  }
}

// ─── Générer l'URL du chantier pour un poseur ───
export function buildChantierUrl(baseUrl, devisId, poseurNom = '') {
  const params = new URLSearchParams()
  if (poseurNom) params.set('poseur', poseurNom)
  params.set('role', 'poseur')
  return `${baseUrl}/chantier/${devisId}?${params.toString()}`
}

// ─── Générer l'URL client ───
export function buildClientUrl(baseUrl, devisId) {
  return `${baseUrl}/chantier/${devisId}?role=client`
}
