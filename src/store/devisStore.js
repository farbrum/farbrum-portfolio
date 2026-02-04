import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useDevisStore = create(
  persist(
    (set, get) => ({
      devis: [],
      addDevis: (d) => { const n = { id:Date.now().toString(), numeroDevis:genNum(get().devis), dateCreation:new Date().toISOString(), statut:'brouillon', ...d }; set(s=>({devis:[...s.devis,n]})); return n },
      updateDevis: (id, u) => set(s => ({ devis: s.devis.map(d => d.id===id ? {...d,...u} : d) })),
      deleteDevis: (id) => set(s => ({ devis: s.devis.filter(d => d.id !== id) })),
      getDevisById: (id) => get().devis.find(d => d.id === id),
    }),
    { name: 'devis-storage' }
  )
)

function genNum(existing) {
  const t = new Date()
  const p = `${t.getFullYear()}${String(t.getMonth()+1).padStart(2,'0')}${String(t.getDate()).padStart(2,'0')}`
  return `${p}-${String(existing.filter(d=>d.numeroDevis?.startsWith(p)).length+1).padStart(3,'0')}`
}
