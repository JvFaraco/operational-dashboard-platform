//Chart.register(ChartDataLabels);
// ── PALETA DE DEFEITOS (cores únicas e persistentes) ─────────────────────────
const DEF_PALETTE=['#005BAC','#F5B400','#2db86a','#e05050','#8b5cf6','#0ea5e9','#e08c00',
  '#f472b6','#34d399','#fb923c','#a78bfa','#22d3ee','#fbbf24','#4ade80','#f87171',
  '#60a5fa','#c084fc','#86efac','#fca5a5','#93c5fd'];
const defColorMap = {};
let defColorIdx = 0;
function getDefColor(def) {
  if(!defColorMap[def]) {
    defColorMap[def] = DEF_PALETTE[defColorIdx % DEF_PALETTE.length];
    defColorIdx++;
  }
  return defColorMap[def];
}

// ── STATE ─────────────────────────────────────────────────────────────────────
let rawData=[],filteredData=[];
let activeTipos=new Set(),activeBucket=null,selDefeito=new Set(),activeTiposOS=new Set();
let sortCol='Dias',sortDir='desc';
let diasChart=null,defChart=null;

fetch('/api/nao-agendadas')
.then(r => r.json())
.then(data => {

    if(!Array.isArray(data) || !data.length){
      const m = document.getElementById('metaInfo');
      if(m) m.innerHTML = '<span style="color:#e08c00">⚠ Sem dados carregados</span>';
      toast('Nenhum dado encontrado. Faça upload em /upload.', true);
      return;
    }

    rawData = data.map(norm).filter(Boolean);

    activeTipos.clear();
    activeBucket = null;
    selDefeito.clear();

    updateCounts();
    rebuildDefDD();
    syncUI();
    applyFilters();

    // Atualiza box de meta no sidebar
    fetch('/api/meta/nao-agendadas').then(r=>r.json()).then(meta=>{
      const m = document.getElementById('metaInfo');
      if(m && meta && meta.atualizado_em){
        m.innerHTML =
          '<strong>' + (meta.registros||0).toLocaleString('pt-BR') + ' O.S</strong><br>' +
          'Atualizado em ' + meta.atualizado_em + '<br>' +
          '<span style="font-size:10px">' + (meta.arquivo||'') + '</span>';
      }
    }).catch(()=>{});

    toast(
        rawData.length.toLocaleString('pt-BR')
        + ' registros carregados!',
        false
    );

})
.catch(err => {

    const m = document.getElementById('metaInfo');
    if(m) m.innerHTML = '<span style="color:#e05050">✗ Erro ao carregar</span>';

    toast(
        'Erro ao carregar dados.',
        true
    );

    console.error(err);

});

