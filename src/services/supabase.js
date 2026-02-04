import { createClient } from '@supabase/supabase-js'

// ─── Configuration Supabase ───
const SUPABASE_URL = 'https://fqnsfjfhrpvtnxaxfmjk.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_sN2N7KM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ═══════════════════════════════════════════════════════════
// SERVICE GÉNÉRIQUE CRUD
// ═══════════════════════════════════════════════════════════

export const db = {
  // ─── Lire tous les enregistrements d'une table ───
  async getAll(table) {
    const { data, error } = await supabase.from(table).select('*')
    if (error) { console.error(`[DB] getAll ${table}:`, error); return [] }
    return data || []
  },

  // ─── Lire un enregistrement par ID ───
  async getById(table, id) {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
    if (error) { console.error(`[DB] getById ${table}:`, error); return null }
    return data
  },

  // ─── Insérer un enregistrement ───
  async insert(table, record) {
    const { data, error } = await supabase.from(table).insert(record).select().single()
    if (error) { console.error(`[DB] insert ${table}:`, error); return null }
    return data
  },

  // ─── Insérer plusieurs enregistrements ───
  async insertMany(table, records) {
    if (!records?.length) return []
    const { data, error } = await supabase.from(table).insert(records).select()
    if (error) { console.error(`[DB] insertMany ${table}:`, error); return [] }
    return data || []
  },

  // ─── Mettre à jour un enregistrement ───
  async update(table, id, updates) {
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
    if (error) { console.error(`[DB] update ${table}:`, error); return null }
    return data
  },

  // ─── Upsert (insérer ou mettre à jour) ───
  async upsert(table, record) {
    const { data, error } = await supabase.from(table).upsert(record).select().single()
    if (error) { console.error(`[DB] upsert ${table}:`, error); return null }
    return data
  },

  // ─── Upsert plusieurs enregistrements ───
  async upsertMany(table, records) {
    if (!records?.length) return []
    const { data, error } = await supabase.from(table).upsert(records).select()
    if (error) { console.error(`[DB] upsertMany ${table}:`, error); return [] }
    return data || []
  },

  // ─── Supprimer un enregistrement ───
  async delete(table, id) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { console.error(`[DB] delete ${table}:`, error); return false }
    return true
  },
}

// ═══════════════════════════════════════════════════════════
// SETTINGS (clé-valeur)
// ═══════════════════════════════════════════════════════════

export const settings = {
  async get(key) {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).single()
    if (error) return null
    return data?.value
  },

  async set(key, value) {
    const { error } = await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
    if (error) console.error(`[Settings] set ${key}:`, error)
  },
}

// ═══════════════════════════════════════════════════════════
// STORAGE — Upload/Download photos
// ═══════════════════════════════════════════════════════════

export const storage = {
  // ─── Upload une photo (base64 → fichier) ───
  async uploadPhoto(devisId, etapeId, base64Data) {
    try {
      // Convertir base64 en blob
      const res = await fetch(base64Data)
      const blob = await res.blob()
      
      const fileName = `${devisId}/${etapeId}/${Date.now()}.jpg`
      
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false })
      
      if (error) { console.error('[Storage] upload:', error); return null }
      
      // Retourner l'URL publique
      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName)
      return urlData?.publicUrl || null
    } catch (err) {
      console.error('[Storage] uploadPhoto error:', err)
      return null
    }
  },

  // ─── Supprimer une photo ───
  async deletePhoto(filePath) {
    const { error } = await supabase.storage.from('photos').remove([filePath])
    if (error) console.error('[Storage] delete:', error)
  },

  // ─── URL publique d'une photo ───
  getPhotoUrl(filePath) {
    const { data } = supabase.storage.from('photos').getPublicUrl(filePath)
    return data?.publicUrl || ''
  },
}

// ═══════════════════════════════════════════════════════════
// AUTH — Vérification utilisateurs
// ═══════════════════════════════════════════════════════════

export const auth = {
  async login(email, password) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password', password)
      .single()
    
    if (error || !data) return null
    // Ne pas retourner le mot de passe
    const { password: _, ...safe } = data
    return safe
  },

  async getUsers() {
    return await db.getAll('users')
  },

  async addUser(userData) {
    return await db.insert('users', { ...userData, email: userData.email.toLowerCase() })
  },

  async updateUser(id, updates) {
    if (updates.email) updates.email = updates.email.toLowerCase()
    return await db.update('users', id, updates)
  },

  async deleteUser(id) {
    return await db.delete('users', id)
  },

  async verifyCodeEntreprise(code) {
    const stored = await settings.get('code_entreprise')
    return code.toUpperCase().trim() === (stored || 'FARB2025').toUpperCase()
  },

  async setCodeEntreprise(newCode) {
    await settings.set('code_entreprise', newCode.toUpperCase().trim())
  },
}
