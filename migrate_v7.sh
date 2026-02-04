#!/bin/bash
# ═══════════════════════════════════════════════════════════
# F.Arbrum v7 — Migration complète Supabase
# Exécuter depuis /Users/capcasal/F_Arbrum_v5L/
# ═══════════════════════════════════════════════════════════

set -e
echo "🚀 F.Arbrum v7 — Migration Supabase complète"
echo "=============================================="

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
  echo "❌ Erreur: exécutez ce script depuis /Users/capcasal/F_Arbrum_v5L/"
  exit 1
fi

# Backup
echo "📦 Backup du code actuel..."
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)

# ─── Étape 1: Extraire les fonctions pures du productStore ───
echo "🔧 Extraction des fonctions de calcul..."

# Le productStore actuel a les fonctions de calcul (lignes 104-501) 
# qu'on doit garder intactes. On extrait tout entre "// ===== CALCULS ====="
# et le début du store "export const useProductStore"

python3 << 'PYTHON_EXTRACT'
import re

with open('src/store/productStore.js', 'r') as f:
    content = f.read()

# Trouver la partie des fonctions de calcul (entre les constantes et le store)
# On cherche depuis "// ===== CALCULS =====" jusqu'à "export const useProductStore"
match = re.search(r'(// ===== CALCULS =====.*?)(?=export const useProductStore)', content, re.DOTALL)
if match:
    with open('/tmp/calcFunctions.js', 'w') as f:
        f.write(match.group(1))
    print(f"  ✅ Fonctions de calcul extraites ({len(match.group(1))} chars)")
else:
    print("  ⚠️ Pas trouvé '// ===== CALCULS =====', on cherche autrement...")
    # Fallback: extraire depuis la première function export jusqu'au store
    match = re.search(r'(function calcVol.*?)(?=export const useProductStore)', content, re.DOTALL)
    if match:
        with open('/tmp/calcFunctions.js', 'w') as f:
            f.write(match.group(1))
        print(f"  ✅ Fonctions extraites (fallback): {len(match.group(1))} chars")
    else:
        print("  ❌ Impossible d'extraire les fonctions!")
        exit(1)

# Extraire aussi les constantes (GROUPES, TYPES, ENGINS, etc.)
match2 = re.search(r"(import.*?from 'zustand.*?\n(?:import.*?\n)*)(.*?)(// ===== CALCULS =====|function calcVol)", content, re.DOTALL)
if match2:
    with open('/tmp/constants.js', 'w') as f:
        f.write(match2.group(2))
    print(f"  ✅ Constantes extraites ({len(match2.group(2))} chars)")
PYTHON_EXTRACT

echo "✅ Extraction terminée"

# ─── Étape 2: Réécrire le productStore ───
echo "📝 Réécriture du productStore (Supabase)..."

cat > src/store/productStore.js << 'STORE_HEADER'
import { create } from 'zustand'
import { db, settings } from '../services/supabase'

STORE_HEADER

# Ajouter les constantes
cat /tmp/constants.js >> src/store/productStore.js

# Ajouter les fonctions de calcul
cat /tmp/calcFunctions.js >> src/store/productStore.js

# Ajouter le nouveau store Supabase
cat >> src/store/productStore.js << 'STORE_BODY'

// ═══════════════════════════════════════════════════════════
// STORE — Zustand SANS localStorage, avec sync Supabase
// ═══════════════════════════════════════════════════════════

