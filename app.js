/* Dashboard Sekolah Padat Selangor 2026 — static GitHub Pages app. */
'use strict';
let all = [], filtered = [], page = 1, charts = {}, map, group, showCluster = true, districtLayer = null, pbtLayer = null, districtGeo = null, pbtGeo = null, schoolLayerEnabled = true;
const $ = id => document.getElementById(id);
const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const count = (arr,key) => arr.reduce((acc,r) => (acc[String(r[key]??'').trim()] = (acc[String(r[key]??'').trim()]||0)+1,acc),{});
const sum = (arr,k) => arr.reduce((s,r)=>s+(Number(r[k])||0),0);
const fmt = n=>new Intl.NumberFormat('ms-MY').format(n);
const normalize = s=>String(s??'').toLocaleLowerCase('ms');
const coords = r => Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude)) && Number(r.latitude)>1 && Number(r.latitude)<7 && Number(r.longitude)>99 && Number(r.longitude)<104;
const sortedCounts = obj=>Object.entries(obj).filter(([k])=>k).sort((a,b)=>b[1]-a[1]);
function fillSelect(id, vals){const el=$(id);for(const value of vals){const op=document.createElement('option');op.value=value;op.textContent=value;el.appendChild(op)}}
function setup(){
 fillSelect('fDistrict', [...new Set(all.map(r=>r.DAERAH))].sort((a,b)=>a.localeCompare(b,'ms')));
 fillSelect('fPBT', [...new Set(all.map(r=>String(r.PBT||'').trim()))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'ms')));
 fillSelect('fGeran', [...new Set(all.map(r=>String(r['Status Geran']||'').trim()))].filter(Boolean).sort());
 for(const id of ['fDistrict','fPBT','fJenis','fGeran','fPemutihan','search']) $(id).addEventListener(id==='search'?'input':'change',()=>{page=1;render()});
 $('reset').onclick=()=>{for(const id of ['fDistrict','fPBT','fJenis','fGeran','fPemutihan','search'])$(id).value='';page=1;render()};
 $('export').onclick=exportCSV;
 const sideDownload=$('sideDownload');
 if(sideDownload)sideDownload.addEventListener('click',e=>{e.preventDefault();exportCSV()});
 document.querySelectorAll('.school-sidebar .side-link:not(#sideDownload)').forEach(link=>{
  link.addEventListener('click',()=>{
   document.querySelectorAll('.school-sidebar .side-link').forEach(a=>a.classList.remove('active'));
   link.classList.add('active');
   if(link.getAttribute('href')==='#taburan')setTimeout(()=>map?.invalidateSize(),350);
  });
 });

 $('pageSize').onchange=()=>{page=1;renderTable()};
 $('prev').onclick=()=>{page=Math.max(1,page-1);renderTable()};
 $('next').onclick=()=>{page=Math.min(Math.ceil(filtered.length/Number($('pageSize').value))||1,page+1);renderTable()};
 $('zoomAll').onclick=fitMarkers;
 $('fitBoundary').onclick=fitBoundaries;
 $('showDistrictBoundary').onchange=syncLayers;
 $('showPBTBoundary').onchange=syncLayers;
 $('showSchools').onchange=()=>{schoolLayerEnabled=$('showSchools').checked;syncLayers()};
 $('toggleHeat').onclick=()=>{showCluster=!showCluster;renderMap();$('toggleHeat').textContent='◉ Paparan kluster: '+(showCluster?'aktif':'tidak aktif')};
 map=L.map('map',{zoomControl:true,scrollWheelZoom:false}).setView([3.2,101.5],9);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(map);
 initBoundaryLayers();
 setTimeout(()=>map.invalidateSize(),250);
 render();
}
function getFiltered(){const d=$('fDistrict').value,pbt=$('fPBT').value,j=$('fJenis').value,g=$('fGeran').value,p=$('fPemutihan').value,q=normalize($('search').value).trim();return all.filter(r=>(!d||r.DAERAH===d)&&(!pbt||r.PBT===pbt)&&(!j||r['SK/SMK']===j)&&(!g||String(r['Status Geran']).trim()===g)&&(!p||normalize(r.Pemutihan).trim()===p)&&(!q||[r.nama,r.DAERAH,r.PBT,r['MUKIM / PEKAN / BANDAR'],r['NO LOT/PT']].some(v=>normalize(v).includes(q))))}
function render(){filtered=getFiltered();renderKPIs();renderMap();renderGraphs();renderFacilities();renderRanks();renderNotes();renderTable()}
function renderKPIs(){const c=filtered.filter(coords).length;const figures=[['🏫','Jumlah Sekolah',filtered.length,'Rekod dalam penapis'],['📍','Daerah Terlibat',new Set(filtered.map(r=>r.DAERAH)).size,'Daripada 9 daerah Selangor'],['🎓','Sekolah Rendah (SK)',filtered.filter(r=>r['SK/SMK']==='SK').length,'Kategori sekolah'],['🏛','Sekolah Menengah (SMK)',filtered.filter(r=>r['SK/SMK']==='SMK').length,'Kategori sekolah'],['🛠','Perlu Pemutihan',filtered.filter(r=>normalize(r.Pemutihan)==='perlu').length,'Sekolah ditanda perlu']];$('kpis').innerHTML=figures.map(([icon,label,value,sub])=>`<article class="kpi"><span class="kpi-icon">${icon}</span><div><div class="kpi-label">${label}</div><div class="kpi-number">${fmt(value)}</div><div class="kpi-sub">${sub}</div></div></article>`).join('');$('coordBadge').textContent=c+' / '+filtered.length+' koordinat';}
function renderMap(){if(group)map.removeLayer(group);group=showCluster?L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:38}):L.layerGroup();for(const r of filtered.filter(coords)){
 const color=r['SK/SMK']==='SMK'?'#f97316':'#2563eb'; const icon=L.divIcon({className:'school-map-icon',html:`<span style="display:block;width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 1px ${color}55,0 2px 5px #0003"></span>`,iconSize:[14,14],iconAnchor:[7,7]}); const marker=L.marker([r.latitude,r.longitude],{icon});
 const google=`https://www.google.com/maps?q=${encodeURIComponent(r.latitude+','+r.longitude)}`;
 const detail=`<strong>${safe(r.nama||'Nama tidak direkod')}</strong><br/>Daerah: ${safe(r.DAERAH)}<br/>Jenis: ${safe(r['SK/SMK'])}<br/>PBT: ${safe(r.PBT)}<br/>Status Geran: ${safe(r['Status Geran'])}<br/>Pemutihan: ${safe(r.Pemutihan)}<br/>Latitude: ${safe(r.latitude)}<br/>Longitude: ${safe(r.longitude)}<br/><a target="_blank" rel="noopener noreferrer" href="${google}">Buka Google Maps ↗</a>`;
 marker.bindPopup(detail);group.addLayer(marker);
 }if(schoolLayerEnabled)group.addTo(map);fitMarkers();}
