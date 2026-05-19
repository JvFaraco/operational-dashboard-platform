(function(){try{const s=JSON.parse(localStorage.getItem('bi_recred_state'));if(s&&s.tema)document.documentElement.setAttribute('data-theme',s.tema);}catch(e){}}());

// ── STATE ─────────────────────────────────────────────────────────────────────
let rawData=[], filteredData=[];
let activeBucket='', activePausada='', activeEspec='';
const sel={regiao:new Set()};
let bucketChart=null, regionalChart=null;

const BKEYS=['0-2','3-6','7-15','15+'];
const BLABELS=['0-2 dias','3-6 dias','7-15 dias','+15 dias'];
const BCOLORS={'0-2':'#2db86a','3-6':'#4d9fdd','7-15':'#e08c00','15+':'#e05050'};
const LS_KEY='bi_recred_state';

// ── LOAD ──────────────────────────────────────────────────────────────────────
fetch('/api/recred')
.then(r=>r.json())
.then(data=>{
  if(!Array.isArray(data)||!data.length){
    const m=document.getElementById('metaInfo');
    if(m)m.innerHTML='<span style="color:#e08c00">⚠ Sem dados carregados</span>';
    toast('Nenhum dado encontrado. Faça upload em /upload.','err');
    return;
  }
  rawData=data.map(norm).filter(Boolean);
  setupFilters();
  loadState();
  applyFilters();

  fetch('/api/meta/controle-os').then(r=>r.json()).then(meta=>{
    const m=document.getElementById('metaInfo');
    if(m&&meta&&meta.atualizado_em){
      m.innerHTML=
        '<strong>'+(meta.registros||0).toLocaleString('pt-BR')+' O.S total</strong><br>'+
        'Atualizado em '+meta.atualizado_em+'<br>'+
        '<span style="font-size:10px">'+(meta.arquivo||'')+'</span>';
    }
    checkFreshness(meta);  // ← usa a data real do upload, não os dados
  }).catch(()=>{});

  toast('✓ '+rawData.length.toLocaleString('pt-BR')+' O.S RECRED carregadas','ok');
})
.catch(err=>{
  const m=document.getElementById('metaInfo');
  if(m)m.innerHTML='<span style="color:#e05050">✗ Erro ao carregar</span>';
  toast('Erro ao carregar dados.','err');
  console.error(err);
});

// ── REGIONAL A PARTIR DO NOME DO TÉCNICO ─────────────────────────────────────
// Padrão do nome: REGIONAL - A365 - EPV - Nome (separador " - ")
// Ignora siglas de tipo e pega a primeira sigla pura que restar.
const IGNORAR_SIGLAS = new Set(['EPV','PJ','COMERCIAL','RESTANTE','CLT','TERC']);

function extrairRegional(nome){
  if(!nome) return '—';
  const upper = nome.trim().toUpperCase();
  if(!upper.includes('A365')) return '—';
  const partes = upper.split(/[\s_\-]+/);
  for(const p of partes){
    if(/^[A-Z]{2,5}$/.test(p) && !IGNORAR_SIGLAS.has(p)) return p;
  }
  return '—';
}

// ── NORM ──────────────────────────────────────────────────────────────────────
function norm(r){
  const os=String(r['Nº OS']||'').toUpperCase();
  if(!os||os.includes('AVERAGE'))return null;

  const dias=parseInt(String(r['# Dias (Bruto)']??r['#Dias']??0).replace(/\D/g,''))||0;
  let b='0-2';
  if(dias<=2)b='0-2';
  else if(dias<=6)b='3-6';
  else if(dias<=15)b='7-15';
  else b='15+';

  const multa=typeof r['Multa']==='number'?r['Multa']:null;
  const diasSusp=typeof r['Dias Suspenso']==='number'?r['Dias Suspenso']:null;
  const tec=String(r['Téc. Executor']||'').trim();
  return{
    'Nº OS':os,
    'Téc. Executor':tec,
    'Regional':extrairRegional(tec),
    'Cidade':String(r['Cidade']||'').trim(),
    'Pausada?':String(r['Pausada?']||'NÃO').trim(),
    'Mot. Pausa':String(r['Mot. Pausa']||'').trim(),
    'Abertura':r['Abertura']??'',
    '# Dias (Bruto)':dias,
    'Bucket':b,
    'Multa':multa,
    'Dias Suspenso':diasSusp,
    'Fantasia':String(r['Fantasia']||'').trim(),
    'Conta':String(r['Conta']||'').trim(),
  };
}

