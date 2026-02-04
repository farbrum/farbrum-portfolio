import { jsPDF } from 'jspdf'
import { LOGO_B64 } from './logoData.js'

// RAL 4003 Telemagenta
const ROSE = [195, 56, 121]
const ROSE_LIGHT = [235, 180, 210]
const TYPES = { microstation:'Microstation', filtre_compact:'Filtre compact', filtre_epandage:'Filtre + Épandage', fosse_epandage:'Fosse + Épandage', autre:'Autre' }
const MODES = { souterrain:'Souterrain (enterré)', aerien:'Aérien (hors-sol)', semi_enterre:'Semi-enterré' }
const REJETS = { infiltration:'Infiltration (sol)', pluvial:'Réseau pluvial communal', cours_eau:"Cours d'eau / fossé", puits:"Puits d'infiltration" }
const fmt = v => {
  const n = Number(v||0)
  const parts = n.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return parts.join(',') + ' €'
}
const ENT = {
  nom: 'F.Arbrum', sousTitre: 'Assainissement Non Collectif',
  adresse: '5 impasse de la Colombette', cp: '31000', ville: 'Toulouse',
  siret: '90115928500021', tva: 'FR82901159285', iban: 'FR76 1720 6004 3293 0301 5388 895',
}

function drawBorder(doc) {
  doc.setDrawColor(...ROSE); doc.setLineWidth(0.5); doc.roundedRect(5, 5, 200, 287, 7, 7)
}
function drawPageNum(doc, p, t) {
  const cx=192,cy=278,r=10
  doc.setDrawColor(...ROSE); doc.setFillColor(...ROSE); doc.circle(cx,cy,r,'F')
  doc.setFontSize(11); doc.setFont(undefined,'bold'); doc.setTextColor(255,255,255)
  doc.text(`${p}/${t}`,cx,cy+2,{align:'center'})
}
function drawFooter(doc) {
  // Ligne rose séparatrice au-dessus du logo
  doc.setDrawColor(...ROSE); doc.setLineWidth(0.5); doc.line(10,273,200,273)
  try { doc.addImage(LOGO_B64,'PNG',10,274.5,18,14) } catch(e){}
  doc.setFontSize(5.5); doc.setFont(undefined,'normal'); doc.setTextColor(130,130,130)
  doc.text(`${ENT.nom} — ${ENT.adresse}, ${ENT.cp} ${ENT.ville} | SIRET: ${ENT.siret} | TVA: ${ENT.tva} | IBAN: ${ENT.iban}`,105,291,{align:'center'})
}
function np(doc){ doc.addPage(); drawBorder(doc); return 18 }
function ck(doc,y,n=20){ return y+n>268 ? np(doc) : y }

function drawTable(doc,x,startY,cw,rows,opts={}){
  const{headerBg=ROSE,headerColor=[255,255,255],rowH=7,headerH=8,fs=8.5,hfs=8.5}=opts
  let y=startY; const tw=cw.reduce((a,b)=>a+b,0)
  rows.forEach((row,ri)=>{
    y=ck(doc,y,rowH+2); const isH=row._header,isF=row._footer,isB=row._bold,h=isH?headerH:rowH
    if(isH){doc.setFillColor(...headerBg);doc.rect(x,y,tw,h,'F')}
    else if(isF){doc.setFillColor(245,225,238);doc.rect(x,y,tw,h,'F')}
    else if(ri%2===0){doc.setFillColor(252,248,250);doc.rect(x,y,tw,h,'F')}
    doc.setDrawColor(220,200,210);doc.setLineWidth(0.15);doc.rect(x,y,tw,h)
    let cx=x; const cells=row._cells||row
    cells.forEach((cell,ci)=>{
      const al=ci===cells.length-1&&cells.length>1?'right':'left'
      doc.setFontSize(isH?hfs:fs); doc.setFont(undefined,(isH||isF||isB)?'bold':'normal')
      doc.setTextColor(...(isH?headerColor:(isF?[80,30,60]:[60,60,60])))
      const tx=al==='right'?cx+cw[ci]-2:cx+2
      doc.text(String(cell||''),tx,y+h/2+1,{align:al,maxWidth:cw[ci]-4}); cx+=cw[ci]
    }); y+=h
  }); return y
}

function secH(doc,y,t){
  y=ck(doc,y,15); doc.setFillColor(...ROSE); doc.rect(12,y-1,3,7,'F')
  doc.setFontSize(11);doc.setFont(undefined,'bold');doc.setTextColor(...ROSE);doc.text(t,18,y+4); return y+9
}
function tl(doc,y,l,v,x1=14,x2=58){
  y=ck(doc,y,6); doc.setFontSize(8);doc.setFont(undefined,'bold');doc.setTextColor(100,70,85);doc.text(l,x1,y)
  doc.setFont(undefined,'normal');doc.setTextColor(40,40,40)
  const ls=doc.splitTextToSize(String(v||'—'),135); ls.forEach((li,i)=>{doc.text(li,x2,y+i*3.5)}); return y+Math.max(4.5,ls.length*3.5+1)
}
function para(doc,y,t,mw=178){
  if(!t)return y; doc.setFontSize(8);doc.setFont(undefined,'normal');doc.setTextColor(50,50,50)
  const ls=doc.splitTextToSize(t,mw); for(const l of ls){y=ck(doc,y,5);doc.text(l,14,y);y+=3.5}; return y+1
}