function fitMarkers(){const pts=filtered.filter(coords).map(r=>[r.latitude,r.longitude]);if(pts.length)map.fitBounds(L.latLngBounds(pts).pad(.13),{maxZoom:13});else map.setView([3.2,101.5],9)}
// GeoJSON menggunakan CRS84 (longitude, latitude); Leaflet membaca terus koordinatnya.
function initBoundaryLayers(){
 const sources=[['data/sempadan-daerah.geojson','district'],['data/sempadan-pbt.geojson','pbt']];
 Promise.all(sources.map(([path])=>fetch(path).then(r=>{if(!r.ok)throw Error(path+' HTTP '+r.status);return r.json()}))).then(([daerah,pbt])=>{
  districtGeo=daerah; pbtGeo=pbt;
  districtLayer=L.geoJSON(daerah,{style:districtStyle,onEachFeature:(feature,layer)=>boundaryPopup(feature,layer,'Daerah')});
  pbtLayer=L.geoJSON(pbt,{style:pbtStyle,onEachFeature:(feature,layer)=>boundaryPopup(feature,layer,'PBT')});
  syncLayers();fitBoundaries();
 }).catch(err=>{
  console.error('Gagal memuat GeoJSON',err);
  document.querySelector('.map-footer').insertAdjacentHTML('beforeend',`<span style="color:#b91c1c;font-size:12px">Sempadan gagal dimuat: ${safe(err.message)}</span>`)
 });
}
function districtStyle(){return {color:'#155e75',weight:2.3,opacity:0.95,fillColor:'#0ea5e9',fillOpacity:0.08}}
function pbtStyle(){return {color:'#f59e0b',weight:2.1,opacity:0.95,dashArray:'6 5',fillColor:'#fbbf24',fillOpacity:0.055}}
function boundaryPopup(feature,layer,label){
 const name=String(feature.properties?.web_name||feature.properties?.NAMA_PBT||'Tidak diketahui');
 layer.bindTooltip(name,{sticky:true,className:'boundary-tooltip'});
 layer.bindPopup(`<strong>${safe(label)}: ${safe(name)}</strong><br/>Lapisan sempadan rasmi dalam fail GeoJSON yang dibekalkan.`);
 layer.on('mouseover',e=>e.target.setStyle({weight:4,fillOpacity:0.2}));
 layer.on('mouseout',e=>{if(label==='Daerah')districtLayer?.resetStyle(e.target);else pbtLayer?.resetStyle(e.target)});
}
function syncLayers(){
 for(const [layer,checkbox] of [[districtLayer,'showDistrictBoundary'],[pbtLayer,'showPBTBoundary']]){
  if(!layer)continue; if($(checkbox).checked&&!map.hasLayer(layer))layer.addTo(map);
  else if(!$(checkbox).checked&&map.hasLayer(layer))map.removeLayer(layer);
 }
 if(group){if(schoolLayerEnabled&&!map.hasLayer(group))group.addTo(map);if(!schoolLayerEnabled&&map.hasLayer(group))map.removeLayer(group)}
 if(group&&map.hasLayer(group))group.bringToFront?.();
}
function fitBoundaries(){
 const bounds=districtLayer?.getBounds();if(bounds?.isValid())map.fitBounds(bounds.pad(.045));else fitMarkers();
}
/* Efek kedalaman 3D untuk dua carta donut, bukan untuk graf lain */
/* Donut premium: bulatan kekal 1:1, efek kedalaman lembut dan jumlah di tengah */
const premiumSchoolDonut = {
 id:'premiumSchoolDonut',
 afterDatasetsDraw(chart){
  if(!['typeChart','grantChart','whiteChart'].includes(chart.canvas.id))return;
  const arcs=chart.getDatasetMeta(0)?.data;
  if(!arcs?.length)return;
  const p=arcs[0].getProps(['x','y','innerRadius'],true);
  const total=chart.data.datasets[0].data.reduce((sum,n)=>sum+(Number(n)||0),0);
  const ctx=chart.ctx;
  ctx.save();
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#172441';ctx.font='800 23px Inter, sans-serif';
  ctx.fillText(new Intl.NumberFormat('ms-MY').format(total),p.x,p.y-5);
  ctx.fillStyle='#8b7469';ctx.font='600 10px Inter, sans-serif';
  ctx.fillText('sekolah',p.x,p.y+15);
  ctx.restore();
 }
};
Chart.register(premiumSchoolDonut);
function chart(id,type,labels,values,colors,opts={}){
 if(charts[id])charts[id].destroy();
 const isDonut=type==='doughnut';
 const premium=['typeChart','grantChart','whiteChart'].includes(id);
 charts[id]=new Chart($(id),{
  type,
  data:{labels,datasets:[{
   data:values,
   backgroundColor:colors,
   borderColor:isDonut?'#fff':undefined,
   borderWidth:isDonut?3:0,
   hoverOffset:premium?5:0,
   spacing:premium?1:0,
   borderRadius:isDonut?0:5,
   barThickness:21
  }]},
  options:{
   responsive:true,maintainAspectRatio:false,
   rotation:isDonut?-90:undefined,circumference:isDonut?360:undefined,
   cutout:isDonut?(premium?'57%':'72%'):undefined,
   layout:premium?{padding:7}:{},
   animation:{duration:450},
   plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${c.formattedValue} sekolah`}}},
   scales:isDonut?{}:{
    x:{grid:{display:false},ticks:{font:{size:10},maxRotation:38,minRotation:20}},
    y:{beginAtZero:true,ticks:{precision:0,stepSize:10},grid:{color:'#edf2f8'}}
   },
   ...opts
  }
 });
}
function donutLegend(id,labels,vals,colors){const total=vals.reduce((a,b)=>a+b,0);$(id).innerHTML=labels.map((x,i)=>`<div class="legend-item"><span><i class="swatch" style="background:${colors[i]}"></i>${safe(x)}</span><b>${fmt(vals[i])} <small>(${total?(100*vals[i]/total).toFixed(1):'0'}%)</small></b></div>`).join('')}
function renderGraphs(){const districts=sortedCounts(count(filtered,'DAERAH'));chart('districtChart','bar',districts.map(x=>x[0]),districts.map(x=>x[1]),['#df3344','#ef642c','#f39c28','#d9b42a','#7cb84b','#42a88b','#3895aa','#4380ca','#8160b8']);
 const types=['SK','SMK'],tc=types.map(x=>filtered.filter(r=>r['SK/SMK']===x).length),tcol=['#e43647','#ffad25'];chart('typeChart','doughnut',types,tc,tcol);donutLegend('typeLegend',types,tc,tcol);
 const names=['ada geran','tiada geran','tiada data geran'],gc=names.map(x=>filtered.filter(r=>normalize(r['Status Geran'])===x).length),gcol=['#19a782','#f18b2c','#f7c75c'];chart('grantChart','doughnut',['Ada Geran','Tiada Geran','Tiada Data Geran'],gc,gcol);donutLegend('grantLegend',['Ada Geran','Tiada Geran','Tiada Data'],gc,gcol);
 const wc=['perlu','tiada'].map(x=>filtered.filter(r=>normalize(r.Pemutihan)===x).length),wcol=['#e94e6e','#2380f4'];chart('whiteChart','doughnut',['Perlu','Tiada'],wc,wcol);donutLegend('whiteLegend',['Perlu','Tiada'],wc,wcol);}
function renderFacilities(){const items=[['Bilik Darjah Perdana','BD Perdana'],['Bilik Darjah PPKI','BD PPKI'],['Tandas','Tandas'],['DTSB','DTSB'],['Jenis Aliran','Jenis Aliran']];$('facilities').innerHTML=items.map(([label,key])=>`<div class="facility"><span>${label}</span><strong>${fmt(sum(filtered,key))}</strong></div>`).join('')}
/* Logo rasmi boleh diletakkan dalam assets/pbt/ tanpa ubah kod.
   Singkatan dipaparkan apabila logo rasmi belum tersedia. */
const pbtLogoMap={
 'Majlis Bandaraya Diraja Klang':['MBDK','assets/pbt/mbdk.webp'],
 'Majlis Perbandaran Kajang':['MPKj','assets/pbt/mpkj.webp'],
 'Majlis Perbandaran Selayang':['MPS','assets/pbt/mps.webp'],
 'Majlis Perbandaran Kuala Langat':['MPKL','assets/pbt/mpkl.webp'],
 'Majlis Perbandaran Sepang':['MPSepang','assets/pbt/mpsepang.webp']
};
function renderRanks(){
 const list=sortedCounts(count(filtered,'PBT')).slice(0,5),max=list[0]?.[1]||1;
 $('pbtRanking').innerHTML=list.length?'<div class="pbt-rank-list">'+list.map(([n,c],i)=>{
  const item=pbtLogoMap[n]||[String(n).split(/\s+/).map(x=>x[0]).slice(0,4).join('').toUpperCase(),''];
  const short=item[0],src=item[1];
  const logo=src?`<img loading="lazy" src="${safe(src)}" alt="Logo ${safe(n)}" onload="this.previousElementSibling.style.display='none'" onerror="this.remove()">`:'';
  return `<div class="pbt-rank-card rank-tier-${i+1}">
   <span class="rank-order" aria-label="Kedudukan ${i+1}">${i+1}</span>
   <span class="pbt-logo-circle"><span class="pbt-logo-fallback">${safe(short)}</span>${logo}</span>
   <span class="pbt-rank-info"><strong class="pbt-rank-name">${safe(n)}</strong>
    <span class="pbt-rank-track"><span class="pbt-rank-fill" style="width:${Math.round(c/max*100)}%"></span></span>
   </span><span class="pbt-rank-total">${fmt(c)}<small> sekolah</small></span>
  </div>`;
 }).join('')+'</div>':'<p style="padding:16px">Tiada rekod untuk penapis ini.</p>';
}
function renderNotes(){
 const cards=[
  ['Ada Geran',filtered.filter(r=>normalize(r['Status Geran'])==='ada geran').length,'success','📜'],
  ['Tiada Geran',filtered.filter(r=>normalize(r['Status Geran'])==='tiada geran').length,'warning','📋'],
  ['Mesyuarat 20A Bil. 8',filtered.filter(r=>Number(r['Bil Mesy 20A'])===8).length,'meeting','🗓️'],
  ['Mesyuarat 20A Bil. 3',filtered.filter(r=>Number(r['Bil Mesy 20A'])===3).length,'meeting','🏛️']
 ];
 $('notes').innerHTML=cards.map(([label,v,cls,icon])=>`<div class="detail-card ${cls}"><span class="summary-stat-icon" aria-hidden="true">${icon}</span><strong>${fmt(v)}</strong><small>${safe(label)}</small></div>`).join('');
}
function badge(s){const t=normalize(s);return t.includes('tiada data')?'gray':t.includes('tiada')&&t.includes('geran')?'red':t.includes('perlu')?'red':t.includes('ada geran')?'green':t==='tiada'?'green':'orange'}
function renderTable(){const size=Number($('pageSize').value),totalPage=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,totalPage);const start=(page-1)*size,rs=filtered.slice(start,start+size);$('schoolRows').innerHTML=rs.map(r=>{const url=`https://www.google.com/maps?q=${encodeURIComponent(r.latitude+','+r.longitude)}`;return `<tr><td>${r.BIL}</td><td class="schoolname">${safe(r.nama)}</td><td>${safe(r.DAERAH)}</td><td>${safe(r.PBT)}</td><td>${safe(r['SK/SMK'])}</td><td>${r.latitude??'—'}</td><td>${r.longitude??'—'}</td><td><span class="pill ${badge(r['Status Geran'])}">${safe(r['Status Geran'])}</span></td><td><span class="pill ${badge(r.Pemutihan)}">${safe(r.Pemutihan)}</span></td><td>${fmt(Number(r['BD Perdana'])||0)}</td><td>${fmt(Number(r['BD PPKI'])||0)}</td><td><a class="maplink" target="_blank" rel="noopener noreferrer" href="${url}">Lihat ↗</a></td></tr>`}).join('')||'<tr><td colspan="12">Tiada sekolah yang sepadan dengan penapis.</td></tr>';$('tableCount').textContent=`${filtered.length} rekod`;$('pageInfo').textContent=`Halaman ${page} / ${totalPage}`;$('prev').disabled=page<=1;$('next').disabled=page>=totalPage;}
function exportCSV(){const fields=['BIL','nama','DAERAH','MUKIM / PEKAN / BANDAR','PBT','SK/SMK','latitude','longitude','Status Geran','Pemutihan','BD Perdana','BD PPKI','Tandas','DTSB','Jenis Aliran','Bil Mesy 20A','NO HAKMILIK','NO LOT/PT'];const escape=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const csv='\ufeff'+[fields.map(escape).join(','),...filtered.map(r=>fields.map(k=>escape(r[k])).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='sekolah-padat-selangor-2026.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
fetch('data/sekolah.json').then(resp=>{if(!resp.ok)throw Error('HTTP '+resp.status);return resp.json()}).then(data=>{all=data;setup()}).catch(err=>{document.querySelector('main').insertAdjacentHTML('afterbegin',`<div style="padding:20px;background:#fee2e2;border-radius:12px;color:#991b1b">Data gagal dimuat (${safe(err.message)}). Jalankan melalui GitHub Pages atau pelayan web tempatan; jangan buka terus menggunakan file://.</div>`);console.error(err)});
