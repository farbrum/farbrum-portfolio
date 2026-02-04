#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// F_Arbrum — Backup automatique Supabase → Disque externe
// Se lance à chaque connexion Mac via LaunchAgent
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://fqnsfjfhrpvtnxaxfmjk.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_sN2N7KM-of_237NL0HHs0A_ZCLWfaX5'
const BACKUP_DIR = '/Volumes/TMP/Sauvegarde BD Farbrum'

// Tables à sauvegarder
const TABLES = [
  'devis',
  'produits',
  'ressources',
  'engins',
  'vehicules',
  'fournisseurs',
  'categories',
  'chantiers',
  'settings',
  'users',
  'photos',
]

import { writeFileSync, mkdirSync, existsSync, appendFileSync } from 'fs'
import { join } from 'path'

const log = (msg) => {
  const ts = new Date().toISOString()
  const line = `[${ts}] ${msg}`
  console.log(line)
  // Log aussi dans un fichier sur le disque externe
  try {
    const logFile = join(BACKUP_DIR, 'backup_log.txt')
    appendFileSync(logFile, line + '\n')
  } catch (_) { /* disque pas monté */ }
}

async function fetchTable(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*`
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    }
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`HTTP ${res.status} pour ${table}: ${err}`)
  }
  return await res.json()
}

async function main() {
  log('=== Démarrage backup F_Arbrum ===')

  // Vérifier que le disque est branché
  if (!existsSync('/Volumes/TMP')) {
    log('❌ Disque TMP non détecté — backup annulé')
    process.exit(0) // Exit propre, pas d'erreur
  }

  // Créer le dossier de backup du jour
  const today = new Date().toISOString().split('T')[0] // 2026-02-04
  const hour = new Date().toTimeString().slice(0, 5).replace(':', 'h') // 16h30
  const backupFolder = join(BACKUP_DIR, `${today}_${hour}`)

  try {
    mkdirSync(BACKUP_DIR, { recursive: true })
    mkdirSync(backupFolder, { recursive: true })
  } catch (err) {
    log(`❌ Impossible de créer le dossier: ${err.message}`)
    process.exit(1)
  }

  let totalRecords = 0
  let errors = 0

  for (const table of TABLES) {
    try {
      const data = await fetchTable(table)
      const filePath = join(backupFolder, `${table}.json`)
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
      totalRecords += data.length
      log(`  ✅ ${table}: ${data.length} enregistrements`)
    } catch (err) {
      log(`  ❌ ${table}: ${err.message}`)
      errors++
    }
  }

  // Fichier résumé
  const summary = {
    date: new Date().toISOString(),
    tables: TABLES.length,
    totalRecords,
    errors,
    dossier: backupFolder,
  }
  writeFileSync(join(backupFolder, '_resume.json'), JSON.stringify(summary, null, 2), 'utf-8')

  log(`=== Backup terminé: ${totalRecords} enregistrements, ${errors} erreur(s) ===`)
  log(`📁 Sauvegardé dans: ${backupFolder}`)

  // Nettoyage : garder les 30 derniers backups max
  try {
    const { readdirSync, rmSync } = await import('fs')
    const dirs = readdirSync(BACKUP_DIR)
      .filter(d => /^\d{4}-\d{2}-\d{2}_/.test(d))
      .sort()
    if (dirs.length > 30) {
      const toDelete = dirs.slice(0, dirs.length - 30)
      for (const d of toDelete) {
        rmSync(join(BACKUP_DIR, d), { recursive: true, force: true })
        log(`  🗑️ Ancien backup supprimé: ${d}`)
      }
    }
  } catch (_) { /* pas grave */ }
}

main().catch(err => {
  log(`❌ Erreur fatale: ${err.message}`)
  process.exit(1)
})
