(function(){try{const s=JSON.parse(localStorage.getItem('bi_a365_state'));if(s&&s.tema)document.documentElement.setAttribute('data-theme',s.tema);}catch(e){}}());
// STATE
let rawData=[],filteredData=[];
let activeBucket='',activeMotivo='',activeEspec='';
let activeTiposOS = new Set();
const sel={regiao:new Set(),cidade:new Set(),tipo:new Set()};

const BKEYS=['0-2','3-6','7-15','15+'];
const BLABELS=['0-2 dias','3-6 dias','7-15 dias','+15 dias'];
const BCOLORS={
  '0-2':'#2db86a',
  '3-6':'#4d9fdd',
  '7-15':'#e08c00',
  '15+':'#e05050'
};
const MCOLORS=['#005BAC','#F5B400','#2db86a','#e05050','#8b5cf6','#0ea5e9'];

let bucketChart,motivoChart;

fetch('/api/controle-os')
.then(r => r.json())
.then(data => {

    if(!Array.isArray(data) || !data.length){
      const m = document.getElementById('metaInfo');
      if(m) m.innerHTML = '<span style="color:#e08c00">⚠ Sem dados carregados</span>';
      toast('Nenhum dado encontrado. Faça upload em /upload.', 'err');
      return;
    }

    rawData = data.map(norm).filter(Boolean);

    activeBucket = '';
    activeMotivo = '';

    sel.regiao.clear();
    sel.cidade.clear();
    sel.tipo.clear();

    setupFilters();
    loadState();
    applyFilters();

    // Atualiza box de meta no sidebar
    fetch('/api/meta/controle-os').then(r=>r.json()).then(meta=>{
      const m = document.getElementById('metaInfo');
      if(m && meta && meta.atualizado_em){
        m.innerHTML =
          '<strong>' + (meta.registros||0).toLocaleString('pt-BR') + ' O.S</strong><br>' +
          'Atualizado em ' + meta.atualizado_em + '<br>' +
          '<span style="font-size:10px">' + (meta.arquivo||'') + '</span>';
      }
    }).catch(()=>{});

    toast(
        `✓ ${rawData.length.toLocaleString('pt-BR')} registros carregados`,
        'ok'
    );

})
.catch(err => {

    const m = document.getElementById('metaInfo');
    if(m) m.innerHTML = '<span style="color:#e05050">✗ Erro ao carregar</span>';

    toast(
        'Erro ao carregar dados.',
        'err'
    );

    console.error(err);

});
function norm(r){
const tipoOsMap = {
  'Nova instalação':'Instalação',
  'A365 Reativação Contratual':'Instalação',
  'A365 Repareamento':'Instalação',
  'A365 Troca de Tecnologia':'Instalação',

  'A365 Manutenção Técnica':'Manutenção',
  'A365 Intrusão':'Manutenção',
  'A365 Reentrega':'Manutenção',
  'A365 Remanejar Equipamento':'Manutenção',
  'Falha de comunicação de dispositivo':'Manutenção',
  'Falha de comunicação de central':'Manutenção',
  'A365 Mudança de Endereço':'Manutenção',

  'A365 - Cancelamento por Inadimplência':'Desinstalação',
  'A365 Retirada de Equipamentos':'Desinstalação',
  'A365 Troca de Titularidade':'Desinstalação',
  'Cancelamento de contrato':'Desinstalação'
};

const tipoOS = tipoOsMap[r['Defeito']] ?? 'Manutenção';
  const os = String(
    r['Nº OS']
    || r['N° OS']
    || r['OS']
    || Object.values(r)[0]
    || ''
  ).toUpperCase();

  if(os && os.includes('AVERAGE')) return null;

  const tech = String(
    r['Téc. Executor']
    || r['Técnico Executor']
    || ''
  ).trim();

  const dias = parseInt(
    String(
      r['# Dias (Bruto)']
      ?? r['#Dias']
      ?? r['Dias']
      ?? 0
    ).replace(/\D/g,'')
  ) || 0;

  let b='0-2';

  if(dias<=2) b='0-2';
  else if(dias<=6) b='3-6';
  else if(dias<=15) b='7-15';
  else b='15+';

  const sigla = String(
    r['Regional']
    || ''
  ).trim();

  return{
    'Nº OS': r['Nº OS'] ?? '',
    'Téc. Executor': tech,
    'Sigla': sigla,

    'Cidade': r['Cidade'] ?? '',
    'Regional': sigla,

    'Defeito': r['Defeito'] ?? '',

    '# Dias (Bruto)': dias,

    'Bucket': b,

    'Abertura': r['Abertura'] ?? '',
    'Agendamento': r['Agendamento'] ?? '',

    'Pausada?': r['Pausada?'] ?? '',
    'Mot. Pausa': r['Mot. Pausa'] ?? '',

    'Fantasia': r['Fantasia'] ?? '',
    'Conta': r['Conta'] ?? '',
    'TipoOS': tipoOS,
  };
}
// MULTISELECT
function uniq(key){return[...new Set(rawData.map(x=>x[key]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));}

function buildMs(id,key,placeholder){
  const wrap=document.getElementById('ms-'+id);
  const btn=wrap.querySelector('.ms-btn');
  const dd=document.getElementById('dd-'+id);
  const srch=document.getElementById('srch-'+id);
  const itemsEl=document.getElementById('items-'+id);
  const allEl=document.getElementById('all-'+id);
  const cbAll=document.getElementById('cb-all-'+id);
  const cnt=document.getElementById('cnt-'+id);
  const tags=document.getElementById('tags-'+id);
  const set=sel[id];

  function renderItems(filter=''){
    const vals=uniq(key);
    itemsEl.innerHTML='';
    vals.filter(v=>v.toLowerCase().includes(filter.toLowerCase())).forEach(v=>{
      const div=document.createElement('div');
      div.className='ms-item'+(set.has(v)?' checked':'');
      div.innerHTML=`<div class="ms-cb"></div><span class="ms-label" title="${esc(v)}">${esc(v)}</span>`;
      div.addEventListener('click',()=>{
        if(set.has(v))set.delete(v);else set.add(v);
        div.classList.toggle('checked',set.has(v));
        updateBtn();applyFilters();
      });
      itemsEl.appendChild(div);
    });
    const allSelected=vals.length>0&&vals.every(v=>set.has(v));
    cbAll.style.background=allSelected?'var(--blue)':'';
    cbAll.style.borderColor=allSelected?'var(--blue)':'';
    cbAll.innerHTML=allSelected?'<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>':'<span></span>';
  }

  function updateBtn(){
    const text=btn.querySelector('.ms-text');
    if(set.size===0){text.textContent=placeholder;cnt.classList.add('hidden');}
    else{text.textContent=`${set.size} selecionado${set.size>1?'s':''}`;cnt.textContent=set.size;cnt.classList.remove('hidden');}
    // tags
    tags.innerHTML=[...set].map(v=>`<div class="atag" data-v="${esc(v)}"><span title="${esc(v)}">${esc(v.length>20?v.slice(0,18)+'…':v)}</span><span class="atag-x" data-id="${id}" data-v="${esc(v)}">×</span></div>`).join('');
    tags.querySelectorAll('.atag-x').forEach(x=>x.addEventListener('click',e=>{
      e.stopPropagation();set.delete(x.dataset.v);updateBtn();applyFilters();renderItems(srch.value);
    }));
  }

  allEl.addEventListener('click',()=>{
    const vals=uniq(key);
    if(vals.every(v=>set.has(v))){set.clear();}else{vals.forEach(v=>set.add(v));}
    renderItems(srch.value);updateBtn();applyFilters();
  });

  btn.addEventListener('click',e=>{
    e.stopPropagation();
    const wasOpen=dd.classList.contains('show');
    // Fechar todos os dropdowns abertos
    document.querySelectorAll('.ms-dropdown.show').forEach(d=>d.classList.remove('show'));
    document.querySelectorAll('.ms-btn.open').forEach(b=>b.classList.remove('open'));
    // Abrir este, só se estava fechado
    if(!wasOpen){dd.classList.add('show');btn.classList.add('open');srch.focus();renderItems();}
  });
  srch.addEventListener('input',()=>renderItems(srch.value));
  document.addEventListener('click',e=>{if(!wrap.contains(e.target)){dd.classList.remove('show');btn.classList.remove('open');}});

  return{render:renderItems,update:updateBtn};
}

const msRegiao=buildMs('regiao','Regional','Todas as regiões');
const msCidade=buildMs('cidade','Cidade','Todas as cidades');
const msTipo=buildMs('tipo','Defeito','Todos os motivos');

function setupFilters(){
  msRegiao.render();msRegiao.update();
  msCidade.render();msCidade.update();
  msTipo.render();msTipo.update();
}

function applyFilters(){
  filteredData=rawData.filter(r=>{
    const bOk=!activeBucket||r['Bucket']===activeBucket;
    const mOk=!activeMotivo||r['Defeito']===activeMotivo;
    const eOk=!activeEspec||r['Téc. Executor']===activeEspec;
    const rOk=sel.regiao.size===0||sel.regiao.has(r['Regional']);
    const cOk=sel.cidade.size===0||sel.cidade.has(r['Cidade']);
    const tOk=sel.tipo.size===0||sel.tipo.has(r['Defeito']);
    const tosOk =
    activeTiposOS.size===0 ||
    activeTiposOS.has(r['TipoOS']);
    return bOk&&mOk&&eOk&&rOk&&cOk&&tOk&&tosOk;
  });
  updateFilterUI();renderAll();
  saveState();;
}

function updateFilterUI(){
  const ind=document.getElementById('filterIndicator');
  const lbl=document.getElementById('filterLabel');
  const dot=document.getElementById('filterDot');
  document.querySelectorAll('.bpill').forEach(p=>p.classList.toggle('active',p.dataset.b===activeBucket));
  document.querySelectorAll('.kpi[data-bucket]').forEach(k=>{
    const b=k.dataset.bucket;
    k.classList.toggle('active-kpi',activeBucket!==''&&b===activeBucket);
  });
  const hasExtra=activeBucket||activeMotivo;
  if(hasExtra){
    ind.classList.add('show');
    const parts=[];
    if(activeBucket){parts.push(activeBucket);dot.style.background=BCOLORS[activeBucket]||'var(--blue)';}
    if(activeMotivo){parts.push(activeMotivo);}
    lbl.textContent=`Filtrando: ${parts.join(' · ')} · ${filteredData.length.toLocaleString('pt-BR')} OS`;
  }else{ind.classList.remove('show');}
}

function animN(el,t){const s=+(el.dataset.v||0),t0=performance.now();const go=n=>{const p=Math.min((n-t0)/500,1),e=1-Math.pow(1-p,3);el.textContent=Math.round(s+(t-s)*e).toLocaleString('pt-BR');if(p<1)requestAnimationFrame(go);};el.dataset.v=t;requestAnimationFrame(go);}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function dark(){return document.documentElement.getAttribute('data-theme')==='dark';}

function renderKPIs(){
 const bc={
  '0-2':0,
  '3-6':0,
  '7-15':0,
  '15+':0

};
document.getElementById('headerCount').textContent=
  filteredData.length.toLocaleString('pt-BR')+' OS';


// Contadores dos tipos de OS
['Instalação','Manutenção','Desinstalação'].forEach(t=>{

  const btn = document.querySelector(
    '.tos-btn[data-tos="'+t+'"]'
  );

  if(!btn) return;

  const cnt = rawData.filter(
    r => r['TipoOS'] === t
  ).length;

  const icon =
    t === 'Instalação' ? '📦' :
    t === 'Manutenção' ? '🔧' :
    '🗑️';

  btn.innerHTML =
    `${icon} ${t} <span style="opacity:.7;font-weight:400">(${cnt})</span>`;

});
  const base=rawData.filter(r=>(!activeEspec||r['Téc. Executor']===activeEspec)&&(sel.regiao.size===0||sel.regiao.has(r['Regional']))&&(sel.cidade.size===0||sel.cidade.has(r['Cidade']))&&(sel.tipo.size===0||sel.tipo.has(r['Defeito'])));
  base.forEach(r=>bc[r['Bucket']]++);
  animN(document.getElementById('kpiTotal'),filteredData.length);
  animN(document.getElementById('kpi31'),bc['15+']);
  animN(document.getElementById('kpi07'),bc['0-2']);
  animN(document.getElementById('kpiTechs'),new Set(filteredData.map(r=>r['Téc. Executor']).filter(Boolean)).size);
  document.getElementById('headerCount').textContent=filteredData.length.toLocaleString('pt-BR')+' OS';
}

function renderTable(){
  const m=new Map();
  filteredData.forEach(r=>{const k=r['Téc. Executor']||'—';if(!m.has(k))m.set(k,{t:k,c:0,s:r['Sigla']||''});m.get(k).c++;});
  const rows=[...m.values()].sort((a,b)=>b.c-a.c);
  document.getElementById('techPill').textContent=rows.length+' técnico'+(rows.length!==1?'s':'');
  const max=rows[0]?.c||1;
  if(!rows.length){document.getElementById('techBody').innerHTML=`<tr><td colspan="4"><div class="emp"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/></svg>Sem resultados</div></td></tr>`;return;}
  document.getElementById('techBody').innerHTML=rows.map((r,i)=>{
    const rc=i===0?'r1':i===1?'r2':i===2?'r3':'';
    const isAct=activeEspec===r.t;
    return`<tr class="${isAct?'espec-active':''}" data-espec="${esc(r.t)}" title="Clique para filtrar por ${esc(r.t)}"><td><span class="rk ${rc}">${i+1}</span></td><td title="${esc(r.t)}">${esc(r.t)}<span class="bari" style="width:${Math.round((r.c/max)*60)}px"></span></td><td>${r.c}</td><td><span class="stag">${esc(r.s)}</span></td></tr>`;
  }).join('');
}

function renderOS(){
  document.getElementById('osPill').textContent=filteredData.length.toLocaleString('pt-BR');
  const items=filteredData.slice(0,Math.max(100,filteredData.length));
  document.getElementById('osList').innerHTML=items.length
    ?items.map(r=>{const v=String(r['Nº OS']);return `<div class="osc" data-os="${v}">${esc(v)}</div>`;}).join('')
    :`<div style="grid-column:1/-1" class="emp"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>Sem dados</div>`;
}

function renderBucket(){
  const base=rawData.filter(r=>(!activeMotivo||r['Defeito']===activeMotivo)&&(!activeEspec||r['Téc. Executor']===activeEspec)&&(sel.regiao.size===0||sel.regiao.has(r['Regional']))&&(sel.cidade.size===0||sel.cidade.has(r['Cidade']))&&(sel.tipo.size===0||sel.tipo.has(r['Defeito'])));
  const cnt = {
  '0-2': 0,
  '3-6': 0,
  '7-15': 0,
  '15+': 0
};
  base.forEach(r=>cnt[r['Bucket']]++);
  const vals=BKEYS.map(k=>cnt[k]);
  const tc=dark()?'#7a8aa0':'#5a6e8a';
  const gc=dark()?'rgba(255,255,255,.05)':'rgba(0,91,172,.06)';
  const bgColors=BKEYS.map((k,i)=>{const hex=BCOLORS[k];const a=activeBucket===''||activeBucket===k?1:.35;return a<1?hex+Math.round(a*255).toString(16).padStart(2,'0'):hex;});
  if(bucketChart)bucketChart.destroy();
  bucketChart=new Chart(document.getElementById('bucketChart'),{
    type:'bar',
    data:{labels:BLABELS,datasets:[{data:vals,backgroundColor:bgColors,borderRadius:7,borderSkipped:false}]},
    options:{
      responsive:true,maintainAspectRatio:false,
      onClick:(e,els)=>{if(!els.length)return;const b=BKEYS[els[0].index];activeBucket=activeBucket===b?'':b;applyFilters();},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw.toLocaleString('pt-BR')} OS`}}},
      scales:{x:{grid:{display:false},ticks:{color:tc,font:{weight:'700',size:12}},border:{display:false}},y:{beginAtZero:true,grid:{color:gc},ticks:{color:tc},border:{display:false}}},
      animation:{duration:300}
    },
    plugins:[{id:'lbl',afterDatasetsDraw(ch){const{ctx}=ch;ctx.save();ctx.font='700 12px Inter';ctx.textAlign='center';ctx.fillStyle=dark()?'#b0bfcf':'#5a6e8a';ch.getDatasetMeta(0).data.forEach((b,i)=>{if(vals[i]>0)ctx.fillText(vals[i].toLocaleString('pt-BR'),b.x,b.y-8);});ctx.restore();}}]
  });
  document.getElementById('bucketChart').style.cursor='pointer';
}


// Mapa de cores fixas por nome do motivo (garante cor consistente ao filtrar)
const _motivoColorMap={};
let _motivoColorCounter=0;
function MOTIVO_COLOR_IDX(label){
  if(!(_motivoColorMap.hasOwnProperty(label))){
    _motivoColorMap[label]=_motivoColorCounter++;
  }
  return _motivoColorMap[label];
}
function renderMotivo(){
  const cnt={};filteredData.forEach(r=>{const d=r['Defeito']||'Outros';cnt[d]=(cnt[d]||0)+1;});
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const lc=dark()?'#b0bfcf':'#5a6e8a';
  if(motivoChart)motivoChart.destroy();
  if(!top.length){motivoChart=null;return;}
  motivoChart=new Chart(document.getElementById('motivoChart'),{
    type:'doughnut',
    data:{labels:top.map(([k])=>k.length>28?k.slice(0,26)+'…':k),datasets:[{data:top.map(([,v])=>v),backgroundColor:top.map(([k],i)=>{const hex=MCOLORS[MOTIVO_COLOR_IDX(k)%MCOLORS.length];const a=activeMotivo===''||activeMotivo===k?1:.4;return a<1?hex+Math.round(a*255).toString(16).padStart(2,'0'):hex;}),borderWidth:2,borderColor:dark()?'#161d2a':'#fff',hoverOffset:8}]},
    options:{
      responsive:true,maintainAspectRatio:false,cutout:'60%',
      onClick:(e,els)=>{if(!els.length){activeMotivo='';applyFilters();return;}const m=top[els[0].index][0];activeMotivo=activeMotivo===m?'':m;applyFilters();},
      plugins:{legend:{position:'right',labels:{color:lc,font:{size:11,weight:'600'},boxWidth:10,padding:10,usePointStyle:true,pointStyleWidth:8}},tooltip:{callbacks:{label:ctx=>` ${ctx.raw.toLocaleString('pt-BR')} OS (${((ctx.raw/(filteredData.length||1))*100).toFixed(1)}%)`}}},
      animation:{duration:300}
    }
  });
  document.getElementById('motivoChart').style.cursor='pointer';
}

function toggleTipoOS(t){

  if(activeTiposOS.has(t))
    activeTiposOS.delete(t);
  else
    activeTiposOS.add(t);

  document.querySelectorAll('.tos-btn').forEach(btn=>{
    btn.classList.toggle(
      'tos-active',
      activeTiposOS.has(btn.dataset.tos)
    );
  });

  applyFilters();

}
// ── LOCALSTORAGE ──
const LS_KEY = 'bi_a365_state';

function saveState(){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify({
      tema: document.documentElement.getAttribute('data-theme') || 'dark',
      bucket: activeBucket,
      motivo: activeMotivo,
      regiao: [...sel.regiao],
      cidade: [...sel.cidade],
      tipo:   [...sel.tipo]
    }));
  }catch(e){}
}

function loadState(){
  try{
    const s = JSON.parse(localStorage.getItem(LS_KEY));
    if(!s) return;
    // Tema
    if(s.tema){
      document.documentElement.setAttribute('data-theme', s.tema);
      const btn = document.getElementById('themeToggle');
      if(btn) btn.innerHTML = s.tema === 'light'
        ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
    // Filtros
    activeBucket = s.bucket || '';
    activeMotivo = s.motivo || '';
    if(Array.isArray(s.regiao)) s.regiao.forEach(v=>sel.regiao.add(v));
    if(Array.isArray(s.cidade)) s.cidade.forEach(v=>sel.cidade.add(v));
    if(Array.isArray(s.tipo))   s.tipo.forEach(v=>sel.tipo.add(v));
  }catch(e){}
}


function checkXlsxFreshness(){
  // Pegar a data mais recente do campo Abertura nos dados
  let maxDate = null;
  rawData.forEach(r => {
    const raw = r['Abertura'];
    if(!raw) return;
    // Tentar parsear — pode vir como string dd/mm/yyyy ou número serial Excel
    let d = null;
    if(typeof raw === 'number'){
      // Serial date Excel
      d = new Date(Math.round((raw - 25569) * 86400 * 1000));
    } else {
      const str = String(raw).trim();
      // dd/mm/yyyy ou dd/mm/yyyy hh:mm
      const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if(m) d = new Date(+m[3], +m[2]-1, +m[1]);
      else { d = new Date(str); }
    }
    if(d && !isNaN(d) && (!maxDate || d > maxDate)) maxDate = d;
  });

  const badge = document.getElementById('xlsxStatus');
  if(!maxDate){ badge.style.display='none'; return; }

  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  maxDate.setHours(0,0,0,0);
  const diffDias = Math.floor((hoje - maxDate) / (1000*60*60*24));

  const dtStr = maxDate.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'});
  badge.style.display = 'inline-block';

  if(diffDias === 0){
    badge.style.background = '#2db86a';
    badge.style.color = '#fff';
    badge.textContent = '✓ Atualizado hoje';
  } else if(diffDias <= 1){
    badge.style.background = '#2db86a';
    badge.style.color = '#fff';
    badge.textContent = `✓ Atualizado ontem`;
  } else if(diffDias <= 3){
    badge.style.background = '#e08c00';
    badge.style.color = '#fff';
    badge.textContent = `⚠ ${diffDias}d sem atualizar (${dtStr})`;
  } else {
    badge.style.background = '#e05050';
    badge.style.color = '#fff';
    badge.textContent = `✗ Desatualizado — ${diffDias}d (${dtStr})`;
  }
}

function renderAll(){renderKPIs();renderTable();renderOS();renderBucket();renderMotivo();}
// Clique no técnico / EPV
document.getElementById('techBody').addEventListener('click', (e) => {

  const tr = e.target.closest('tr[data-espec]');
  if(!tr) return;

  const espec = tr.dataset.espec;

  // Toggle do filtro
  activeEspec = activeEspec === espec ? '' : espec;

  applyFilters();

});
// KPI click
document.querySelectorAll('.kpi[data-bucket]').forEach(card=>{
  card.addEventListener('click',()=>{const b=card.dataset.bucket;activeBucket=b===''?'':activeBucket===b?'':b;applyFilters();});
});
// Bucket pills
document.querySelectorAll('.bpill').forEach(p=>p.addEventListener('click',()=>{activeBucket=activeBucket===p.dataset.b?'':p.dataset.b;applyFilters();}));
// Clear bucket
document.getElementById('clearBucketBtn').addEventListener('click',()=>{activeBucket='';activeMotivo='';activeEspec='';applyFilters();});
// Reset
document.getElementById('resetBtn').addEventListener('click',()=>{activeBucket='';activeMotivo='';activeEspec='';sel.regiao.clear();sel.cidade.clear();sel.tipo.clear();setupFilters();applyFilters();saveState();});
// Export
document.getElementById('exportBtn').addEventListener('click',()=>{
  if(!filteredData.length){toast('Nenhum dado para exportar.','err');return;}
  const h=['Nº OS','Téc. Executor','Sigla','Cidade','Regional','Defeito','# Dias (Bruto)','Bucket','Abertura','Agendamento','Pausada?','Mot. Pausa','Fantasia','Conta'];
  const lines=[h.join(';')];
  filteredData.forEach(r=>lines.push(h.map(k=>`"${String(r[k]??'').replace(/"/g,'""')}"`).join(';')));
  const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='os-filtradas.csv';a.click();URL.revokeObjectURL(a.href);
  toast(`✓ ${filteredData.length.toLocaleString('pt-BR')} registros exportados`,'ok');
});