// ===== Generate one scenario into the doc =====
function genScenario(doc, devis, scenarioIdx, isFirst) {
  const sc = devis.scenarios?.[scenarioIdx] || {}
  if (!isFirst) { doc.addPage() }
  drawBorder(doc)
  let y = 12

  // EN-TÊTE
  try{doc.addImage(LOGO_B64,'PNG',14,y,35,27)}catch(e){}
  doc.setFontSize(18);doc.setFont(undefined,'bold');doc.setTextColor(...ROSE)
  doc.text("DEVIS D'ASSAINISSEMENT",55,y+8)
  doc.setFontSize(9);doc.setTextColor(80,80,80);doc.setFont(undefined,'normal')
  doc.text(`N° ${devis.numeroDevis||''}`,55,y+14)
  doc.text(`Date : ${new Date(devis.dateCreation).toLocaleDateString('fr-FR')}`,55,y+19)
  if(devis.scenarios?.length>1){doc.setFontSize(9);doc.setTextColor(200,120,0);doc.setFont(undefined,'bold');doc.text(`SCÉNARIO : ${sc.scenarioNom||''}`,55,y+24)}
  doc.setFontSize(8);doc.setTextColor(120,120,120);doc.setFont(undefined,'normal')
  doc.text(ENT.nom,185,y+2,{align:'right'});doc.text(ENT.sousTitre,185,y+6,{align:'right'})
  doc.text(ENT.adresse,185,y+10,{align:'right'});doc.text(`${ENT.cp} ${ENT.ville}`,185,y+14,{align:'right'})
  doc.text(`SIRET: ${ENT.siret}`,185,y+18,{align:'right'})
  y+=32; doc.setDrawColor(...ROSE);doc.setLineWidth(0.8);doc.line(12,y,198,y); y+=6

  // CLIENT
  doc.setFillColor(252,245,248);doc.roundedRect(12,y,186,22,2,2,'F')
  doc.setDrawColor(...ROSE_LIGHT);doc.setLineWidth(0.3);doc.roundedRect(12,y,186,22,2,2)
  doc.setFontSize(9);doc.setFont(undefined,'bold');doc.setTextColor(...ROSE);doc.text('CLIENT',16,y+6)
  doc.setFontSize(9);doc.setFont(undefined,'normal');doc.setTextColor(40,40,40)
  doc.text(devis.client?.nomComplet||'',16,y+11)
  doc.text(`${devis.client?.adresse||''}, ${devis.client?.codePostal||''} ${devis.client?.ville||''}`,16,y+16)
  if(devis.client?.telephone)doc.text(`Tél: ${devis.client.telephone}`,16,y+21)
  if(devis.client?.email)doc.text(devis.client.email,130,y+11)
  y+=28

  // SECTIONS RÉDACTIONNELLES
  const secs=devis.sectionsRedactionnelles||[]
  if(secs.length>0){
    for(const s of secs){
      const txt=s.texte||s.defaut||''; if(!txt.trim())continue
      y=secH(doc,y,s.titre); y=para(doc,y,txt); y+=2
    }
    y+=3
  }

  // DESCRIPTIF TECHNIQUE
  y=secH(doc,y,'DESCRIPTIF DES TRAVAUX')
  y=tl(doc,y,'Type :',TYPES[devis.typeInstallation]||'')
  y=tl(doc,y,'Mode :',MODES[devis.modeInstallation]||'')
  y=tl(doc,y,'Modèle ANC :',devis.produitNom||'')
  // Description produit depuis la base de données
  if(devis.produitDescription){
    y=ck(doc,y,10)
    doc.setFontSize(7.5);doc.setFont(undefined,'italic');doc.setTextColor(80,80,80)
    const descLines=doc.splitTextToSize(devis.produitDescription,140)
    for(const dl of descLines){y=ck(doc,y,4);doc.text(dl,58,y);y+=3.3}
    y+=1
  }
  if(devis.tuyauxAvantFiliere>0)y=tl(doc,y,'PVC avant filière :',devis.tuyauxAvantFiliere+' ml')
  if(devis.tuyauxApresFiliere>0)y=tl(doc,y,'PVC après filière :',devis.tuyauxApresFiliere+' ml')
  if(devis.nbCoudesPVC>0)y=tl(doc,y,'Coudes PVC :',`${devis.nbCoudesPVC} × ${fmt(devis.prixCoudePVC||0)} = ${fmt(devis.nbCoudesPVC*(devis.prixCoudePVC||0))}`)
  if(devis.longueurAeration>0)y=tl(doc,y,'Tube aération :',devis.longueurAeration+' ml')
  if(devis.longueurVentilation>0){const va=devis.ventilationAerienne||0;y=tl(doc,y,'Tube ventilation :',devis.longueurVentilation+' ml'+(va>0?` (dont ${va} ml aérien)`:''))}
  y=tl(doc,y,'Rejet :',REJETS[devis.typeRejet]||devis.typeRejet||'')
  if(devis.posteRelevage){y=tl(doc,y,'Poste de relevage :','OUI');y=tl(doc,y,'Ligne électrique :',`${devis.longueurCableElec||'?'} ml + fourreau`)}
  if(devis.nbRehausses>0)y=tl(doc,y,'Rehausses :',`${devis.nbRehausses} × ${fmt(devis.prixRehausse||0)}`)
  if(devis.deconstruction)y=tl(doc,y,'Déconstruction :',`${devis.volumeDeconstruction?.toFixed(1)} m³`)

  // Épandage
  if(devis.epandage){
    y+=2;y=secH(doc,y,'ÉPANDAGE (DT 64.1)')
    y=tl(doc,y,'Surface :',`${devis.epandage.surfaceM2} m²`)
    y=tl(doc,y,'Drains :',`${devis.epandage.nbDrains} × ${devis.epandage.longueurParDrain} ml = ${devis.epandage.longueurDrainTotal} ml`)
    y=tl(doc,y,'Gravier 20/40 :',`${devis.epandage.volumeGravier} m³`)
    y=tl(doc,y,'Terre évacuée :',`${devis.epandage.terreEvacuee} m³ (foisonné: ${devis.epandage.foisonneEpandage} m³)`)
  }

  if(devis.restaurationSurface){
    y=tl(doc,y,'Restauration :','OUI')
    if(devis.restauration){
      y=tl(doc,y,'Surface restaurée :',`${devis.restauration.surfaceRestauree} m² (emprise × 3)`)
      y=tl(doc,y,'Terre végétale :',`${devis.restauration.volumeTerre} m³ × ${fmt(devis.restauration.pxTerre)}/m³ = ${fmt(devis.restauration.coutTerre)}`)
      y=tl(doc,y,'Graine gazon :',`${devis.restauration.surfaceRestauree} m² × ${fmt(devis.restauration.pxGraine)}/m² = ${fmt(devis.restauration.coutGraine)}`)
    } else if(devis.surfaceFouille>0){
      y=tl(doc,y,'Emprise fouille :',`${devis.surfaceFouille.toFixed(1)} m² (× 3 = ${(devis.surfaceFouille*3).toFixed(1)} m² restaurés)`)
      if(devis.terreVegetaleM3>0)y=tl(doc,y,'Terre végétale :',`${devis.terreVegetaleM3} m³ × ${fmt(devis.prixTerreVegetaleM3||0)}/m³`)
    }
  }
  y+=3

  // VOLUMES → supprimé du PDF client, présent uniquement dans la fiche technique

  // DÉTAIL FINANCIER (vue client : opérateurs fusionnés dans les postes)
  y=ck(doc,y,60); y=secH(doc,y,'DÉTAIL FINANCIER')
  const fr2=[
    {_header:true,_cells:['Poste','Montant HT']},
    // Terrassement = engins + gasoil + opérateur pelleur + mobilisation
    {_cells:['Terrassement',fmt(sc.coutTerrassementClient||0)]},
    // Transport évacuation = km véhicule + chauffeur
    {_cells:[`Transport évacuation (${sc.nbVoyages||0} voy.)`,fmt(sc.coutTransportClient||0)]},
  ]
  // Transport mortier = km + chauffeur mortier
  const coutMortierTranspTotal = sc.coutMortierTranspClient || 0
  if(coutMortierTranspTotal>0) fr2.push({_cells:[`Transport mortier (${sc.nbVoyMortier||0} voy.)`,fmt(coutMortierTranspTotal)]})
  // Mortier matière
  if(sc.coutMortierMatiere>0)fr2.push({_cells:[`Mortier de calage (${sc.volMortier?.toFixed(2)||0} m³)`,fmt(sc.coutMortierMatiere)]})
  // Livraison fournisseur = km + chauffeur livraison
  const coutLivraisonTotal = sc.coutLivraisonClient || 0
  if(coutLivraisonTotal>0) fr2.push({_cells:[`Livraison matériaux`,fmt(coutLivraisonTotal)]})
  // Matériel ANC principal
  fr2.push({_cells:[devis.produitNom||'Matériel ANC',fmt(sc.coutMateriel)]})
  // Produits supplémentaires
  if(sc.coutProduitsSup>0){
    if(devis.produitsSup?.length>0){
      devis.produitsSup.forEach(p=>{
        fr2.push({_cells:[p.nom,fmt(p.prixHT||0)]})
      })
    } else {
      fr2.push({_cells:['Produits supplémentaires',fmt(sc.coutProduitsSup)]})
    }
  }
  // Fournitures associées détaillées
  if(devis.produitsAssociesDetail?.length>0){
    devis.produitsAssociesDetail.forEach(f=>{
      fr2.push({_cells:[f.nom,fmt(f.prix||0)]})
    })
  } else if(devis.produitsAssocies?.length>0){
    fr2.push({_cells:['Fournitures associées',fmt(sc.coutAssocies)]})
  }
  if(devis.nbCoudesPVC>0)fr2.push({_cells:[`Coudes PVC ×${devis.nbCoudesPVC}`,fmt(devis.nbCoudesPVC*(devis.prixCoudePVC||0))]})
  if(devis.nbRehausses>0)fr2.push({_cells:[`Rehausses ×${devis.nbRehausses}`,fmt(devis.nbRehausses*(devis.prixRehausse||0))]})
  if(devis.posteRelevage&&devis.coutLigneElec>0)fr2.push({_cells:[`Ligne élec ${devis.sectionCable||4}mm² (${devis.longueurCableElec||'?'}ml) + fourreau`,fmt(devis.coutLigneElec)]})
  if(devis.epandage&&sc.coutEpandage>0)fr2.push({_cells:['Épandage (gravier + drains)',fmt(sc.coutEpandage)]})
  if(devis.restaurationSurface&&devis.coutTerreVegetale>0)fr2.push({_cells:['Restauration surface (terre + graine)',fmt(devis.coutTerreVegetale)]})
  // Main d'œuvre de pose (poseurs uniquement — pelleur et chauffeur déjà inclus ci-dessus)
  fr2.push({_cells:["Main d'œuvre de pose",fmt(sc.coutPoseur||0)]})
  fr2.push({_cells:['Dossier photographique (obligatoire)',fmt(100)]})

  // Remise
  if(sc.montantRemise>0){
    const st=sc.totalHT+sc.montantRemise
    fr2.push({_cells:['Sous-total HT',fmt(st)]})
    const lbl=devis.remisePourcent>0?`Remise ${devis.remisePourcent}%`:'Remise'
    fr2.push({_bold:true,_cells:[lbl,`- ${fmt(sc.montantRemise)}`]})
  }

  fr2.push({_footer:true,_bold:true,_cells:['TOTAL HT',fmt(sc.totalHT)]})
  fr2.push({_footer:true,_cells:['TVA (20%)',fmt(sc.totalTVA)]})
  fr2.push({_footer:true,_bold:true,_cells:['TOTAL TTC',fmt(sc.totalTTC)]})
  y=drawTable(doc,14,y,[110,70],fr2); y+=8

  // CONDITIONS PARTICULIÈRES
  y=ck(doc,y,15); y=secH(doc,y,'CONDITIONS PARTICULIÈRES')
  const condPart = [
    { num:'1', titre:'Validité du devis', txt:"Le présent devis est valable un (1) mois à compter de sa date d'émission." },
    { num:'2', titre:'Contact obligatoire avec l\'inspecteur SPANC', txt:"Le client s'engage à prendre contact impérativement avec son inspecteur SPANC avant tout démarrage. Lors de cet échange, il devra communiquer les éléments techniques que nous avons renseignés dans le devis (filière retenue, implantation, prescriptions, etc.)." },
    { num:'3', titre:'Absence d\'étude de sol (si non prévue au devis)', txt:"Lorsque le devis a été établi sans étude de sol, le client reconnaît que les conditions réelles du terrain peuvent différer des hypothèses retenues. En conséquence, en fonction de la nature des remblais et des contraintes découvertes lors de l'excavation, le client s'engage à supporter le coût des adaptations et/ou travaux complémentaires nécessaires, au moyen d'un devis ajusté correspondant aux contraintes constatées." },
    { num:'4', titre:'Dossier photo obligatoire', txt:"Un dossier photo (avant / pendant / après travaux) est obligatoire et fait partie intégrante de notre procédure de suivi et de conformité." },
    { num:'5', titre:'Raccordement électrique pour pompe(s) (si applicable)', txt:"Dans l'hypothèse où un raccordement électrique doit être réalisé pour une ou plusieurs pompes, le client s'engage à faire installer, en amont des travaux : une gaine conforme pour l'alimentation, ainsi qu'un coupe-circuit / dispositif de protection adapté, le tout dimensionné selon la puissance indiquée au devis." },
  ]
  for(const cp of condPart){
    y=ck(doc,y,14)
    doc.setFontSize(7.5);doc.setFont(undefined,'bold');doc.setTextColor(...ROSE);doc.text(`${cp.num}. ${cp.titre}`,14,y);y+=3.5
    doc.setFontSize(7);doc.setFont(undefined,'normal');doc.setTextColor(60,60,60)
    const ls=doc.splitTextToSize(cp.txt,178); for(const l of ls){y=ck(doc,y,4);doc.text(l,14,y);y+=3.2}
    y+=1.5
  }
}