export const useProductStore = create((set, get) => ({
  categories: [
    { id: 'microstations', nom: 'Microstations', typeCategorie: 'cuve', groupeId: 'assainissement', ordre: 1 },
    { id: 'filtres_compacts', nom: 'Filtres compacts', typeCategorie: 'cuve', groupeId: 'assainissement', ordre: 2 },
    { id: 'fosses', nom: 'Fosses toutes eaux', typeCategorie: 'cuve', groupeId: 'assainissement', ordre: 3 },
    { id: 'postes_relevage', nom: 'Postes de relevage', typeCategorie: 'cuve', groupeId: 'assainissement', ordre: 4 },
    { id: 'tubes_pvc', nom: 'Tubes PVC', typeCategorie: 'tube', groupeId: 'materiaux', ordre: 5 },
    { id: 'coudes_raccords', nom: 'Coudes & Raccords', typeCategorie: 'tube', groupeId: 'materiaux', ordre: 6 },
    { id: 'remblais', nom: 'Remblais', typeCategorie: 'remblai', groupeId: 'terrassement', ordre: 7 },
    { id: 'accessoires', nom: 'Accessoires', typeCategorie: 'accessoire', groupeId: 'divers', ordre: 8 },
  ],
  fournisseurs: [],
  produits: [],
  vehicules: [
    { id: 'semi', nom: 'Semi-remorque', ptac: 30, poidsVide: 15, capaciteM3: 20, vitesseKmh: 45, prixKm: 2.5 },
    { id: 'camion17', nom: 'Camion 17t', ptac: 17, poidsVide: 8, capaciteM3: 10, vitesseKmh: 45, prixKm: 2.0 },
    { id: 'camion10', nom: 'Camion 10t', ptac: 10, poidsVide: 5, capaciteM3: 6, vitesseKmh: 45, prixKm: 1.8 },
    { id: 'camion_benne', nom: 'Camion benne 3.5t', ptac: 3.5, poidsVide: 1.8, capaciteM3: 3, vitesseKmh: 45, prixKm: 1.5 },
    { id: 'tracteur_remorque', nom: 'Tracteur + remorque', ptac: 8, poidsVide: 4, capaciteM3: 6, vitesseKmh: 16, prixKm: 1.2 },
  ],
  ressources: [...RESSOURCES_HUMAINES_DEFAULT],
  tarifsMateriaux: { ...TARIFS_MATERIAUX_DEFAULT },
  tarifsChantier: { ...TARIFS_CHANTIER_DEFAULT },
  enginsData: ENGINS.map(e => ({ ...e, indisponibilites: [] })),
  loaded: false,
  loading: false,

  // ─── INIT : Charger depuis Supabase ───
  init: async () => {
    if (get().loaded) return
    set({ loading: true })
    try {
      const [cats, fourns, prods, vehs, engs, ress, tMat, tCh] = await Promise.all([
        db.getAll('categories'),
        db.getAll('fournisseurs'),
        db.getAll('produits'),
        db.getAll('vehicules'),
        db.getAll('engins'),
        db.getAll('ressources'),
        settings.get('tarifs_materiaux'),
        settings.get('tarifs_chantier'),
      ])
      set({
        categories: cats?.length > 0 ? cats.map(c => ({ id: c.id, nom: c.nom, typeCategorie: c.data?.typeCategorie || c.type || 'autre', groupeId: c.data?.groupeId || c.groupe || 'divers', ordre: c.data?.ordre || 0, ...(c.data || {}) })) : get().categories,
        fournisseurs: fourns?.length > 0 ? fourns.map(f => ({ id: f.id, nom: f.nom, contact: f.contact, telephone: f.telephone, email: f.email, adresse: f.adresse, notes: f.notes, ...(f.data || {}) })) : get().fournisseurs,
        produits: prods?.length > 0 ? prods.map(p => ({ id: p.id, nom: p.nom, categorieId: p.categorie_id, fournisseurId: p.fournisseur_id, prix: p.prix, unite: p.unite, ...(p.data || {}) })) : get().produits,
        vehicules: vehs?.length > 0 ? vehs.map(v => ({ id: v.id, nom: v.nom, ...(v.data || {}) })) : get().vehicules,
        enginsData: engs?.length > 0 ? engs.map(e => ({ id: e.id, nom: e.nom, rendementM3h: e.rendement_m3h, coutHoraire: e.cout_horaire, consommationLH: e.consommation_lh, deplacement: e.deplacement, indisponibilites: e.data?.indisponibilites || [], ...(e.data || {}) })) : get().enginsData,
        ressources: ress?.length > 0 ? ress.map(r => ({ id: r.id, nom: r.nom, pin: r.pin, role: r.role, tarifJournalier: r.tarif_journalier, tarifHoraire: r.tarif_horaire, competences: r.competences || [], joursTravail: r.jours_travail || [1,2,3,4,5], indisponibilites: r.data?.indisponibilites || [], ...(r.data || {}) })) : get().ressources,
        tarifsMateriaux: tMat ? { ...TARIFS_MATERIAUX_DEFAULT, ...tMat } : get().tarifsMateriaux,
        tarifsChantier: tCh ? { ...TARIFS_CHANTIER_DEFAULT, ...tCh } : get().tarifsChantier,
        loaded: true, loading: false,
      })
      console.log('[ProductStore] ✅ Données chargées depuis Supabase')
    } catch (err) {
      console.error('[ProductStore] init error:', err)
      set({ loaded: true, loading: false })
    }
  },

  // ─── CRUD Catégories ───
  addCategorie: (d) => {
    const c = { id: Date.now().toString(), ordre: get().categories.length + 1, ...d }
    set(s => ({ categories: [...s.categories, c] }))
    db.upsert('categories', { id: c.id, nom: c.nom, groupe: c.groupeId || 'divers', type: c.typeCategorie || 'autre', data: c }).catch(e => console.error('[DB]', e))
    return c
  },
  updateCategorie: (id, d) => {
    set(s => ({ categories: s.categories.map(c => c.id === id ? { ...c, ...d } : c) }))
    const updated = get().categories.find(c => c.id === id)
    if (updated) db.upsert('categories', { id, nom: updated.nom, groupe: updated.groupeId || 'divers', type: updated.typeCategorie || 'autre', data: updated }).catch(e => console.error('[DB]', e))
  },
  deleteCategorie: (id) => {
    set(s => ({ categories: s.categories.filter(c => c.id !== id) }))
    db.delete('categories', id).catch(e => console.error('[DB]', e))
  },
  getCategoriesSorted: () => {
    const go = { assainissement: 1, materiaux: 2, terrassement: 3, divers: 4 }
    return [...get().categories].sort((a, b) => { const ga = go[a.groupeId] || 99, gb = go[b.groupeId] || 99; return ga !== gb ? ga - gb : (a.ordre || 99) - (b.ordre || 99) })
  },

  // ─── CRUD Fournisseurs ───
  addFournisseur: (d) => {
    const f = { id: Date.now().toString(), ...d }
    set(s => ({ fournisseurs: [...s.fournisseurs, f] }))
    db.upsert('fournisseurs', { id: f.id, nom: f.nom, contact: f.contact || '', telephone: f.telephone || '', email: f.email || '', adresse: f.adresse || '', notes: f.notes || '', data: f }).catch(e => console.error('[DB]', e))
    return f
  },
  updateFournisseur: (id, d) => {
    set(s => ({ fournisseurs: s.fournisseurs.map(f => f.id === id ? { ...f, ...d } : f) }))
    const updated = get().fournisseurs.find(f => f.id === id)
    if (updated) db.upsert('fournisseurs', { id, nom: updated.nom, contact: updated.contact || '', telephone: updated.telephone || '', email: updated.email || '', adresse: updated.adresse || '', notes: updated.notes || '', data: updated }).catch(e => console.error('[DB]', e))
  },
  deleteFournisseur: (id) => {
    set(s => ({ fournisseurs: s.fournisseurs.filter(f => f.id !== id) }))
    db.delete('fournisseurs', id).catch(e => console.error('[DB]', e))
  },

  // ─── CRUD Produits ───
  addProduit: (d) => {
    const p = { id: Date.now().toString(), dateAjout: new Date().toISOString(), ...d }
    set(s => ({ produits: [...s.produits, p] }))
    db.upsert('produits', { id: p.id, nom: p.nom, categorie_id: p.categorieId || null, fournisseur_id: p.fournisseurId || null, prix: p.prix || p.prixUnitaire || 0, unite: p.unite || 'u', data: p }).catch(e => console.error('[DB]', e))
    return p
  },
  updateProduit: (id, d) => {
    set(s => ({ produits: s.produits.map(p => p.id === id ? { ...p, ...d } : p) }))
    const updated = get().produits.find(p => p.id === id)
    if (updated) db.upsert('produits', { id, nom: updated.nom, categorie_id: updated.categorieId || null, fournisseur_id: updated.fournisseurId || null, prix: updated.prix || updated.prixUnitaire || 0, unite: updated.unite || 'u', data: updated }).catch(e => console.error('[DB]', e))
  },
  deleteProduit: (id) => {
    set(s => ({ produits: s.produits.filter(p => p.id !== id) }))
    db.delete('produits', id).catch(e => console.error('[DB]', e))
  },

  // ─── CRUD Véhicules ───
  addVehicule: (d) => {
    const v = { id: Date.now().toString(), ...d }
    set(s => ({ vehicules: [...s.vehicules, v] }))
    db.upsert('vehicules', { id: v.id, nom: v.nom, immatriculation: v.immatriculation || '', capacite_m3: v.capaciteM3 || 0, cout_km: v.prixKm || 0, data: v }).catch(e => console.error('[DB]', e))
    return v
  },
  updateVehicule: (id, d) => {
    set(s => ({ vehicules: s.vehicules.map(v => v.id === id ? { ...v, ...d } : v) }))
    const updated = get().vehicules.find(v => v.id === id)
    if (updated) db.upsert('vehicules', { id, nom: updated.nom, immatriculation: updated.immatriculation || '', capacite_m3: updated.capaciteM3 || 0, cout_km: updated.prixKm || 0, data: updated }).catch(e => console.error('[DB]', e))
  },
  deleteVehicule: (id) => {
    set(s => ({ vehicules: s.vehicules.filter(v => v.id !== id) }))
    db.delete('vehicules', id).catch(e => console.error('[DB]', e))
  },

  // ─── CRUD Ressources ───
  addRessource: (d) => {
    const r = { id: Date.now().toString(), indisponibilites: [], ...d }
    set(s => ({ ressources: [...s.ressources, r] }))
    db.upsert('ressources', { id: r.id, nom: r.nom, pin: r.pin || '', role: r.role || 'poseur', tarif_journalier: r.tarifJournalier || 0, tarif_horaire: r.tarifHoraire || 0, competences: r.competences || [], jours_travail: r.joursTravail || [1,2,3,4,5], data: r }).catch(e => console.error('[DB]', e))
    return r
  },
  updateRessource: (id, d) => {
    set(s => ({ ressources: s.ressources.map(r => r.id === id ? { ...r, ...d } : r) }))
    const updated = get().ressources.find(r => r.id === id)
    if (updated) db.upsert('ressources', { id, nom: updated.nom, pin: updated.pin || '', role: updated.role || 'poseur', tarif_journalier: updated.tarifJournalier || 0, tarif_horaire: updated.tarifHoraire || 0, competences: updated.competences || [], jours_travail: updated.joursTravail || [1,2,3,4,5], data: updated }).catch(e => console.error('[DB]', e))
  },
  deleteRessource: (id) => {
    set(s => ({ ressources: s.ressources.filter(r => r.id !== id) }))
    db.delete('ressources', id).catch(e => console.error('[DB]', e))
  },
  toggleRessourceIndispo: (id, dateStr) => {
    set(s => ({
      ressources: s.ressources.map(r => r.id === id ? { ...r, indisponibilites: (r.indisponibilites || []).includes(dateStr) ? r.indisponibilites.filter(d => d !== dateStr) : [...(r.indisponibilites || []), dateStr] } : r)
    }))
    const updated = get().ressources.find(r => r.id === id)
    if (updated) db.upsert('ressources', { id, nom: updated.nom, pin: updated.pin || '', role: updated.role || 'poseur', tarif_journalier: updated.tarifJournalier || 0, tarif_horaire: updated.tarifHoraire || 0, competences: updated.competences || [], jours_travail: updated.joursTravail || [1,2,3,4,5], data: updated }).catch(e => console.error('[DB]', e))
  },

  // ─── CRUD Engins ───
  addEngin: (d) => {
    const e = { id: Date.now().toString(), indisponibilites: [], ...d }
    set(s => ({ enginsData: [...s.enginsData, e] }))
    db.upsert('engins', { id: e.id, nom: e.nom, rendement_m3h: e.rendementM3h || 0, cout_horaire: e.coutHoraire || 0, consommation_lh: e.consommationLH || 0, deplacement: e.deplacement || 0, data: e }).catch(err => console.error('[DB]', err))
    return e
  },
  updateEngin: (id, d) => {
    set(s => ({ enginsData: s.enginsData.map(e => e.id === id ? { ...e, ...d } : e) }))
    const updated = get().enginsData.find(e => e.id === id)
    if (updated) db.upsert('engins', { id, nom: updated.nom, rendement_m3h: updated.rendementM3h || 0, cout_horaire: updated.coutHoraire || 0, consommation_lh: updated.consommationLH || 0, deplacement: updated.deplacement || 0, data: updated }).catch(err => console.error('[DB]', err))
  },
  deleteEngin: (id) => {
    set(s => ({ enginsData: s.enginsData.filter(e => e.id !== id) }))
    db.delete('engins', id).catch(e => console.error('[DB]', e))
  },
  toggleEnginIndispo: (id, dateStr) => {
    set(s => ({
      enginsData: s.enginsData.map(e => e.id === id ? { ...e, indisponibilites: (e.indisponibilites || []).includes(dateStr) ? e.indisponibilites.filter(d => d !== dateStr) : [...(e.indisponibilites || []), dateStr] } : e)
    }))
    const updated = get().enginsData.find(e => e.id === id)
    if (updated) db.upsert('engins', { id, nom: updated.nom, rendement_m3h: updated.rendementM3h || 0, cout_horaire: updated.coutHoraire || 0, consommation_lh: updated.consommationLH || 0, deplacement: updated.deplacement || 0, data: updated }).catch(err => console.error('[DB]', err))
  },

  // ─── Tarifs ───
  updateTarifs: (d) => {
    set(s => ({ tarifsMateriaux: { ...s.tarifsMateriaux, ...d } }))
    const updated = get().tarifsMateriaux
    settings.set('tarifs_materiaux', updated).catch(e => console.error('[DB]', e))
  },
  updateTarifsChantier: (d) => {
    set(s => ({ tarifsChantier: { ...s.tarifsChantier, ...d } }))
    const updated = get().tarifsChantier
    settings.set('tarifs_chantier', updated).catch(e => console.error('[DB]', e))
  },
}))
STORE_BODY