// Theme
document.getElementById('themeToggle').addEventListener('click',()=>{
  const root=document.documentElement;const next=root.getAttribute('data-theme')==='dark'?'light':'dark';root.setAttribute('data-theme',next);
  document.getElementById('themeToggle').innerHTML=next==='light'
    ?`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    :`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  if(filteredData.length){renderBucket();renderMotivo();}
  saveState();
});
function toast(msg,type){const t=document.getElementById('toast');t.textContent=msg;t.className=`show ${type}`;clearTimeout(t._t);t._t=setTimeout(()=>{t.className='';},3200);}
renderAll();


document.getElementById('osList').addEventListener('click', function(e){
  const card = e.target.closest('.osc');
  if(!card) return;
  const val = card.getAttribute('data-os') || card.textContent.trim();
  const ta = document.createElement('textarea');
  ta.value = val;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch(err){}
  document.body.removeChild(ta);
  if(ok){
    card.classList.add('copied');
    toast('OS ' + val + ' copiada!', 'ok');
    setTimeout(()=>card.classList.remove('copied'), 1200);
  } else if(navigator.clipboard){
    navigator.clipboard.writeText(val).then(()=>{
      card.classList.add('copied');
      toast('OS ' + val + ' copiada!', 'ok');
      setTimeout(()=>card.classList.remove('copied'), 1200);
    }).catch(()=>toast('Erro ao copiar.','err'));
  } else {
    toast('Erro ao copiar.','err');
  }
});