// ── NORM ──────────────────────────────────────────────────────────────────────
function norm(r){
    const os = String(r['Nº OS'] || '').toUpperCase();

  if(os.includes('AVERAGE')) return null;
  const tec=(r['Técnico Executor']||r['Tecnico Executor']||'').trim();
  const dias=+(r['#Dias']??r['# Dias']??r['Dias']??0);
  const tu=tec.toUpperCase();
  let tipo='RESTANTE';
  if(/[-\s]EPV[-\s]/.test(tu)||tu.includes('-EPV-')) tipo='EPV';
  else if(/[-\s]PJ[-\s]/.test(tu)||tu.includes('-PJ-')) tipo='PJ';
  else if(tu.includes('COML')||tu.includes('COMERCIAL')) tipo='COMERCIAL';
  let bucket='0-2';
  if(dias<=2) bucket='0-2';
  else if(dias<=6) bucket='3-6';
  else if(dias<=15) bucket='7-15';
  else bucket='15+';
  const parts=tec.split('-').map(s=>s.trim());
  const nomeTec=parts.length>=3?parts.slice(2).join(' - '):tec;
  const defeito=(r['Defeito']??'').trim();
  const tipoOsMap={'':'Instalação','Nova instalação':'Instalação','A365 Manutenção Técnica':'Manutenção','A365 Intrusão':'Manutenção','A365 Reentrega':'Manutenção','A365 Remanejar Equipamento':'Manutenção','Falha de comunicação de dispositivo':'Manutenção','Falha de comunicação de central':'Manutenção','A365 - Cancelamento por Inadimplência':'Desinstalação'};
  const tipoOS=tipoOsMap[defeito]??'Manutenção';
  return{'Nº OS':String(r['Nº OS']??''),'Abertura':r['Abertura']?String(r['Abertura']).substring(0,10):'',
    'Defeito':defeito,'Técnico':nomeTec,'TécnicoFull':tec,
    'Tipo':tipo,'Dias':dias,'Bucket':bucket,'Fantasia':(r['Fantasia']??'').trim(),'Conta':(r['Conta']??'').trim(),'TipoOS':tipoOS};
}
function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ── FILTROS ───────────────────────────────────────────────────────────────────
function applyFilters(){
  filteredData=rawData.filter(r=>{
    const tOk=activeTipos.size===0||activeTipos.has(r.Tipo);
    const bOk=!activeBucket||r.Bucket===activeBucket;
    const dOk=selDefeito.size===0||selDefeito.has(r.Defeito);
    const tosOk=activeTiposOS.size===0||activeTiposOS.has(r.TipoOS);
    return tOk&&bOk&&dOk&&tosOk;
  });
  renderAll();
}
function toggleTipoOS(t){
  if(activeTiposOS.has(t)) activeTiposOS.delete(t); else activeTiposOS.add(t);
  document.querySelectorAll('.tos-btn').forEach(btn=>{
    if(btn.dataset.tos===t) btn.classList.toggle('tos-active',activeTiposOS.has(t));
  });
  applyFilters();
}

const TIPO_COLORS={'EPV':'#005BAC','PJ':'#8b5cf6','COMERCIAL':'#F5B400','RESTANTE':'#e08c00'};

function toggleTipo(t){
  if(activeTipos.has(t)) activeTipos.delete(t); else activeTipos.add(t);
  // sync checkboxes
  ['EPV','PJ','COMERCIAL','RESTANTE'].forEach(k=>{
    document.getElementById('cb-'+k)?.classList.toggle('active',activeTipos.has(k));
  });
  // sync kpi cards — highlight ativo
  ['EPV','PJ','COMERCIAL'].forEach(k=>{
    document.getElementById('kpi-'+k)?.classList.toggle('kactive',activeTipos.has(k));
  });
  applyFilters();
}

function toggleBucket(b){
  activeBucket=activeBucket===b?null:b;
  document.querySelectorAll('.bpill').forEach(p=>p.classList.toggle('on',p.dataset.b===activeBucket));
  applyFilters();
}

function filtrar30(){
  activeTipos.clear();activeBucket=null;selDefeito.clear();
  filteredData=rawData.filter(r=>r.Dias>30);
  syncUI();renderAll();
}

function syncUI(){
  ['EPV','PJ','COMERCIAL','RESTANTE'].forEach(k=>{
    document.getElementById('cb-'+k)?.classList.remove('active');
    document.getElementById('kpi-'+k)?.classList.remove('kactive');
  });
  document.querySelectorAll('.bpill').forEach(p=>p.classList.remove('on'));
  rebuildDefDD();
}