// ── FILTERS ───────────────────────────────────────────────────────────────────
function applyFilters(){
  filteredData=rawData.filter(r=>{
    const bOk=!activeBucket||r['Bucket']===activeBucket;
    const pOk=!activePausada||r['Pausada?']===activePausada;
    const eOk=!activeEspec||r['Téc. Executor']===activeEspec;
    const rOk=sel.regiao.size===0||sel.regiao.has(r['Regional']);
    return bOk&&pOk&&eOk&&rOk;
  });
  updateFilterUI();
  renderAll();
  saveState();
}

function togglePausada(v){
  activePausada=activePausada===v?'':v;
  document.querySelectorAll('.pause-btn').forEach(b=>
    b.classList.toggle('pause-active',b.dataset.p===activePausada)
  );
  applyFilters();
}

function updateFilterUI(){
  // bucket pills
  document.querySelectorAll('.bpill').forEach(p=>p.classList.toggle('active',p.dataset.b===activeBucket));
  document.querySelectorAll('.kpi[data-bucket]').forEach(k=>
    k.classList.toggle('active-kpi',activeBucket!==''&&k.dataset.bucket===activeBucket)
  );
  // indicator bar
  const ind=document.getElementById('filterIndicator');
  const lbl=document.getElementById('filterLabel');
  const dot=document.getElementById('filterDot');
  const parts=[];
  if(activeBucket){parts.push(activeBucket+' dias');dot.style.background=BCOLORS[activeBucket]||'var(--accent)';}
  if(activePausada){parts.push('Pausada: '+activePausada);}
  if(activeEspec){parts.push(activeEspec.split('-').pop().trim());}
  if(sel.regiao.size){parts.push(sel.regiao.size+' regional'+(sel.regiao.size>1?'is':''));}
  if(parts.length){
    ind.classList.add('show');
    lbl.textContent='Filtrando: '+parts.join(' · ')+' · '+filteredData.length.toLocaleString('pt-BR')+' OS';
  }else{
    ind.classList.remove('show');
  }
}

// ── RENDER KPIs ───────────────────────────────────────────────────────────────
function animN(el,t,prefix='',suffix=''){
  const s=+(el.dataset.v||0);
  const t0=performance.now();
  const go=n=>{
    const p=Math.min((n-t0)/500,1),e=1-Math.pow(1-p,3);
    const v=Math.round(s+(t-s)*e);
    el.textContent=prefix+v.toLocaleString('pt-BR')+suffix;
    if(p<1)requestAnimationFrame(go);
  };
  el.dataset.v=t;
  requestAnimationFrame(go);
}

function renderKPIs(){
  const total=filteredData.length;
  const pausadas=filteredData.filter(r=>r['Pausada?']==='SIM').length;
  const mais15=filteredData.filter(r=>r['Bucket']==='15+').length;
  const exposicao=filteredData.reduce((s,r)=>s+(r['Multa']||0),0);
  const comSusp=filteredData.filter(r=>r['Dias Suspenso']!=null);
  const mediaSusp=comSusp.length?Math.round(comSusp.reduce((s,r)=>s+r['Dias Suspenso'],0)/comSusp.length):0;

  animN(document.getElementById('kpiTotal'),total);
  animN(document.getElementById('kpi15'),mais15);
  animN(document.getElementById('kpiPausadas'),pausadas);

  const pct=total>0?((pausadas/total)*100).toFixed(1):'0.0';
  document.getElementById('kpiPausadasPct').textContent=pct+'% do total';

  // Exposição: formata como currency sem animação para não quebrar formato
  document.getElementById('kpiExposicao').textContent=
    'R$ '+exposicao.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0});

  animN(document.getElementById('kpiSuspenso'),mediaSusp,'','d');
  document.getElementById('headerCount').textContent=total.toLocaleString('pt-BR')+' OS';
}

