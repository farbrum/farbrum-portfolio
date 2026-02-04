import { ouvrirCompteRendu, telechargerCompteRendu } from '../services/compteRenduPDF'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDevisStore } from '../store/devisStore'
import { useAuthStore } from '../store/authStore'
import { pdfService } from '../services/pdfService'
import { ArrowLeft, Download, Eye, Trash2, HardHat, Pencil, EyeOff, FileText, Layers } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Window from '../components/Window'
import MapPicker from '../components/MapPicker'
import FicheChantier from '../components/FicheChantier'
import QRCodeDisplay, { buildChantierUrl } from '../components/QRCode'
import { useChantierStore, PROCEDURE_ANC } from '../store/chantierStore'
import { useProductStore } from '../store/productStore'

const MODES={souterrain:'Souterrain',aerien:'Aérien',semi_enterre:'Semi-enterré'}
const TYPES={microstation:'Microstation',filtre_compact:'Filtre compact',filtre_epandage:'Filtre + Épandage',fosse_epandage:'Fosse + Épandage',autre:'Autre'}
const REJETS={infiltration:'Infiltration',pluvial:'Pluvial communal',cours_eau:"Cours d'eau / fossé",puits:"Puits d'infiltration"}
const fmtC=v=>{const n=Number(v||0);const p=n.toFixed(2).split('.');p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.');return p.join(',')+' €'}
const stStyle={brouillon:'text-gray-400 bg-white/5',envoyé:'text-blue-400 bg-blue-500/10',accepté:'text-emerald-400 bg-emerald-500/10',refusé:'text-red-400 bg-red-500/10',en_cours:'text-amber-400 bg-amber-500/10',terminé:'text-teal-400 bg-teal-500/10'}
const stLabel={brouillon:'Brouillon',envoyé:'Envoyé',accepté:'Accepté',refusé:'Refusé',en_cours:'En cours',terminé:'Terminé'}
const scColors={terre:'border-emerald-500/30 bg-emerald-500/5',roche50:'border-amber-500/30 bg-amber-500/5',roche100:'border-red-500/30 bg-red-500/5'}
const scText={terre:'text-emerald-400',roche50:'text-amber-400',roche100:'text-red-400'}

export default function DevisDetail() {
  const {id}=useParams();const navigate=useNavigate();const {user}=useAuthStore();const isAdmin=user?.role==='admin'
  const {getDevisById,deleteDevis,updateDevis}=useDevisStore()
  const devis=getDevisById(id)
  const [showFiche,setShowFiche]=useState(false)
  const [showRedac,setShowRedac]=useState(false)
  const [pdfMsg,setPdfMsg]=useState('')
  const [showQR,setShowQR]=useState(false)

  if(!devis)return<Window title="Erreur"><div className="p-8 text-center"><p className="text-sm text-gray-400">Devis non trouvé.</p></div></Window>

  const mapMarkers=[
    ...(devis.gpsAnc?[{id:'anc',label:'📍 ANC',lat:devis.gpsAnc.lat,lng:devis.gpsAnc.lng,color:'red'}]:[]),
    ...(devis.gpsRemblais?[{id:'remblais',label:'🚛 Dépôt',lat:devis.gpsRemblais.lat,lng:devis.gpsRemblais.lng,color:'orange'}]:[]),
    ...(devis.gpsFournisseur?[{id:'fournisseur',label:'🏭 Fournisseur',lat:devis.gpsFournisseur.lat,lng:devis.gpsFournisseur.lng,color:'blue'}]:[]),
    ...(devis.gpsMortier?[{id:'mortier',label:'🏗️ Centrale béton',lat:devis.gpsMortier.lat,lng:devis.gpsMortier.lng,color:'green'}]:[]),
  ]
  const scenarios=devis.scenarios||[]
  const hasMulti=scenarios.length>1

  const handlePdfOpen=(idx)=>{setPdfMsg('Génération...');setTimeout(()=>{try{pdfService.ouvrirPDF(devis,idx);setPdfMsg('')}catch(e){setPdfMsg('Erreur: '+e.message)}},100)}
  const handlePdfDL=(idx)=>{setPdfMsg('Téléchargement...');setTimeout(()=>{try{pdfService.telechargerPDF(devis,idx);setPdfMsg('')}catch(e){setPdfMsg('Erreur: '+e.message)}},100)}

  return <div>
    <div className="flex items-center justify-between mb-4">
      <button onClick={()=>navigate('/')} className="flex items-center space-x-1 text-gray-500 hover:text-rose text-xs font-medium"><ArrowLeft className="w-3.5 h-3.5"/><span>Retour</span></button>
      <div className="flex items-center space-x-2">
        <button onClick={()=>setShowRedac(!showRedac)} className={`h-7 px-2.5 text-[10px] font-semibold rounded border flex items-center space-x-1 transition-all ${showRedac?'bg-rose/20 text-rose border-rose/40':'bg-white/5 text-gray-400 border-white/10'}`}><FileText className="w-3.5 h-3.5"/><span>Rédac.</span></button>
        <button onClick={()=>setShowFiche(!showFiche)} className={`h-7 px-2.5 text-[10px] font-semibold rounded border flex items-center space-x-1 transition-all ${showFiche?'bg-amber-500/20 text-amber-400 border-amber-500/40':'bg-white/5 text-gray-400 border-white/10'}`}><HardHat className="w-3.5 h-3.5"/><span>Fiche Chantier</span>{devis.ficheChantier?.startedAt&&<span className="ml-1 px-1 py-0.5 bg-rose/20 text-rose text-[8px] rounded">{Object.values(devis.ficheChantier.etapes||{}).filter(e=>e.done).length}✓</span>}</button>
        {isAdmin&&<button onClick={()=>setShowQR(!showQR)} className={`h-7 px-2.5 text-[10px] font-semibold rounded border flex items-center space-x-1 transition-all ${showQR?'bg-blue-500/20 text-blue-400 border-blue-500/40':'bg-white/5 text-gray-400 border-white/10'}`}><span>📱</span><span>QR Poseur</span></button>}
        {isAdmin&&<button onClick={()=>ouvrirCompteRendu(devis, chantierData, devis.controleurSPANC)} className="h-7 px-2.5 text-[10px] font-semibold rounded border flex items-center space-x-1 bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20 transition-all"><span>📋</span><span>Compte-Rendu</span></button>}
      </div>
    </div>

    {/* QR CODES PANEL */}
    {showQR&&isAdmin&&<div className="mb-4">
      <Window title="📱 QR Code Chantier — Identification par PIN"><div className="p-5">
        {(() => {
          const baseUrl = window.location.origin
          const ressources = useProductStore.getState().ressources || []
          const poseurs = ressources.filter(r => r.competences?.includes('pose') || r.competences?.includes('excavation'))
          const urlChantier = buildChantierUrl(baseUrl, id)

          return <div className="grid md:grid-cols-2 gap-6">
            {/* QR unique */}
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold mb-3">📷 QR unique — à imprimer / envoyer</p>
              <div className="inline-block bg-white/[0.02] border border-white/10 rounded-2xl p-4">
                <QRCodeDisplay url={urlChantier} size={160} />
                <p className="text-xs text-white font-bold mt-3">{devis.client?.nom || 'Client'}</p>
                <p className="text-[9px] text-gray-500">{devis.numeroDevis}</p>
              </div>
              <div className="mt-3 flex items-center justify-center space-x-2">
                <input type="text" readOnly value={urlChantier} className="w-56 h-8 px-2 bg-bg-input border border-white/10 rounded text-[9px] text-gray-400" onClick={e => e.target.select()} />
                <button onClick={() => navigator.clipboard?.writeText(urlChantier)} className="h-8 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded text-emerald-400 text-[10px] font-bold">📋 Copier</button>
                <a href={urlChantier} target="_blank" className="h-8 px-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded text-blue-400 text-[10px] font-bold flex items-center">👁️ Tester</a>
              </div>
            </div>

            {/* Codes PIN poseurs */}
            <div>
              <p className="text-xs text-gray-400 font-bold mb-3">🔑 Codes PIN poseurs — à communiquer individuellement</p>
              <div className="space-y-2">
                {poseurs.length > 0 ? poseurs.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-white/[0.02] border border-white/10 rounded-xl p-3">
                    <div>
                      <p className="text-sm text-white font-bold">{p.nom}</p>
                      <p className="text-[9px] text-gray-500">{p.competences?.join(', ')}</p>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {(p.pin || '????').split('').map((c, i) => (
                        <span key={i} className="w-8 h-10 bg-gray-800 border border-white/20 rounded-lg flex items-center justify-center text-lg font-mono font-bold text-rose">{c}</span>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-gray-600 text-sm">
                    <p>Aucun poseur configuré</p>
                    <p className="text-[10px] mt-1">Ajoutez des poseurs avec compétence "pose" dans<br/>Ressources Humaines + définissez leur code PIN</p>
                  </div>
                )}
              </div>
              <p className="text-[9px] text-gray-600 mt-3">💡 Le poseur scanne le QR → entre son code PIN → accède à sa fiche de suivi chantier</p>
            </div>
          </div>
        })()}
      </div></Window>
    </div>}

    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Window title={`Devis N° ${devis.numeroDevis}`}><div className="p-5">
          <div className="flex items-start justify-between mb-4"><div><h1 className="font-display text-lg font-bold text-white">N° {devis.numeroDevis}</h1><p className="text-[10px] text-gray-500">{format(new Date(devis.dateCreation),'dd MMMM yyyy',{locale:fr})}</p></div><span className={`px-2 py-1 rounded text-[10px] font-bold ${stStyle[devis.statut]}`}>{stLabel[devis.statut]}</span></div>
          {hasMulti&&<div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400">⚠️ 3 scénarios (absence étude sol)</div>}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">{[{l:'Client',v:devis.client?.nomComplet},{l:'Adresse',v:`${devis.client?.adresse||''}, ${devis.client?.codePostal||''} ${devis.client?.ville||''}`},{l:'Tél',v:devis.client?.telephone},{l:'Email',v:devis.client?.email||'—'}].map(i=>(<div key={i.l}><p className="text-[9px] text-gray-600 uppercase">{i.l}</p><p className="text-xs font-medium text-gray-200 mt-0.5">{i.v}</p></div>))}</div>
        </div></Window>

        <Window title="Installation"><div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{[{l:'Type',v:TYPES[devis.typeInstallation]},{l:'Mode',v:MODES[devis.modeInstallation]},{l:'ANC',v:devis.produitNom||'—'},{l:'Rejet',v:REJETS[devis.typeRejet]||'?'}].map(i=>(<div key={i.l} className="bg-bg-input border border-white/5 rounded p-2.5 text-center"><p className="text-[9px] text-gray-600 mb-0.5">{i.l}</p><p className="text-xs font-bold text-white">{i.v}</p></div>))}</div>
          <div className="mt-3 pt-3 border-t border-white/5"><p className="text-[9px] text-gray-600 uppercase mb-1">Volumes</p><div className="grid grid-cols-3 gap-1">{[['Fouille',devis.volumeFouille?.toFixed(1)],['Cuves',devis.volumeCuves?.toFixed(1)],['Remblais',devis.volumeRemblais?.toFixed(1)],['Sable PVC',devis.volumeSablePVC?.toFixed(2)],['Foisonné',((devis.volumeFouille||0)*1.3).toFixed(1)]].map(([l,v])=><div key={l} className="bg-bg-input border border-white/5 rounded p-1.5 text-center"><p className="text-[8px] text-gray-600">{l}</p><p className="text-xs font-bold text-white">{v||'?'} m³</p></div>)}</div></div>
          {devis.epandage&&<div className="mt-3 pt-3 border-t border-white/5"><p className="text-[9px] text-blue-400 uppercase mb-1">🌿 Épandage</p><div className="grid grid-cols-3 gap-1">{[['Surface',devis.epandage.surfaceM2+' m²'],['Drains',devis.epandage.longueurDrainTotal+' ml'],['Gravier',devis.epandage.volumeGravier+' m³']].map(([l,v])=><div key={l} className="bg-blue-500/5 border border-blue-500/10 rounded p-1.5 text-center"><p className="text-[8px] text-gray-600">{l}</p><p className="text-xs font-bold text-white">{v}</p></div>)}</div></div>}
          <div className="mt-3 pt-3 border-t border-white/5 space-y-1 text-[10px]">
            {devis.nbCoudesPVC>0&&<p className="text-gray-400">Coudes PVC : {devis.nbCoudesPVC} × {fmtC(devis.prixCoudePVC)}</p>}
            {devis.nbRehausses>0&&<p className="text-amber-400">Rehausses : {devis.nbRehausses} × {fmtC(devis.prixRehausse)}</p>}
            {devis.posteRelevage&&<p className="text-yellow-400">⚡ Poste relevage — câble {devis.longueurCableElec||'?'}ml</p>}
            {devis.restaurationSurface&&<p className="text-green-400">🌿 Restauration — terre {devis.terreVegetaleM3||0}m³</p>}
            {(devis.remisePourcent>0||devis.remiseMontant>0)&&<p className="text-emerald-400 font-bold">🏷️ Remise : {devis.remisePourcent>0?devis.remisePourcent+'%':fmtC(devis.remiseMontant)}</p>}
            <p className="text-gray-500">📸 Dossier photo : 100€</p>
          </div>
        </div></Window>

        {/* Sections rédactionnelles */}
        {showRedac&&devis.sectionsRedactionnelles?.length>0&&<Window title="📝 Structure rédactionnelle"><div className="p-5 space-y-3">{devis.sectionsRedactionnelles.map((s,i)=>{
          const txt=s.texte||s.defaut||''; if(!txt.trim())return null
          return <div key={i} className="border-b border-white/5 pb-2 last:border-0"><p className="text-[10px] font-bold text-rose mb-1">{s.titre}</p><p className="text-[10px] text-gray-400 leading-relaxed">{txt}</p></div>
        })}</div></Window>}

        {devis.gpsAnc&&<Window title="Localisation"><div className="p-5"><MapPicker markers={mapMarkers} height="280px"/></div></Window>}

        <Window title={hasMulti?"3 Scénarios":"Financier"}><div className="p-5 space-y-4">{scenarios.map((sc,idx)=>(<div key={sc.scenarioId||idx} className={`border rounded-lg p-4 ${scColors[sc.scenarioId]||'border-white/10'}`}>
          <div className="flex items-center justify-between mb-3"><h3 className={`text-sm font-bold ${scText[sc.scenarioId]||'text-white'}`}>{sc.scenarioNom||'Devis'}</h3><div className="flex items-center space-x-2">{hasMulti&&<span className={`px-2 py-0.5 rounded text-[9px] font-bold ${scText[sc.scenarioId]} bg-white/5`}>{idx+1}/3</span>}<button type="button" onClick={()=>handlePdfOpen(idx)} className="h-6 px-2 bg-white/5 hover:bg-white/10 text-gray-400 text-[9px] rounded border border-white/10 flex items-center space-x-1"><Eye className="w-3 h-3"/><span>PDF</span></button></div></div>
          <div className="space-y-1 text-[10px]">
            {[['⛏️ Terrassement',sc.coutTerrassementClient||sc.coutTerrassement],['🚛 Évacuation',sc.coutTransportClient||sc.coutTransport],(sc.coutMortierVehiculeKm||sc.coutKmMortier)>0&&['🏗️ Transport mortier',sc.coutMortierTranspClient||(sc.coutMortierVehiculeKm||sc.coutKmMortier)],sc.coutMortierMatiere>0&&[`🏗️ Mortier (${sc.volMortier?.toFixed(2)||0}m³)`,sc.coutMortierMatiere],(sc.coutLivraisonClient||sc.coutLivraison)>0&&['📦 Livraison fourn.',sc.coutLivraisonClient||sc.coutLivraison],[devis.produitNom||'Matériel ANC',sc.coutMateriel],sc.coutProduitsSup>0&&['Produits suppl.',sc.coutProduitsSup],['Fournitures',sc.coutAssocies],sc.coutCoudes>0&&['Coudes',sc.coutCoudes],sc.coutRehausses>0&&['Rehausses',sc.coutRehausses],sc.coutElec>0&&['Électrique',sc.coutElec],sc.coutEpandage>0&&['Épandage',sc.coutEpandage],sc.coutTerreVegetale>0&&['Terre vég.',sc.coutTerreVegetale],['Photo',100],sc.coutPoseur>0&&[`👷 Pose ×${sc.mainOeuvre?.nbPoseurs||2} (${sc.mainOeuvre?.hPoseDuree||0}h)`,sc.coutPoseur]].filter(Boolean).map(([l,v])=>(<div key={l} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="text-gray-300">{fmtC(v)}</span></div>))}
            {sc.montantRemise>0&&<div className="flex justify-between text-green-400 font-bold"><span>Remise</span><span>- {fmtC(sc.montantRemise)}</span></div>}
            <div className="flex justify-between pt-1 border-t border-white/10 font-bold"><span className="text-white">Total HT</span><span className="text-white">{fmtC(sc.totalHT)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">TVA 20%</span><span>{fmtC(sc.totalTVA)}</span></div>
            <div className="flex justify-between pt-1 border-t border-white/10"><span className={`font-display font-bold ${scText[sc.scenarioId]||'text-rose'}`}>Total TTC</span><span className={`font-display text-lg font-bold ${scText[sc.scenarioId]||'text-rose'}`}>{fmtC(sc.totalTTC)}</span></div>
          </div>
        </div>))}</div></Window>
      </div>

      <div className="space-y-4">
        {isAdmin&&<Window title="✏️ Modifier"><div className="p-4"><button onClick={()=>navigate(`/devis/${id}/edit`)} className="w-full h-10 bg-rose hover:bg-rose-light text-white text-sm font-semibold rounded flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(200,80,155,0.2)]"><Pencil className="w-4 h-4"/><span>Modifier</span></button></div></Window>}

        <Window title="PDF Client"><div className="p-4 space-y-2">
          {pdfMsg&&<p className="text-[10px] text-amber-400 mb-1">{pdfMsg}</p>}
          {hasMulti?(<>{scenarios.map((sc,idx)=>(<div key={idx} className="flex space-x-1"><button type="button" onClick={()=>handlePdfOpen(idx)} className={`flex-1 h-8 text-[10px] font-medium rounded border flex items-center justify-center space-x-1 ${scColors[sc.scenarioId]} ${scText[sc.scenarioId]} hover:opacity-80`}><Eye className="w-3 h-3"/><span>Aperçu {idx+1}</span></button><button type="button" onClick={()=>handlePdfDL(idx)} className={`flex-1 h-8 text-[10px] font-medium rounded border flex items-center justify-center space-x-1 ${scColors[sc.scenarioId]} ${scText[sc.scenarioId]} hover:opacity-80`}><Download className="w-3 h-3"/><span>DL {idx+1}</span></button></div>))}<button type="button" onClick={()=>pdfService.combinerPDF(devis)} className="w-full h-8 mt-1 bg-rose/10 hover:bg-rose/20 text-rose text-[10px] font-bold rounded border border-rose/30 flex items-center justify-center space-x-1"><Layers className="w-3 h-3"/><span>📄 Combiner tous les scénarios (1 PDF)</span></button><button type="button" onClick={()=>pdfService.telechargerTousScenarios(devis)} className="w-full h-8 mt-1 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-medium rounded border border-white/10 flex items-center justify-center space-x-1"><Layers className="w-3 h-3"/><span>Télécharger séparément (3 PDF)</span></button></>):(<><button type="button" onClick={()=>handlePdfOpen(0)} className="w-full h-9 bg-rose/10 hover:bg-rose/20 text-rose text-xs font-medium rounded border border-rose/30 flex items-center justify-center space-x-1.5"><Eye className="w-3.5 h-3.5"/><span>Aperçu PDF</span></button><button type="button" onClick={()=>handlePdfDL(0)} className="w-full h-9 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium rounded border border-white/10 flex items-center justify-center space-x-1.5"><Download className="w-3.5 h-3.5"/><span>Télécharger PDF</span></button></>)}
        </div></Window>

        {/* SUIVI CHANTIER */}
        {isAdmin&&(() => {
          const chantierData = useChantierStore.getState().chantiers[id]
          const prog = useChantierStore.getState().getProgression(id)
          if (!chantierData) return null
          return <Window title="📊 Suivi chantier"><div className="p-4 space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${prog.pct}%` }} />
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">{prog.pct}%</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="bg-bg-input border border-white/5 rounded p-1.5"><p className="text-xs font-bold text-white">{chantierData.photos?.length || 0}</p><p className="text-[8px] text-gray-500">📸 Photos</p></div>
              <div className="bg-bg-input border border-white/5 rounded p-1.5"><p className="text-xs font-bold text-white">{chantierData.passages?.length || 0}</p><p className="text-[8px] text-gray-500">📋 Passages</p></div>
              <div className="bg-bg-input border border-white/5 rounded p-1.5"><p className="text-xs font-bold text-white">{chantierData.spanc?.length || 0}</p><p className="text-[8px] text-gray-500">🔵 SPANC</p></div>
            </div>
            <div className="space-y-1">
              {PROCEDURE_ANC.map(phase => {
                const done = phase.etapes.every(e => chantierData.etapes[e.id]?.fait || (e.type === 'photo' && chantierData.photos?.some(p => p.etapeId === e.id)))
                const started = phase.etapes.some(e => chantierData.etapes[e.id]?.fait || chantierData.photos?.some(p => p.etapeId === e.id))
                return <div key={phase.id} className="flex items-center space-x-2">
                  <span className="text-[10px]">{done ? '✅' : started ? '🔶' : '⬜'}</span>
                  <span className={`text-[10px] ${done ? 'text-emerald-400' : started ? 'text-amber-400' : 'text-gray-600'}`}>{phase.phase}. {phase.titre}</span>
                </div>
              })}
            </div>
            {chantierData.statut && <p className={`text-[10px] font-bold ${chantierData.statut === 'termine' ? 'text-emerald-400' : chantierData.statut === 'pause_spanc' ? 'text-blue-400' : 'text-amber-400'}`}>
              {chantierData.statut === 'termine' ? '✅ Terminé' : chantierData.statut === 'pause_spanc' ? '⏸️ Attente SPANC' : '🔶 En cours'}
            </p>}
          </div></Window>
        })()}

        {isAdmin&&<Window title="Statut"><div className="p-4"><select value={devis.statut} onChange={e=>updateDevis(id,{statut:e.target.value})} className="w-full h-9 px-3 bg-bg-input border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose">{Object.entries(stLabel).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div></Window>}

        {showFiche&&<FicheChantier devis={devis}/>}

        {isAdmin&&<Window title="Zone de danger"><div className="p-4"><button onClick={()=>{if(confirm('Supprimer ?')){deleteDevis(id);navigate('/')}}} className="w-full h-9 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded border border-red-500/20 flex items-center justify-center space-x-1.5"><Trash2 className="w-3.5 h-3.5"/><span>Supprimer</span></button></div></Window>}
      </div>
    </div>
  </div>
}

function Sec({t,children}){return<div><p className="text-[8px] text-gray-600 uppercase font-bold">{t}</p>{children}</div>}
function G2({items}){return<div className="grid grid-cols-2 gap-1">{items.map(([l,v])=><div key={l} className="bg-black/20 rounded p-1"><p className="text-[8px] text-gray-600">{l}</p><p className="text-white">{v}</p></div>)}</div>}