// ── DEFEITO MULTISELECT ───────────────────────────────────────────────────────
function rebuildDefDD(filter=''){
  const vals=[...new Set(rawData.map(r=>r.Defeito).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const filtered=vals.filter(v=>v.toLowerCase().includes(filter.toLowerCase()));
  document.getElementById('ms-def-items').innerHTML=filtered.map(v=>{
    const col=getDefColor(v);
    const isSel=selDefeito.has(v);
    return`<div class="ms-it${isSel?' sel':''}" onclick="msDefToggle(this,'${esc(v).replace(/'/g,"\\'")}')">
      <div class="ms-cb2" style="${isSel?'background:'+col+';border-color:'+col+';':''}"></div>
      <span style="${isSel?'color:'+col+';':''}">${esc(v)}</span>
    </div>`;
  }).join('');
  updateDefBtn();
}

function msDefToggle(el,v){
  if(selDefeito.has(v)) selDefeito.delete(v); else selDefeito.add(v);
  rebuildDefDD(document.getElementById('ms-def-srch').value);
  applyFilters();
}

function updateDefBtn(){
  const cnt=selDefeito.size;
  document.getElementById('ms-def-txt').textContent=cnt===0?'Todos os defeitos':cnt+' selecionado'+(cnt>1?'s':'');
  const cntEl=document.getElementById('ms-def-cnt');
  cntEl.textContent=cnt;cntEl.classList.toggle('vis',cnt>0);
  const tags=document.getElementById('ms-def-tags');
  tags.innerHTML=[...selDefeito].map(v=>{
    const col=getDefColor(v);
    return`<div style="padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700;background:${col}22;color:${col};border:1px solid ${col}55;display:flex;align-items:center;gap:4px;cursor:default;">
      <span>${esc(v.length>18?v.slice(0,16)+'…':v)}</span>
      <span style="cursor:pointer;font-size:13px;line-height:1;" onclick="msDefRemove('${esc(v).replace(/'/g,"\\'")}')">×</span>
    </div>`;
  }).join('');
}

function msDefRemove(v){selDefeito.delete(v);rebuildDefDD();applyFilters();}

document.getElementById('ms-def-btn').addEventListener('click',e=>{
  e.stopPropagation();
  const dd=document.getElementById('ms-def-dd');
  const wasOpen=dd.classList.contains('show');
  document.querySelectorAll('.ms-dd.show').forEach(d=>d.classList.remove('show'));
  document.querySelectorAll('.ms-btn.open').forEach(b=>b.classList.remove('open'));
  if(!wasOpen){dd.classList.add('show');document.getElementById('ms-def-btn').classList.add('open');document.getElementById('ms-def-srch').focus();rebuildDefDD();}
});
document.getElementById('ms-def-srch').addEventListener('input',e=>rebuildDefDD(e.target.value));
document.addEventListener('click',e=>{
  if(!document.getElementById('ms-def').contains(e.target)){
    document.getElementById('ms-def-dd').classList.remove('show');
    document.getElementById('ms-def-btn').classList.remove('open');
  }
});

// ── COUNTS ────────────────────────────────────────────────────────────────────
function updateCounts(){
  ['EPV','PJ','COMERCIAL','RESTANTE'].forEach(t=>{
    const el=document.getElementById('cnt-'+t);
    if(el) el.textContent=rawData.filter(r=>r.Tipo===t).length.toLocaleString('pt-BR');
  });
}

// ── ANIMAÇÃO ──────────────────────────────────────────────────────────────────
function animN(el,target){
  if(!el) return;
  const start=+(el.dataset.v||0),t0=performance.now();
  const go=n=>{
    const p=Math.min((n-t0)/380,1),e=1-Math.pow(1-p,3);
    el.textContent=Math.round(start+(target-start)*e).toLocaleString('pt-BR');
    if(p<1) requestAnimationFrame(go); else el.dataset.v=target;
  };
  requestAnimationFrame(go);
}

// ── KPIs ──────────────────────────────────────────────────────────────────────
function renderKPIs(){
  animN(document.getElementById('kTotal'),filteredData.length);
  document.getElementById('headerCount').textContent=filteredData.length.toLocaleString('pt-BR')+' OS';
  // KPIs de tipo — dinâmicos com filteredData
  animN(document.getElementById('kEpv'),filteredData.filter(r=>r.Tipo==='EPV').length);
  animN(document.getElementById('kPj'),filteredData.filter(r=>r.Tipo==='PJ').length);
  animN(document.getElementById('kComl'),filteredData.filter(r=>r.Tipo==='COMERCIAL').length);
  animN(document.getElementById('k30'),filteredData.filter(r=>r.Dias>30).length);
  // Atualizar contadores nos botões de Tipo de O.S
  ['Instalação','Manutenção','Desinstalação'].forEach(t=>{
    const btn=document.querySelector('.tos-btn[data-tos="'+t+'"]');
    if(btn){
      const base=activeTiposOS.size===0||activeTiposOS.has(t)?filteredData:rawData;
      const cnt=rawData.filter(r=>r.TipoOS===t).length;
      btn.innerHTML=(t==='Instalação'?'📦':t==='Manutenção'?'🔧':'🗑️')+' '+t+' <span style="opacity:.7;font-weight:400">('+cnt+')</span>';
    }
  });
}

// ── GRÁFICO DIAS ─────────────────────────────────────────────────────────────
function renderDiasChart(){
  const bmap={'0-2':0,'3-6':0,'7-15':0,'15+':0};
  filteredData.forEach(r=>{if(r.Bucket in bmap) bmap[r.Bucket]++;});
  const dark=document.documentElement.getAttribute('data-theme')!=='light';
  const tc=dark?'#b0bfcf':'#3d4d60';
  const lc=dark?'#e8edf5':'#0d1a2e';
  const FULL=['#2db86a','#4d9fdd','#e08c00','#e05050'];
  const FADE=['#2db86a44','#4d9fdd44','#e08c0044','#e0505044'];
  const keys=Object.keys(bmap);
  const bgs=keys.map((k,i)=>activeBucket===k?FULL[i]:FULL[i]);
  if(diasChart) diasChart.destroy();
  diasChart=new Chart(document.getElementById('diasChart'),{
    type:'bar',
    data:{labels:['0-2 dias','3-6 dias','7-15 dias','+15 dias'],datasets:[{
      data:Object.values(bmap),
      backgroundColor:bgs,
      borderRadius:8,
      borderSkipped:false,
      borderWidth:activeBucket?keys.map((k,i)=>activeBucket===k?2:0):[0,0,0,0],
      borderColor:FULL
    }]},
    options:{responsive:true,maintainAspectRatio:false,
      onClick:(e,els)=>{if(!els.length)return;toggleBucket(keys[els[0].index]);},
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:c=>c.raw.toLocaleString('pt-BR')+' OS'}},
      },
      scales:{
        x:{grid:{display:false},ticks:{color:tc,font:{weight:'700',size:12}},border:{display:false}},
        y:{beginAtZero:true,grid:{color:dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.07)'},ticks:{color:tc,font:{size:11}},border:{display:false}}
      },
      layout:{padding:{top:28}},
      animation:{duration:260}}
  });
}