// ===== FICHE TECHNIQUE ANNEXE =====
function genFicheTechnique(doc, devis) {
  doc.addPage(); drawBorder(doc)
  let y = 12

  // En-tête
  try{doc.addImage(LOGO_B64,'PNG',14,y,25,19)}catch(e){}
  doc.setFontSize(14);doc.setFont(undefined,'bold');doc.setTextColor(...ROSE)
  doc.text('FICHE TECHNIQUE',45,y+8)
  doc.setFontSize(9);doc.setTextColor(100,100,100);doc.setFont(undefined,'normal')
  doc.text(`Annexe au devis N° ${devis.numeroDevis||''}`,45,y+14)
  y+=25; doc.setDrawColor(...ROSE);doc.setLineWidth(0.5);doc.line(12,y,198,y); y+=6

  // Produit principal
  y=secH(doc,y,'PRODUIT PRINCIPAL')
  y=tl(doc,y,'Modèle :',devis.produitNom||'—')
  y=tl(doc,y,'Type :',TYPES[devis.typeInstallation]||'—')
  y=tl(doc,y,'Mode :',MODES[devis.modeInstallation]||'—')
  if(devis.produitDescription){
    y=tl(doc,y,'Description :','')
    y=para(doc,y-3,devis.produitDescription)
    y+=2
  }

  // Dimensions & volumes (fiche poseur — inclut les volumes retirés du PDF client)
  if(devis.volumeCuves>0 || devis.volumeFouille>0){
    const sc0ft = devis.scenarios?.[0]
    y=secH(doc,y,'DIMENSIONS & VOLUMES')
    const dimRows = [
      {_header:true,_cells:['Paramètre','Valeur']},
      {_cells:['Volume fouille (excavé)',`${devis.volumeFouille?.toFixed(2)||'—'} m³`]},
      {_cells:['Volume foisonné (×1.3)',`${sc0ft?.volFoison?.toFixed(2)||((devis.volumeFouille||0)*1.3).toFixed(2)} m³`]},
      {_cells:['Volume cuves (strict)',`${devis.volumeCuves?.toFixed(2)||'—'} m³`]},
      {_cells:['Volume remblais (fouille – cuves)',`${devis.volumeRemblais?.toFixed(2)||'—'} m³`]},
    ]
    if(devis.surfaceFouille>0)dimRows.push({_cells:['Surface emprise fouille',`${devis.surfaceFouille.toFixed(2)} m²`]})
    if(devis.volumeSablePVC>0){
      dimRows.push({_cells:['ML PVC enterrés',`${devis.mlPVCEnterres?.toFixed(1)||'—'} ml`]})
      dimRows.push({_cells:['Volume sable PVC',`${devis.volumeSablePVC?.toFixed(2)||'—'} m³`]})
    }
    if(devis.epandage){
      dimRows.push({_cells:['Gravier épandage 20/40',`${devis.epandage.volumeGravier} m³`]})
      dimRows.push({_cells:['Terre évacuée (épandage)',`${devis.epandage.terreEvacuee} m³`]})
    }
    y=drawTable(doc,14,y,[120,60],dimRows); y+=6
  }

  // Tuyauterie
  const hasPipes = devis.tuyauxAvantFiliere>0 || devis.tuyauxApresFiliere>0 || devis.longueurAeration>0 || devis.longueurVentilation>0
  if(hasPipes){
    y=secH(doc,y,'TUYAUTERIE')
    const pipeRows = [{_header:true,_cells:['Élément','Métrage']}]
    if(devis.tuyauxAvantFiliere>0) pipeRows.push({_cells:['PVC avant filière',`${devis.tuyauxAvantFiliere} ml`]})
    if(devis.tuyauxApresFiliere>0) pipeRows.push({_cells:['PVC après filière',`${devis.tuyauxApresFiliere} ml`]})
    if(devis.longueurAeration>0) pipeRows.push({_cells:['Tube aération',`${devis.longueurAeration} ml`]})
    if(devis.longueurVentilation>0) pipeRows.push({_cells:['Tube ventilation',`${devis.longueurVentilation} ml${devis.ventilationAerienne>0?' (dont '+devis.ventilationAerienne+' ml aérien)':''}`]})
    if(devis.nbCoudesPVC>0) pipeRows.push({_cells:['Coudes PVC',`${devis.nbCoudesPVC} unités`]})
    y=drawTable(doc,14,y,[120,60],pipeRows); y+=6
  }

  // Épandage
  if(devis.epandage){
    y=secH(doc,y,'ÉPANDAGE (DT 64.1)')
    const epRows = [
      {_header:true,_cells:['Paramètre','Valeur']},
      {_cells:['Surface épandage',`${devis.epandage.surfaceM2} m²`]},
      {_cells:['Nombre de drains',`${devis.epandage.nbDrains}`]},
      {_cells:['Longueur par drain',`${devis.epandage.longueurParDrain} ml`]},
      {_cells:['Longueur totale drains',`${devis.epandage.longueurDrainTotal} ml`]},
      {_cells:['Volume gravier 20/40',`${devis.epandage.volumeGravier} m³`]},
      {_cells:['Terre à évacuer',`${devis.epandage.terreEvacuee} m³`]},
      {_cells:['Volume foisonné',`${devis.epandage.foisonneEpandage} m³`]},
    ]
    y=drawTable(doc,14,y,[120,60],epRows); y+=6
  }

  // Options techniques
  y=secH(doc,y,'OPTIONS TECHNIQUES')
  y=tl(doc,y,'Rejet :',REJETS[devis.typeRejet]||devis.typeRejet||'—')
  if(devis.posteRelevage){
    y=tl(doc,y,'Poste relevage :','OUI')
    y=tl(doc,y,'Câble électrique :',`${devis.longueurCableElec||0} ml — section ${devis.sectionCable||4} mm²`)
  }
  if(devis.nbRehausses>0)y=tl(doc,y,'Rehausses :',`${devis.nbRehausses} unités`)
  if(devis.deconstruction)y=tl(doc,y,'Déconstruction :',`${devis.volumeDeconstruction?.toFixed(1)||'—'} m³`)
  if(devis.restaurationSurface){
    y=tl(doc,y,'Restauration surface :','OUI')
    if(devis.terreVegetaleM3>0)y=tl(doc,y,'Terre végétale :',`${devis.terreVegetaleM3} m³`)
  }

  // Transport
  if(devis.vehiculeNom || devis.distanceTransportKm>0){
    y+=2;y=secH(doc,y,'TRANSPORT ÉVACUATION')
    if(devis.vehiculeNom)y=tl(doc,y,'Véhicule :',devis.vehiculeNom)
    if(devis.distanceTransportKm>0)y=tl(doc,y,'Distance A/R :',`${(devis.distanceTransportKm*2).toFixed(1)} km`)
  }

  // Mortier
  const sc0 = devis.scenarios?.[0]
  if(sc0?.volMortier>0){
    y+=2;y=secH(doc,y,'MORTIER DE CALAGE')
    y=tl(doc,y,'Surface fouille :',`${devis.surfaceFouille?.toFixed(2)||'—'} m²`)
    y=tl(doc,y,'Épaisseur :',`${devis.epaisseurMortier||0.20} m`)
    y=tl(doc,y,'Volume mortier :',`${sc0.volMortier.toFixed(2)} m³`)
    if(devis.vehiculeMortierNom)y=tl(doc,y,'Véhicule :',devis.vehiculeMortierNom)
    if(devis.distanceMortierKm>0)y=tl(doc,y,'Distance A/R :',`${(devis.distanceMortierKm*2).toFixed(1)} km`)
    if(sc0.nbVoyMortier>0)y=tl(doc,y,'Voyages :',`${sc0.nbVoyMortier}`)
  }

  // Livraison fournisseur
  if(devis.distanceLivraisonKm>0){
    y+=2;y=secH(doc,y,'LIVRAISON FOURNISSEUR')
    if(devis.distanceLivraisonKm>0)y=tl(doc,y,'Distance A/R :',`${(devis.distanceLivraisonKm*2).toFixed(1)} km`)
  }

  // Produits supplémentaires
  if(devis.produitsSup?.length>0){
    y+=2;y=secH(doc,y,'PRODUITS SUPPLÉMENTAIRES')
    const psRows = [{_header:true,_cells:['Produit','Prix HT']}]
    devis.produitsSup.forEach(p=>psRows.push({_cells:[p.nom,fmt(p.prixHT||0)]}))
    y=drawTable(doc,14,y,[140,40],psRows)
  }

  // Main d'œuvre détaillée
  if(sc0?.mainOeuvre){
    y+=2;y=ck(doc,y,50);y=secH(doc,y,"DÉCOMPOSITION DES COÛTS")
    // Engin + sol info
    if(sc0.enginNom) y=tl(doc,y,'Engin :',`${sc0.enginNom} (${sc0.rendementEffectif} m³/h effectif)`)
    if(sc0.typeSolNom) y=tl(doc,y,'Type de sol :',`${sc0.typeSolNom} (×${sc0.multiplicateur})`)
    if(sc0.hEnginMin>0) y=tl(doc,y,'Heures engin facturées :',`${sc0.hEnginMin}h (${sc0.joursEngin} jour${sc0.joursEngin>1?'s':''})`)
    const mo=sc0.mainOeuvre
    const moRows = [
      {_header:true,_cells:['Poste','Durée']},
    ]
    if(mo.hExcav>0)moRows.push({_cells:['Excavation (pelleur)',`${mo.hExcav}h`]})
    if(mo.hPellisteAttenteEvac>0)moRows.push({_cells:['Attente pelliste (pendant transport)',`${mo.hPellisteAttenteEvac}h`]})
    if(mo.hChauffeurEvac>0)moRows.push({_cells:[`Chauffeur évacuation (${mo.nbVoyEvac} voy. × ${mo.hParVoyEvac}min)`,`${mo.hChauffeurEvac}h`]})
    if(mo.hChauffeurMortier>0)moRows.push({_cells:[`Chauffeur mortier (${mo.nbVoyMortier} voy. × ${mo.hParVoyMortier}min)`,`${mo.hChauffeurMortier}h`]})
    if(mo.hChauffeurLivraison>0)moRows.push({_cells:['Chauffeur livraison',`${mo.hChauffeurLivraison}h`]})
    if(mo.hPVC>0)moRows.push({_cells:['Tuyauterie PVC',`${mo.hPVC}h`]})
    if(mo.hCoudes>0)moRows.push({_cells:['Collage coudes',`${mo.hCoudes}h`]})
    moRows.push({_cells:['Pose cuves',`${mo.hPoseCuves}h`]})
    if(mo.hRemblaiCuves>0)moRows.push({_cells:[`Remblai cuves (×${devis.nbCuves||1})`,`${mo.hRemblaiCuves}h`]})
    if(mo.hVentilation>0)moRows.push({_cells:['Ventilation aérienne',`${mo.hVentilation}h`]})
    if(mo.hRestauration>0)moRows.push({_cells:['Restauration pelouse',`${mo.hRestauration}h`]})
    moRows.push({_footer:true,_bold:true,_cells:[`Total poseur (×${mo.nbPoseurs} sur site)`,`${mo.hPoseDuree}h → coût ${mo.hPoseCout}h`]})
    moRows.push({_footer:true,_bold:true,_cells:['Durée totale chantier',`${mo.totalH}h — ${mo.totalJours} jour(s)`]})
    y=drawTable(doc,14,y,[130,50],moRows)
  }

  // Fournitures associées
  if(devis.produitsAssocies?.length>0){
    y+=2;y=secH(doc,y,'FOURNITURES ASSOCIÉES')
    const faRows = [{_header:true,_cells:['Fourniture','Inclus']}]
    devis.produitsAssocies.forEach(p=>faRows.push({_cells:[p,'✓']}))
    y=drawTable(doc,14,y,[150,30],faRows)
  }
}

