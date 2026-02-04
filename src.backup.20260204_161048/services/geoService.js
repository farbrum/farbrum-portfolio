// Service de recherche de communes par code postal (API gouv.fr)
export async function rechercherCommunes(codePostal) {
  if (!codePostal || codePostal.length < 5) return []
  try {
    const res = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${codePostal}&fields=nom,codesPostaux,centre,population&format=json`)
    if (!res.ok) return []
    const data = await res.json()
    return data.map(c => ({
      nom: c.nom,
      codePostal: codePostal,
      lat: c.centre?.coordinates?.[1] || null,
      lng: c.centre?.coordinates?.[0] || null,
      population: c.population || 0,
    })).sort((a, b) => b.population - a.population)
  } catch {
    return []
  }
}

// Recherche adresse complète → coordonnées GPS
export async function geocoderAdresse(adresse) {
  if (!adresse || adresse.length < 5) return null
  try {
    const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adresse)}&limit=5`)
    if (!res.ok) return null
    const data = await res.json()
    return (data.features || []).map(f => ({
      label: f.properties.label,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      ville: f.properties.city,
      codePostal: f.properties.postcode,
    }))
  } catch {
    return null
  }
}