// ── GRÁFICO DEFEITO (cores únicas e persistentes) ─────────────────────────────
function renderDefChart(){
  const cnt={};
  filteredData.forEach(r=>{const d=r.Defeito||'Outros';if(d==='Outros')return;cnt[d]=(cnt[d]||0)+1;});
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,8);
  document.getElementById('defPill').textContent=Object.keys(cnt).length+' tipos';
  const dark=document.documentElement.getAttribute('data-theme')!=='light';
  // Pré-registrar cores para cada defeito antes de renderizar
  top.forEach(([k])=>getDefColor(k));
  const colors=top.map(([k])=>getDefColor(k));
  // bordas com opacidade para os selecionados
  const borderW=top.map(([k])=>selDefeito.has(k)?3:1.5);
  const lc=dark?'#b0bfcf':'#5a6e8a';
  if(defChart) defChart.destroy();
  if(!top.length){defChart=null;return;}
  defChart=new Chart(document.getElementById('defChart'),{
    type:'doughnut',
    data:{
      labels:top.map(([k])=>k.length>32?k.slice(0,30)+'…':k),
      datasets:[{data:top.map(([,v])=>v),backgroundColor:colors,
        borderWidth:borderW,borderColor:dark?'#161d2a':'#fff',hoverOffset:10,
        hoverBorderWidth:3,hoverBorderColor:colors}]
    },
    options:{responsive:true,maintainAspectRatio:false,cutout:'58%',
      onClick:(e,els)=>{
        if(!els.length)return;
        const lbl=top[els[0].index][0];
        if(selDefeito.has(lbl)) selDefeito.delete(lbl); else{selDefeito.clear();selDefeito.add(lbl);}
        rebuildDefDD();applyFilters();
      },
      plugins:{
        legend:{position:'right',labels:{color:lc,font:{size:10,weight:'600'},boxWidth:10,padding:8,usePointStyle:true,pointStyleWidth:8,
          generateLabels:(chart)=>{
            const ds=chart.data.datasets[0];
            return chart.data.labels.map((lbl,i)=>({
              text:lbl,fillStyle:colors[i],strokeStyle:colors[i],
              fontColor:lc,hidden:false,index:i,
              lineWidth:selDefeito.has(top[i][0])?2:0
            }));
          }
        }},
        tooltip:{callbacks:{label:c=>`${c.raw.toLocaleString('pt-BR')} OS (${filteredData.length?((c.raw/filteredData.length)*100).toFixed(1):'0'}%)`}}
      },
      animation:{duration:260}}
  });
}