// ===== FICHE TECHNIQUE PRODUIT (annexe obligatoire devis client) =====
function genFicheTechniqueProduit(doc, devis) {
  doc.addPage(); drawBorder(doc)
  let y = 12

  try{doc.addImage(LOGO_B64,'PNG',14,y,25,19)}catch(e){}
  doc.setFontSize(14);doc.setFont(undefined,'bold');doc.setTextColor(...ROSE)
  doc.text('FICHE TECHNIQUE PRODUIT',45,y+8)
  doc.setFontSize(9);doc.setTextColor(100,100,100);doc.setFont(undefined,'normal')
  doc.text(`Annexe au devis N° ${devis.numeroDevis||''}`,45,y+14)
  y+=25; doc.setDrawColor(...ROSE);doc.setLineWidth(0.5);doc.line(12,y,198,y); y+=6

  y=secH(doc,y,'PRODUIT INSTALLÉ')
  y=tl(doc,y,'Modèle :',devis.produitNom||'—')
  y=tl(doc,y,'Type :',TYPES[devis.typeInstallation]||'—')
  y=tl(doc,y,'Mode :',MODES[devis.modeInstallation]||'—')
  if(devis.produitDescription){
    y=tl(doc,y,'Description :','')
    y=para(doc,y-3,devis.produitDescription)
    y+=2
  }

  // Dimensions cuves
  if(devis.volumeCuves>0 || devis.volumeFouille>0){
    y=secH(doc,y,'CARACTÉRISTIQUES TECHNIQUES')
    const rows = [{_header:true,_cells:['Paramètre','Valeur']}]
    if(devis.volumeCuves>0) rows.push({_cells:['Volume cuves',`${devis.volumeCuves.toFixed(2)} m³`]})
    if(devis.volumeFouille>0) rows.push({_cells:['Volume fouille requis',`${devis.volumeFouille.toFixed(2)} m³`]})
    if(devis.surfaceFouille>0) rows.push({_cells:['Surface emprise',`${devis.surfaceFouille.toFixed(2)} m²`]})
    if(devis.profondeur>0) rows.push({_cells:['Profondeur',`${devis.profondeur} m`]})
    rows.push({_cells:['Rejet',REJETS[devis.typeRejet]||devis.typeRejet||'—']})
    if(devis.posteRelevage) rows.push({_cells:['Poste de relevage','OUI']})
    if(devis.nbRehausses>0) rows.push({_cells:['Rehausses',`${devis.nbRehausses} unité(s)`]})
    y=drawTable(doc,14,y,[120,60],rows); y+=6
  }

  // Tuyauterie
  const hasPipes = devis.tuyauxAvantFiliere>0 || devis.tuyauxApresFiliere>0
  if(hasPipes){
    y=secH(doc,y,'TUYAUTERIE ASSOCIÉE')
    const pRows = [{_header:true,_cells:['Élément','Métrage']}]
    if(devis.tuyauxAvantFiliere>0) pRows.push({_cells:['PVC avant filière',`${devis.tuyauxAvantFiliere} ml`]})
    if(devis.tuyauxApresFiliere>0) pRows.push({_cells:['PVC après filière',`${devis.tuyauxApresFiliere} ml`]})
    if(devis.nbCoudesPVC>0) pRows.push({_cells:['Coudes PVC',`${devis.nbCoudesPVC}`]})
    y=drawTable(doc,14,y,[120,60],pRows); y+=6
  }

  // Épandage
  if(devis.epandage){
    y=secH(doc,y,'ÉPANDAGE')
    y=tl(doc,y,'Surface :',`${devis.epandage.surfaceM2} m²`)
    y=tl(doc,y,'Drains :',`${devis.epandage.nbDrains} × ${devis.epandage.longueurParDrain} ml`)
    y=tl(doc,y,'Gravier 20/40 :',`${devis.epandage.volumeGravier} m³`)
  }

  // Note conformité
  y+=4;y=ck(doc,y,15)
  doc.setFillColor(252,245,248);doc.roundedRect(12,y,186,12,2,2,'F')
  doc.setDrawColor(...ROSE);doc.setLineWidth(0.3);doc.roundedRect(12,y,186,12,2,2)
  doc.setFontSize(7);doc.setFont(undefined,'italic');doc.setTextColor(100,70,85)
  doc.text("Ce matériel est conforme aux normes en vigueur et dispose d'un agrément ministériel. Consulter la fiche fabricant pour les détails complets.",16,y+5)
  doc.text("L'installation sera réalisée conformément aux préconisations du fabricant, du SPANC et de l'étude de sol.",16,y+9)
}