// ── RENDER BUCKET CHART ───────────────────────────────────────────────────────
function renderBucket(){
  const cnt={'0-2':0,'3-6':0,'7-15':0,'15+':0};
  // base ignora bucket mas respeita outros filtros
  const base=rawData.filter(r=>{
    const pOk=!activePausada||r['Pausada?']===activePausada;
    const eOk=!activeEspec||r['Téc. Executor']===activeEspec;
    const rOk=sel.regiao.size===0||sel.regiao.has(r['Regional']);
    return pOk&&eOk&&rOk;
  });
  base.forEach(r=>cnt[r['Bucket']]++);
  const vals=BKEYS.map(k=>cnt[k]);
  const dark_=dark();
  const tc=dark_?'#7a8aa0':'#5a6e8a';
  const gc=dark_?'rgba(255,255,255,.05)':'rgba(224,80,80,.06)';
  const bgColors=BKEYS.map(k=>{
    const hex=BCOLORS[k];
    const a=activeBucket===''||activeBucket===k?1:.3;
    return a<1?hex+Math.round(a*255).toString(16).padStart(2,'0'):hex;
  });
  if(bucketChart)bucketChart.destroy();
  bucketChart=new Chart(document.getElementById('bucketChart'),{
    type:'bar',
    data:{labels:BLABELS,datasets:[{data:vals,backgroundColor:bgColors,borderRadius:7,borderSkipped:false}]},
    options:{
      responsive:true,maintainAspectRatio:false,
      layout:{padding:{top:24}},
      onClick:(e,els)=>{if(!els.length)return;const b=BKEYS[els[0].index];activeBucket=activeBucket===b?'':b;applyFilters();},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw.toLocaleString('pt-BR')} OS`}}},
      scales:{
        x:{grid:{display:false},ticks:{color:tc,font:{weight:'700',size:11}},border:{display:false}},
        y:{beginAtZero:true,grid:{color:gc},ticks:{color:tc},border:{display:false}}
      },
      animation:{duration:300}
    },
    plugins:[{id:'lbl',afterDatasetsDraw(ch){
      const{ctx}=ch;ctx.save();ctx.font='700 11px Inter';ctx.textAlign='center';
      ctx.fillStyle=dark_?'#b0bfcf':'#5a6e8a';
      ch.getDatasetMeta(0).data.forEach((b,i)=>{if(vals[i]>0)ctx.fillText(vals[i].toLocaleString('pt-BR'),b.x,b.y-8);});
      ctx.restore();
    }}]
  });
}

// ── RENDER REGIONAL CHART (horizontal, exposição R$) ─────────────────────────
function renderRegional(){
  const map={};
  filteredData.forEach(r=>{
    const reg=r['Regional']||'—';
    if(!map[reg])map[reg]={os:0,multa:0};
    map[reg].os++;
    map[reg].multa+=(r['Multa']||0);
  });
  const sorted=Object.entries(map).sort((a,b)=>b[1].multa-a[1].multa);
  const labels=sorted.map(([k])=>k.replace(/^[A-Z]{2,4}\s*-\s*/,''));
  const vals=sorted.map(([,v])=>Math.round(v.multa));

  // atualiza pill do card
  const total=filteredData.reduce((s,r)=>s+(r['Multa']||0),0);
  document.getElementById('regPill').textContent=
    'R$ '+total.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0});

  const dark_=dark();
  const tc=dark_?'#7a8aa0':'#5a6e8a';
  const gc=dark_?'rgba(255,255,255,.05)':'rgba(224,80,80,.06)';

  // altura dinâmica: 32px por regional, mínimo 260px
  const chartHeight = Math.max(260, sorted.length * 32);
  const canvasEl = document.getElementById('regionalChart');
  canvasEl.parentElement.style.height = chartHeight + 'px';

  if(regionalChart)regionalChart.destroy();
  if(!sorted.length){regionalChart=null;return;}

  regionalChart=new Chart(canvasEl,{
    type:'bar',
    data:{
      labels,
      datasets:[{
        data:vals,
        backgroundColor:'rgba(224,80,80,.75)',
        borderColor:'#e05050',
        borderWidth:1,
        borderRadius:5,
        borderSkipped:false
      }]
    },
    options:{
      indexAxis:'y',
      responsive:true,maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:ctx=>' R$ '+ctx.raw.toLocaleString('pt-BR')}}
      },
      scales:{
        x:{beginAtZero:true,grid:{color:gc},ticks:{color:tc,callback:v=>'R$ '+v.toLocaleString('pt-BR')},border:{display:false}},
        y:{grid:{display:false},ticks:{color:tc,font:{weight:'700',size:11},autoSkip:false},border:{display:false}}
      },
      animation:{duration:300}
    }
  });
}

// ── RENDER TABLE ──────────────────────────────────────────────────────────────
function renderTable(){
  const m=new Map();
  filteredData.forEach(r=>{
    const k=r['Téc. Executor']||'—';
    if(!m.has(k))m.set(k,{t:k,c:0,multa:0,pausadas:0,s:r['Regional']||''});
    const v=m.get(k);
    v.c++;
    v.multa+=(r['Multa']||0);
    if(r['Pausada?']==='SIM')v.pausadas++;
  });
  const rows=[...m.values()].sort((a,b)=>b.c-a.c);
  document.getElementById('techPill').textContent=rows.length+' técnico'+(rows.length!==1?'s':'');
  const max=rows[0]?.c||1;
  if(!rows.length){
    document.getElementById('techBody').innerHTML=
      `<tr><td colspan="6"><div class="emp"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/></svg>Sem resultados</div></td></tr>`;
    return;
  }
  document.getElementById('techBody').innerHTML=rows.map((r,i)=>{
    const rc=i===0?'r1':i===1?'r2':i===2?'r3':'';
    const isAct=activeEspec===r.t;
    const multa=r.multa>0?'R$ '+r.multa.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0}):'—';
    const pausTag=r.pausadas>0?`<span class="ptag ptag-sim">${r.pausadas}</span>`:'<span style="color:var(--faint)">—</span>';
    const sigla=r.s.match(/^([A-Z]{2,4})/)?.[1]||r.s.slice(0,6);
    return`<tr class="${isAct?'espec-active':''}" data-espec="${esc(r.t)}" title="Clique para filtrar por ${esc(r.t)}">
      <td><span class="rk ${rc}">${i+1}</span></td>
      <td title="${esc(r.t)}">${esc(r.t)}<span class="bari" style="width:${Math.round((r.c/max)*60)}px"></span></td>
      <td>${r.c}</td>
      <td class="r" style="color:var(--yellow);font-weight:700">${multa}</td>
      <td>${pausTag}</td>
      <td><span class="stag">${esc(sigla)}</span></td>
    </tr>`;
  }).join('');
}

// ── RENDER OS GRID ────────────────────────────────────────────────────────────
function renderOS(){
  document.getElementById('osPill').textContent=filteredData.length.toLocaleString('pt-BR');
  const items=filteredData.slice(0,Math.max(200,filteredData.length));
  document.getElementById('osList').innerHTML=items.length
    ?items.map(r=>{
      const v=String(r['Nº OS']);
      const pausCls=r['Pausada?']==='SIM'?' pausada':'';
      const pausTitle=r['Pausada?']==='SIM'?` title="Pausada — ${esc(r['Mot. Pausa']||'Sem motivo')}"`:` title="${esc(r['Fantasia']||v)}"`;
      return`<div class="osc${pausCls}" data-os="${v}"${pausTitle}>${esc(v)}</div>`;
    }).join('')
    :`<div style="grid-column:1/-1" class="emp"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>Sem dados</div>`;
}

// ── MULTISELECT ───────────────────────────────────────────────────────────────
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
    const allSel=vals.length>0&&vals.every(v=>set.has(v));
    cbAll.style.background=allSel?'var(--accent)':'';
    cbAll.style.borderColor=allSel?'var(--accent)':'';
    cbAll.innerHTML=allSel?'<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%"><svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>':'<span></span>';
  }

  function updateBtn(){
    const text=btn.querySelector('.ms-text');
    if(set.size===0){text.textContent=placeholder;cnt.classList.add('hidden');}
    else{text.textContent=`${set.size} selecionado${set.size>1?'s':''}`;cnt.textContent=set.size;cnt.classList.remove('hidden');}
    tags.innerHTML=[...set].map(v=>`<div class="atag" data-v="${esc(v)}"><span title="${esc(v)}">${esc(v.length>22?v.slice(0,20)+'…':v)}</span><span class="atag-x" data-id="${id}" data-v="${esc(v)}">×</span></div>`).join('');
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
    document.querySelectorAll('.ms-dropdown.show').forEach(d=>d.classList.remove('show'));
    document.querySelectorAll('.ms-btn.open').forEach(b=>b.classList.remove('open'));
    if(!wasOpen){dd.classList.add('show');btn.classList.add('open');srch.focus();renderItems();}
  });
  srch.addEventListener('input',()=>renderItems(srch.value));
  document.addEventListener('click',e=>{if(!wrap.contains(e.target)){dd.classList.remove('show');btn.classList.remove('open');}});

  return{render:renderItems,update:updateBtn};
}

let msRegiao;
function setupFilters(){
  msRegiao=buildMs('regiao','Regional','Todas as regiões');
  msRegiao.render();msRegiao.update();
}

// ── LOCALSTORAGE ──────────────────────────────────────────────────────────────
function saveState(){
  try{
    localStorage.setItem(LS_KEY,JSON.stringify({
      tema:document.documentElement.getAttribute('data-theme')||'dark',
      bucket:activeBucket,
      pausada:activePausada,
      regiao:[...sel.regiao]
    }));
  }catch(e){}
}

function loadState(){
  try{
    const s=JSON.parse(localStorage.getItem(LS_KEY));
    if(!s)return;
    if(s.tema){
      document.documentElement.setAttribute('data-theme',s.tema);
      const btn=document.getElementById('themeToggle');
      if(btn)btn.innerHTML=s.tema==='light'
        ?`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        :`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
    activeBucket=s.bucket||'';
    activePausada=s.pausada||'';
    if(activePausada)document.querySelectorAll('.pause-btn').forEach(b=>b.classList.toggle('pause-active',b.dataset.p===activePausada));
    if(Array.isArray(s.regiao))s.regiao.forEach(v=>sel.regiao.add(v));
    if(msRegiao){msRegiao.render();msRegiao.update();}
  }catch(e){}
}

// ── FRESHNESS — usa a data do último upload (meta), não os dados ──────────────
function checkFreshness(meta){
  const badge=document.getElementById('xlsxStatus');
  if(!badge)return;
  if(!meta||!meta.atualizado_em){badge.style.display='none';return;}

  // atualizado_em vem como "DD/MM/YYYY HH:MM"
  const m=meta.atualizado_em.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if(!m){badge.style.display='none';return;}

  const uploadDate=new Date(+m[3],+m[2]-1,+m[1]);
  const hoje=new Date();hoje.setHours(0,0,0,0);uploadDate.setHours(0,0,0,0);
  const diff=Math.floor((hoje-uploadDate)/(1000*60*60*24));
  const dtStr=uploadDate.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});

  badge.style.display='inline-block';
  if(diff===0){badge.style.background='#2db86a';badge.style.color='#fff';badge.textContent='✓ Atualizado hoje';}
  else if(diff<=1){badge.style.background='#2db86a';badge.style.color='#fff';badge.textContent='✓ Atualizado ontem';}
  else if(diff<=3){badge.style.background='#e08c00';badge.style.color='#fff';badge.textContent=`⚠ ${diff}d sem atualizar (${dtStr})`;}
  else{badge.style.background='#e05050';badge.style.color='#fff';badge.textContent=`✗ Desatualizado — ${diff}d (${dtStr})`;}
}

// ── UTILS ─────────────────────────────────────────────────────────────────────
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function dark(){return document.documentElement.getAttribute('data-theme')==='dark';}
function toast(msg,type){const t=document.getElementById('toast');t.textContent=msg;t.className=`show ${type||'ok'}`;clearTimeout(t._t);t._t=setTimeout(()=>{t.className='';},3200);}
function renderAll(){renderKPIs();renderBucket();renderRegional();renderTable();renderOS();}

// ── EVENTS ────────────────────────────────────────────────────────────────────
// Bucket pills
document.querySelectorAll('.bpill').forEach(p=>p.addEventListener('click',()=>{
  activeBucket=activeBucket===p.dataset.b?'':p.dataset.b;applyFilters();
}));

// KPI click (15+)
document.querySelectorAll('.kpi[data-bucket]').forEach(card=>card.addEventListener('click',()=>{
  const b=card.dataset.bucket;
  if(!b)return;
  activeBucket=activeBucket===b?'':b;applyFilters();
}));

// Técnico click
document.getElementById('techBody').addEventListener('click',e=>{
  const tr=e.target.closest('tr[data-espec]');
  if(!tr)return;
  activeEspec=activeEspec===tr.dataset.espec?'':tr.dataset.espec;
  applyFilters();
});

// Clear all
document.getElementById('clearFiltersBtn').addEventListener('click',()=>{
  activeBucket='';activePausada='';activeEspec='';
  sel.regiao.clear();
  document.querySelectorAll('.pause-btn').forEach(b=>b.classList.remove('pause-active'));
  if(msRegiao){msRegiao.render();msRegiao.update();}
  applyFilters();
});

// Reset
document.getElementById('resetBtn').addEventListener('click',()=>{
  activeBucket='';activePausada='';activeEspec='';
  sel.regiao.clear();
  document.querySelectorAll('.pause-btn').forEach(b=>b.classList.remove('pause-active'));
  if(msRegiao){msRegiao.render();msRegiao.update();}
  applyFilters();saveState();
});

// Export CSV
document.getElementById('exportBtn').addEventListener('click',()=>{
  if(!filteredData.length){toast('Nenhum dado para exportar.','err');return;}
  const h=['Nº OS','Téc. Executor','Regional','Cidade','Pausada?','Mot. Pausa','# Dias (Bruto)','Bucket','Multa','Dias Suspenso','Fantasia','Conta'];
  const lines=[h.join(';')];
  filteredData.forEach(r=>lines.push(h.map(k=>`"${String(r[k]??'').replace(/"/g,'""')}"`).join(';')));
  const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='recred-filtrado.csv';a.click();URL.revokeObjectURL(a.href);
  toast('✓ '+filteredData.length.toLocaleString('pt-BR')+' registros exportados','ok');
});