echo "✅ productStore.js réécrit"

# ─── Étape 3: Nettoyer le localStorage résiduel ───
# Retirer 'persist' du chantierStore
echo "📝 Mise à jour du chantierStore (retrait localStorage)..."
sed -i '' "s/import { persist } from 'zustand\/middleware'//" src/store/chantierStore.js
sed -i '' "s/export const useChantierStore = create(/export const useChantierStore = create(/" src/store/chantierStore.js
# Retirer le persist wrapper
python3 << 'PYTHON_CHANTIER'
with open('src/store/chantierStore.js', 'r') as f:
    content = f.read()

# Retirer persist wrapper
content = content.replace(
    "export const useChantierStore = create(\n  persist(\n    (set, get) => ({",
    "export const useChantierStore = create((set, get) => ({"
)
content = content.replace(
    "    }),\n    { name: 'chantier-storage' }\n  )\n)",
    "}))"
)
# Aussi essayer avec des variations d'indentation
content = content.replace(
    "  persist(\n    (set, get) => ({",
    "(set, get) => ({"
)
content = content.replace(
    "}),\n    { name: 'chantier-storage' }\n  )\n)",
    "}))"
)

with open('src/store/chantierStore.js', 'w') as f:
    f.write(content)
print("  ✅ chantierStore.js: persist retiré")
PYTHON_CHANTIER

echo "✅ chantierStore mis à jour"

echo ""
echo "═══════════════════════════════════════════"
echo "✅ Migration terminée !"
echo ""
echo "Prochaines étapes :"
echo "  npm run dev      (test local)"
echo "  npm run build    (compilation)"
echo "  git add -A && git commit -m 'v7 full Supabase' && git push"
echo "═══════════════════════════════════════════"