// ===== CONDITIONS GÉNÉRALES DE VENTE =====
function genCGV(doc) {
  doc.addPage(); drawBorder(doc)
  let y = 12

  try{doc.addImage(LOGO_B64,'PNG',14,y,25,19)}catch(e){}
  doc.setFontSize(14);doc.setFont(undefined,'bold');doc.setTextColor(...ROSE)
  doc.text('CONDITIONS GÉNÉRALES DE VENTE',45,y+8)
  doc.setFontSize(7);doc.setTextColor(100,100,100);doc.setFont(undefined,'normal')
  doc.text(`${ENT.nom} — ${ENT.adresse}, ${ENT.cp} ${ENT.ville} — SIRET: ${ENT.siret}`,45,y+13)
  y+=22; doc.setDrawColor(...ROSE);doc.setLineWidth(0.5);doc.line(12,y,198,y); y+=5

  doc.setFontSize(6.5);doc.setFont(undefined,'normal');doc.setTextColor(50,50,50)
  const intro = `Les présentes Conditions Générales de Vente (CGV) régissent l'ensemble des relations contractuelles entre ${ENT.nom} (ci-après « la Société ») et ses clients (ci-après « le Client »). Toute commande implique l'acceptation sans réserve des présentes CGV.`
  const introL=doc.splitTextToSize(intro,180); for(const l of introL){y=ck(doc,y,3.5);doc.text(l,14,y);y+=3}; y+=2

  const articles = [
    { titre:'Article 1 : Objet', txt:"Les présentes CGV s'appliquent à toutes les ventes de matériels (micro-stations, fosses septiques, filtres compacts) et prestations de services liées à l'installation, la pose, l'entretien, la réparation ou le diagnostic de systèmes d'Assainissement Non Collectif (ANC), conformément à la réglementation française (arrêté du 7 septembre 2009 modifié). Les prestations incluent : étude de sol, conception, pose, mise en service, vidange, curage, inspection, dépannage." },
    { titre:'Article 2 : Devis et Commande', txt:"Toute prestation fait l'objet d'un devis gratuit, valable 1 mois. Le devis est établi sous réserve de difficultés imprévues (amiante, calcaire, racines, anomalies de sol) qui seront facturées en sus après accord du Client. La commande est ferme à la signature du devis avec mention « Bon pour accord ». La Société peut refuser une commande pour tout motif légitime." },
    { titre:'Article 3 : Prix et Paiement', txt:"Les prix sont indiqués en euros HT, majorés de la TVA en vigueur. Acompte de 30% à 50% à la commande (selon devis > 500€ HT). Solde à la réception des travaux par chèque, virement ou carte bancaire. Toute heure commencée (>10 min) est due intégralement. Retard de paiement : pénalités de 3 fois le taux d'intérêt légal + indemnité forfaitaire de 40€ (art. L.441-10 C. com.). Suspension des prestations et exigibilité immédiate de toutes sommes dues." },
    { titre:'Article 4 : Exécution et Livraison', txt:"Délais indicatifs et non garantis. Obligation de moyens dans les règles de l'art (NF DTU 64.1). Le Client doit coopérer pleinement (accès libre, informations précises, fourniture eau/électricité). La pose respecte les normes (étude de sol, agrément SPANC). La Société n'est pas responsable des non-conformités préexistantes. Réception par PV contradictoire signé ; sans réserves écrites, travaux réputés conformes." },
    { titre:'Article 5 : Garanties et Responsabilités', txt:"Garanties légales : conformité 2 ans (neuf), 1 an (occasion), vices cachés (art. 1641 C. civil). Exclues : usure normale, mauvaise utilisation, manque d'entretien. Responsabilité limitée aux dommages directs causés par faute prouvée, plafonnée au montant HT de la commande. Exclus : dommages indirects, vices cachés des installations existantes, anomalies de sol. La Société est assurée en RC professionnelle." },
    { titre:'Article 6 : Réserve de Propriété', txt:"Les matériels restent propriété de la Société jusqu'au paiement intégral (art. 2367 C. civil). Risques transférés au Client dès la livraison/pose." },
    { titre:'Article 7 : Droit de Rétractation', txt:"Délai de 14 jours (consommateurs uniquement). Exclu pour : urgences, prestations exécutées avec renoncement exprès, produits personnalisés (ANC sur mesure). Remboursement intégral hors frais de retour si produit intact." },
    { titre:'Article 8 : Force Majeure', txt:"Exonération en cas d'événement imprévisible et insurmontable (grève, intempéries, pandémie, pénurie). Suspension ou annulation sans indemnité si > 15 jours." },
    { titre:'Article 9 : Propriété Intellectuelle et Données', txt:"Plans, études et devis restent propriété de la Société. Données personnelles traitées conformément au RGPD." },
    { titre:'Article 10 : Litiges', txt:"Tout litige relève du tribunal de commerce de Toulouse. Loi française applicable. Clause pénale : 10% du montant HT en cas de non-respect par le Client." },
  ]

  for(const art of articles){
    y=ck(doc,y,12)
    doc.setFontSize(7);doc.setFont(undefined,'bold');doc.setTextColor(...ROSE);doc.text(art.titre,14,y);y+=3
    doc.setFontSize(6.3);doc.setFont(undefined,'normal');doc.setTextColor(50,50,50)
    const ls=doc.splitTextToSize(art.txt,180); for(const l of ls){y=ck(doc,y,3);doc.text(l,14,y);y+=2.8}
    y+=1.5
  }

  // Signature
  y=ck(doc,y,20); y+=3
  doc.setDrawColor(...ROSE);doc.setLineWidth(0.3);doc.line(12,y,198,y); y+=4
  doc.setFontSize(7);doc.setFont(undefined,'italic');doc.setTextColor(80,80,80)
  doc.text("Le Client reconnaît avoir reçu et accepté les présentes CGV.",14,y); y+=5
  doc.setFontSize(7);doc.setFont(undefined,'normal');doc.setTextColor(60,60,60)
  doc.text('Date :  ___/___/______',14,y)
  doc.text('Signature du Client (précédée de la mention « Bon pour accord ») :',90,y); y+=15
  doc.setDrawColor(180,180,180);doc.setLineWidth(0.2);doc.rect(90,y-10,100,12)
}