// Copy OS
document.getElementById('osList').addEventListener('click',function(e){
  const card=e.target.closest('.osc');
  if(!card)return;
  const val=card.getAttribute('data-os')||card.textContent.trim();
  const ta=document.createElement('textarea');
  ta.value=val;ta.style.cssText='position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
  document.body.appendChild(ta);ta.focus();ta.select();
  let ok=false;try{ok=document.execCommand('copy');}catch(err){}
  document.body.removeChild(ta);
  if(ok){
    card.classList.add('copied');toast('OS '+val+' copiada!','ok');setTimeout(()=>card.classList.remove('copied'),1200);
  }else if(navigator.clipboard){
    navigator.clipboard.writeText(val).then(()=>{card.classList.add('copied');toast('OS '+val+' copiada!','ok');setTimeout(()=>card.classList.remove('copied'),1200);}).catch(()=>toast('Erro ao copiar.','err'));
  }else{toast('Erro ao copiar.','err');}
});

// Theme
document.getElementById('themeToggle').addEventListener('click',()=>{
  const root=document.documentElement;
  const next=root.getAttribute('data-theme')==='dark'?'light':'dark';
  root.setAttribute('data-theme',next);
  document.getElementById('themeToggle').innerHTML=next==='light'
    ?`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    :`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  if(filteredData.length){renderBucket();renderRegional();}
  saveState();
});