// ── COPY OS ───────────────────────────────────────────────────────────────────

// ── SORT + TABELA ─────────────────────────────────────────────────────────────

function copyOS(numOS, el){
  const doAnim = () => {
    if(el && !el.classList.contains('td-copied')){
      el.classList.add('td-copied');
      setTimeout(() => el.classList.remove('td-copied'), 1000);
    }
    toast('\u2713 OS ' + numOS + ' copiada!', false);
  };

  navigator.clipboard.writeText(numOS)
    .then(() => doAnim())
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = numOS;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try{
        document.execCommand('copy');
        doAnim();
      }catch(e){
        toast('Erro ao copiar', true);
      }
      document.body.removeChild(ta);
    });
}

function sortBy(col){
  if(sortCol===col) sortDir=sortDir==='asc'?'desc':'asc';
  else{sortCol=col;sortDir=col==='Dias'?'desc':'asc';}
  document.querySelectorAll('table.dt thead th').forEach(th=>{
    th.classList.remove('sa','sd');
    if(th.dataset.col===col) th.classList.add(sortDir==='asc'?'sa':'sd');
  });
  renderTabela();
}

function renderTabela(){
  const sorted=[...filteredData].sort((a,b)=>{
    let va=a[sortCol]??'',vb=b[sortCol]??'';
    if(sortCol==='Dias'){va=+va;vb=+vb;}
    const cmp=typeof va==='number'?va-vb:String(va).localeCompare(String(vb),'pt-BR');
    return sortDir==='asc'?cmp:-cmp;
  });
  document.getElementById('detPill').textContent=sorted.length.toLocaleString('pt-BR')+' registros';
  const rows=sorted.slice(0,500);
  if(!rows.length){
    document.getElementById('detBody').innerHTML='<tr><td colspan="7"><div class="emp"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>Sem resultados</div></td></tr>';
    return;
  }
  const dc=d=>d<=6?'d-ok':d<=15?'d-mid':'d-bad';
  const tag=t=>t==='EPV'?'<span class="tag-epv">EPV</span>':t==='PJ'?'<span class="tag-pj">PJ</span>':t==='COMERCIAL'?'<span class="tag-coml">COML</span>':'<span class="tag-rest">REST</span>';
  document.getElementById('detBody').innerHTML=rows.map(r=>`<tr>
    <td class="td-os" data-os="${esc(r['Nº OS'])}" title="Clique para copiar">${esc(r['Nº OS'])}</td>
    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r.Defeito)}">${esc(r.Defeito)}</td>
    <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r.Técnico)}">${esc(r.Técnico)}</td>
    <td>${tag(r.Tipo)}</td>
    <td style="text-align:center;"><span class="${dc(r.Dias)}">${r.Dias}</span></td>
    <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r.Fantasia)}">${esc(r.Fantasia)}</td>
  </tr>`).join('');
}

function renderAll(){renderKPIs();renderDiasChart();renderDefChart();renderTabela();}