// ===== FICHE POSEUR (PDF séparé avec QR + procédure) =====
function genFichePoseur(doc, devis, qrDataUrl) {
  doc.addPage(); drawBorder(doc)
  let y = 12

  try{doc.addImage(LOGO_B64,'PNG',14,y,25,19)}catch(e){}
  doc.setFontSize(14);doc.setFont(undefined,'bold');doc.setTextColor(...ROSE)
  doc.text('DOSSIER INSTALLATEUR',45,y+8)
  doc.setFontSize(9);doc.setTextColor(100,100,100);doc.setFont(undefined,'normal')
  doc.text(`Devis N° ${devis.numeroDevis||''} — ${devis.client?.nomComplet||''}`,45,y+14)
  y+=25; doc.setDrawColor(...ROSE);doc.setLineWidth(0.5);doc.line(12,y,198,y); y+=6

  // Procédure de connexion
  y=secH(doc,y,'PROCÉDURE D\'ACCÈS AU DOSSIER TECHNIQUE')
  doc.setFillColor(252,245,248);doc.roundedRect(12,y,186,38,2,2,'F')
  doc.setDrawColor(...ROSE);doc.setLineWidth(0.3);doc.roundedRect(12,y,186,38,2,2)
  y+=4
  doc.setFontSize(8.5);doc.setFont(undefined,'bold');doc.setTextColor(...ROSE)
  doc.text('📱 Pour accéder à votre dossier technique en ligne :',16,y);y+=5
  doc.setFontSize(8);doc.setFont(undefined,'normal');doc.setTextColor(50,50,50)
  const steps = [
    '1. Scannez le QR code ci-dessous avec votre téléphone',
    '   OU rendez-vous sur : ' + (typeof window !== 'undefined' ? window.location.origin : 'https://app.farbrum.fr') + '/chantier/' + devis.id,
    '2. Entrez votre code PIN personnel (fourni par l\'administrateur)',
    '3. Vous accédez à la fiche de suivi du chantier avec :',
    '   — Les étapes de pose à suivre dans l\'ordre',
    '   — La prise de photos obligatoire à chaque étape',
    '   — Les détails techniques (volumes, distances, matériaux)',
  ]
  steps.forEach(s=>{doc.text(s,16,y);y+=3.5})
  y+=4

  // QR Code
  if(qrDataUrl){
    y=ck(doc,y,55)
    doc.setFontSize(9);doc.setFont(undefined,'bold');doc.setTextColor(...ROSE)
    doc.text('QR CODE — ACCÈS CHANTIER',105,y,{align:'center'});y+=4
    try{doc.addImage(qrDataUrl,'PNG',72,y,66,66)}catch(e){}
    y+=70
    doc.setFontSize(7);doc.setTextColor(120,120,120);doc.setFont(undefined,'italic')
    doc.text('Scannez ce QR code pour accéder au dossier technique en ligne.',105,y,{align:'center'});y+=5
  }

  // Puis on insère la fiche technique chantier complète
  genFicheTechnique(doc, devis)
}

export const pdfService = {
  // Génère un PDF CLIENT : scénario + fiche technique produit + CGV (SANS fiche technique chantier)
  genererDevisPDF(devis, scenarioIdx=0) {
    try {
      const doc = new jsPDF()
      genScenario(doc, devis, scenarioIdx, true)
      genFicheTechniqueProduit(doc, devis)
      genCGV(doc)
      const pages=doc.internal.getNumberOfPages()
      for(let i=1;i<=pages;i++){doc.setPage(i);drawBorder(doc);drawPageNum(doc,i,pages);drawFooter(doc)}
      return doc
    } catch(err){ console.error('Erreur PDF:',err); alert('Erreur PDF : '+err.message); return null }
  },

  // Génère un PDF CLIENT combiné avec TOUS les scénarios + fiche produit + CGV
  genererCombinePDF(devis) {
    try {
      const doc = new jsPDF()
      const nbSc = devis.scenarios?.length || 1
      for(let i = 0; i < nbSc; i++){
        genScenario(doc, devis, i, i === 0)
      }
      genFicheTechniqueProduit(doc, devis)
      genCGV(doc)
      const pages=doc.internal.getNumberOfPages()
      for(let i=1;i<=pages;i++){doc.setPage(i);drawBorder(doc);drawPageNum(doc,i,pages);drawFooter(doc)}
      return doc
    } catch(err){ console.error('Erreur PDF combiné:',err); alert('Erreur PDF combiné : '+err.message); return null }
  },

  // Génère un PDF POSEUR : dossier installateur + QR code + procédure + fiche technique chantier
  async genererFichePoseurPDF(devis) {
    try {
      const { generateQRDataUrl, buildChantierUrl } = await import('../components/QRCode')
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.farbrum.fr'
      const url = buildChantierUrl(baseUrl, devis.id)
      const qrDataUrl = await generateQRDataUrl(url, 200)
      const doc = new jsPDF()
      drawBorder(doc)
      genFichePoseur(doc, devis, qrDataUrl)
      const pages=doc.internal.getNumberOfPages()
      for(let i=1;i<=pages;i++){doc.setPage(i);drawBorder(doc);drawPageNum(doc,i,pages);drawFooter(doc)}
      return doc
    } catch(err){ console.error('Erreur PDF poseur:',err); alert('Erreur PDF poseur : '+err.message); return null }
  },

  telechargerPDF(d,i=0){const doc=this.genererDevisPDF(d,i);if(!doc)return;const s=d.scenarios?.length>1?'_'+(d.scenarios[i]?.scenarioId||i):'';doc.save(`Devis_${d.numeroDevis||'X'}${s}.pdf`)},
  ouvrirPDF(d,i=0){const doc=this.genererDevisPDF(d,i);if(!doc)return;try{const b=doc.output('blob'),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(u)},1000)}catch(e){this.telechargerPDF(d,i)}},
  telechargerTousScenarios(d){if(!d.scenarios)return;d.scenarios.forEach((_,i)=>setTimeout(()=>this.telechargerPDF(d,i),i*600))},

  // Combiner tous les scénarios dans un seul PDF
  combinerPDF(d){
    const doc=this.genererCombinePDF(d)
    if(!doc)return
    doc.save(`Devis_${d.numeroDevis||'X'}_COMPLET.pdf`)
  },

  // PDF Poseur : télécharger
  async telechargerFichePoseur(d){
    const doc=await this.genererFichePoseurPDF(d)
    if(!doc)return
    doc.save(`Fiche_Poseur_${d.numeroDevis||'X'}.pdf`)
  },

  // PDF Poseur : ouvrir dans un nouvel onglet
  async ouvrirFichePoseur(d){
    const doc=await this.genererFichePoseurPDF(d)
    if(!doc)return
    try{const b=doc.output('blob'),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(u)},1000)}catch(e){await this.telechargerFichePoseur(d)}
  },
}