// ── FILE ──────────────────────────────────────────────────────────────────────

document.getElementById('exportBtn').addEventListener('click',()=>{
  if(!filteredData.length){toast('Sem dados.',true);return;}
  const esc=v=>String(v??'').replace(/"/g,'""');
  const q=v=>'"'+esc(v)+'"';
  const sep=';';

  const byTipo = t => filteredData.filter(r=>r.TipoOS===t);
  const countBucket = (arr,b) => arr.filter(r=>r.Bucket===b).length;
  const maxDias = arr => arr.length ? Math.max(...arr.map(r=>r.Dias)) : 0;
  const sumDias = arr => arr.reduce((a,b)=>a+(+b.Dias||0),0);

  const inst = byTipo('Instalação');
  const man = byTipo('Manutenção');
  const des = byTipo('Desinstalação');
  const allMax = filteredData.length ? Math.max(...filteredData.map(r=>r.Dias)) : 0;

  const out=[];
  out.push(['RESUMO DO FILTRO'].join(sep));
  out.push([q('TOTAL DE OS COM FILTRO'), q(filteredData.length)].join(sep));
  out.push([q('TOTAL GERAL DE DIAS'), q(allMax)].join(sep));
  out.push('');
  out.push([q('TIPO DE OS'), q('TOTAL DE OS'), q('MAIS ANTIGA (DIAS)'), q('0-02 DIAS'), q('03-06 DIAS'), q('07-15 DIAS'), q('ACIMA DE 15 DIAS')].join(sep));
  out.push([q('INSTALAÇÃO'), q(inst.length), q(maxDias(inst)), q(countBucket(inst,'0-2')), q(countBucket(inst,'3-6')), q(countBucket(inst,'7-15')), q(countBucket(inst,'15+'))].join(sep));
  out.push([q('MANUTENÇÃO'), q(man.length), q(maxDias(man)), q(countBucket(man,'0-2')), q(countBucket(man,'3-6')), q(countBucket(man,'7-15')), q(countBucket(man,'15+'))].join(sep));
  out.push([q('DESINSTALAÇÃO'), q(des.length), q(maxDias(des)), q(countBucket(des,'0-2')), q(countBucket(des,'3-6')), q(countBucket(des,'7-15')), q(countBucket(des,'15+'))].join(sep));
  out.push('');
  out.push([q('DETALHAMENTO DE O.S')].join(sep));
  out.push([q('Nº OS'), q('Tipo de O.S'), q('Motivo/Defeito'), q('Técnico'), q('Tipo Técnico'), q('Dias'), q('Faixa'), q('Cliente'), q('Conta')].join(sep));
  filteredData.forEach(r=>{
    out.push([q(r['Nº OS']), q(r.TipoOS), q(r.Defeito), q(r.Técnico), q(r.Tipo), q(r.Dias), q(r.Bucket), q(r.Fantasia), q(r.Conta)].join(sep));
  });

  const blob = new Blob(['\uFEFF' + out.join('\n')], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'OS-Nao-Agendadas-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  toast(filteredData.length.toLocaleString('pt-BR')+' OS exportadas',false);
});

document.getElementById('resetBtn').addEventListener('click',()=>{
  activeTipos.clear();activeBucket=null;selDefeito.clear();
  syncUI();applyFilters();
});

document.getElementById('themeToggle').addEventListener('click',()=>{
  const r=document.documentElement;
  r.setAttribute('data-theme',r.getAttribute('data-theme')==='dark'?'light':'dark');
  if(filteredData.length){renderDiasChart();renderDefChart();}
});

function toast(msg,err){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='show '+(err?'err':'ok');
  clearTimeout(t._t);t._t=setTimeout(()=>t.className='',3200);
}

// ── COPY OS — event delegation (sem onclick inline) ──────────────────────────
document.getElementById('detBody').addEventListener('click', function(e){
  const td = e.target.closest('.td-os');
  if(!td) return;
  const numOS = td.getAttribute('data-os') || td.textContent.trim();
  copyOS(numOS, td);
});
