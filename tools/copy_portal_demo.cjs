// Copy the actual portal frontend; only replace data, personal fallback labels,
// routing and the public-demo boundary. Dashboard algorithms/CSS stay original.
const fs=require('node:fs'),path=require('node:path'),acorn=require('acorn'),crypto=require('node:crypto');
const {chromium}=require('@playwright/test');
const source=process.argv[2];if(!source)throw Error('Pass the private portal source directory');
const root=path.resolve(__dirname,'../docs');
const read=name=>fs.readFileSync(path.join(source,name),'utf8');
const regionals=[{sigla:'LIT',cidade:'Vila Aurora',uf:'SC',supervisor:'Supervisor Demo A'},{sigla:'VAL',cidade:'Nova Esperança',uf:'SC',supervisor:'Supervisor Demo B'},{sigla:'SER',cidade:'Santa Clara',uf:'SC',supervisor:'Supervisor Demo C'}];
const siglas={LIT:'Vila Aurora',VAL:'Nova Esperança',SER:'Santa Clara',ADM:'BackOffice',SPV:'Supervisores'};
const supervisors=Object.fromEntries(regionals.map(row=>[row.supervisor,[row.sigla]]));
const accountRows=regionals.map((row,i)=>({sigla:row.sigla,regional:row.cidade,contas:[1260,980,760][i]}));
const volumes={rows:accountRows,byRegional:accountRows,byCity:regionals.map((r,i)=>({uf:'SC',cidade:r.cidade,volume:[1260,980,760][i]})),byNeighborhood:[],byRoute:[],total:3000,semRota:0,volumeEstimado:false,lastSuccessAt:'2026-10-12T12:00:00Z',snapshotAt:'2026-10-12T12:00:00Z'};
const orders=Array.from({length:84},(_,i)=>{
 const regional=regionals[i%3];const tech=`Técnico Demo ${String((i%3)*3+(Math.floor(i/3)%3)+1).padStart(2,'0')}`;
 return {'Nº OS':`DEMO-${String(i+1).padStart(4,'0')}`,'Téc. Executor':`A365 - ${regional.sigla} - EPV - ${tech}`,Sigla:regional.sigla,Cidade:regional.cidade,Bairro:['Centro Demo','Jardim Demo','Parque Demo'][i%3],Defeito:['Nova instalação','A365 Manutenção Técnica','A365 Administrativa de Apoio','A365 Retirada de Equipamentos'][i%4],Abertura:'01/10/2026',Agendamento:i%5?'15/10/2026':'','Pausada?':i%7===0?'Sim':'',Conta:`CONTA-DEMO-${String(Math.floor(i/2)+1).padStart(4,'0')}`,Solicitante:i%2?'CLIENTE':'usuário operador',Dias:i%26,status:['OPEN','SCHEDULED','PAUSED','RESCHEDULED'][i%4]};
});
const finished=Array.from({length:432},(_,i)=>{
 const regional=regionals[i%3];const tech=`Técnico Demo ${String((i%3)*3+(Math.floor(i/3)%3)+1).padStart(2,'0')}`;
 const october=i<216;const day=String(1+Math.floor(i/3)%12+(october?0:18)).padStart(2,'0');
 return {'Nº OS':`DEMO-F-${String(i+1).padStart(4,'0')}`,'Téc. Executor':`A365 - ${regional.sigla} - EPV - ${tech}`,Fechamento:`${day}/${october?'10':'09'}/2026`,'Tipo OS':['INSTALAÇÃO','MANUTENÇÃO','ADMINISTRATIVA','DESINSTALAÇÃO'][Math.floor(i/3)%4],Solicitante:i%2?'CLIENTE':'SISTEMA',Conta:`CONTA-DEMO-${String(i+1).padStart(4,'0')}`,Defeito:i%4===2?'A365 RECRED':'Atendimento Demo',Problema:i%5?'RECRED SUCESSO':'RECRED SEM SUCESSO','Solução':i%5?'A365 Equipamento RETIRADOS':'A365 Equipamento NÃO RETIRADOS - Outros','Dias (Bruto)':i%20,'Dias (Líq)':i%12};
});
orders.forEach((row,i)=>{row.Conta=`CONTA-DEMO-${String(i%10===9?i:i+1).padStart(4,'0')}`;});
finished.forEach(row=>{const [day,month,year]=row.Fechamento.split('/');row.Fechamento=`${year}-${month}-${day}T12:00:00-03:00`;});
for(let i=0;i<9;i++){const reg=regionals[Math.floor(i/3)],volume=[420,390,450,320,310,350,250,240,270][i];volumes.byRoute.push({rota:`DEMO-${reg.sigla}-${i%3+1}`,volume,estimado:false});volumes.byNeighborhood.push({uf:'SC',cidade:reg.cidade,bairro:`Bairro Demo ${i%3+1}`,volume});}
const inputs={'regionais.json':{regionais:regionals},'open_os.json':{generatedAt:volumes.snapshotAt,rows:orders},'finished_os.json':{generatedAt:volumes.snapshotAt,rows:finished},'route_account_volumes.json':volumes};
for(const [name,data]of Object.entries(inputs))fs.writeFileSync(path.join(root,name),JSON.stringify(data));
function transformJS(js,replacements){
 const comments=[];let ast;try{ast=acorn.parse(js,{ecmaVersion:'latest',onComment:comments,allowReturnOutsideFunction:true});}catch{throw Error('Source JavaScript could not be parsed safely; export stopped');}
 const edits=[];function walk(node){if(!node||typeof node!=='object')return;
  if(node.type==='VariableDeclarator'&&node.id?.type==='Identifier'&&Object.hasOwn(replacements,node.id.name)&&node.init)edits.push([node.init.start,node.init.end,JSON.stringify(replacements[node.id.name])]);
  if(node.type==='Literal'&&typeof node.value==='string'&&node.value.toUpperCase().includes('MARIO CELSO IZIDORO'))edits.push([node.start,node.end,JSON.stringify('TECNICO DEMO ESPECIAL')]);
  if(node.type==='FunctionDeclaration'&&node.id?.name==='tilesBase'){
   // Keep the real map layers and interactions, use the bundled fictional base.
   edits.push([node.body.start,node.body.end,'{ return L.layerGroup(); }']);
  }
  for(const [key,value]of Object.entries(node)){if(['start','end','loc'].includes(key))continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);}
 }walk(ast);
 for(const comment of comments)if(!comment.value.includes('__EMBED')&&!comment.value.startsWith('!')&&!/license|copyright|Leaflet|Chart\.js|SheetJS/i.test(comment.value))edits.push([comment.start,comment.end,'']);
 const filtered=edits.filter(edit=>!edits.some(other=>other!==edit&&other[0]<=edit[0]&&other[1]>=edit[1]&&(other[0]!==edit[0]||other[1]!==edit[1])));
 for(const [start,end,text]of filtered.sort((a,b)=>b[0]-a[0]))js=js.slice(0,start)+text+js.slice(end);
 return js;
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge'});
 const manifest={date:'2026-10-12',purpose:'Public demonstration of a solution developed for Orsegups',pages:{}};
 let admin=read('server/templates/admin.html');
 const admins={THEME_CSS:read('server/templates/_theme.css'),THEME_JS:read('server/templates/_theme.js'),NAME:'Administrador Demo',ICON_LOGOUT:'',CSRF_TOKEN:'demo-sem-autenticacao',MANUAL_FEED:'open',OPEN_OS_STATUS:'84 OS fictícias',FINISHED_OS_STATUS:'432 OS fictícias',FINISHED_OS_PERIOD:'setembro/outubro 2026',FINISHED_OS_LATEST:'12/10/2026',CONTAS_STATUS:'3.000 contas fictícias',ENDERECOS_STATUS:'9 especialistas fictícios',MAPA_STATUS:'Mapa demonstrativo',EPV_STATUS:'Somente dados genéricos',REGIONAIS_STATUS:'3 regionais fictícias',REBUILD_LOG:'Demonstração — nenhuma execução no servidor',EPV_UF_OPTIONS:'<option value="SC">SC</option>'};
 admins.ROWS=['Administrador Demo','Operador Demo','Visitante Demo'].map((name,i)=>`<tr><td data-label="Usuário">demo${i+1}</td><td data-label="Nome">${name}</td><td data-label="Status"><span data-demo-status>Ativo</span></td><td data-label="Último acesso">12/10/2026</td><td class="actions-cell"><button type="button" class="toggle-btn" data-demo-toggle aria-label="Inativar ${name}" data-demo-name="${name}">Inativar</button></td></tr>`).join('');
 admins.REGIONAIS_ROWS=regionals.map(r=>`<tr><td>${r.sigla}</td><td>${r.cidade}/SC</td><td>${r.supervisor}</td><td>12/10/2026</td><td>Demo</td></tr>`).join('');
 admins.EPV_ROWS=Array.from({length:9},(_,i)=>`<tr><td>Técnico Demo ${String(i+1).padStart(2,'0')}</td><td>Localização fictícia</td><td>${regionals[Math.floor(i/3)].cidade}/SC</td><td>EPV</td><td>Demo</td><td>Consulta</td></tr>`).join('');
 admin=admin.replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>admins[key]||'');
 admin=admin.replace('href="/logout"','href="index.html"').replace('>Sair</a>','>Início</a>');
 admin=admin.replace('<main>','<main><div class="public-demo-notice">DEMONSTRAÇÃO PÚBLICA — Solução desenvolvida para a Orsegups. Ações simuladas; nada é alterado na empresa.</div>');
 admin=admin.replace('</head>','<link rel="stylesheet" href="assets/public-boundary.css"><script src="assets/public-boundary.js"></script></head>');
 admin=admin.replace('</body>','<script src="assets/admin-demo.js"></script></body>');
 admin=admin.replace(/<input([^>]*type="file"[^>]*)>/g,'<input$1 disabled>');
 admin=admin.replace(/<form([^>]*)>/g,'<form$1><fieldset disabled data-demo-form style="display:contents">').replace(/<\/form>/g,'</fieldset></form>');
 admin=admin.replace(/href="\/admin[^\"]*"/g,'href="#" data-demo-action');
 fs.writeFileSync(path.join(root,'admin.html'),admin);
 for(const [file,out]of [['dashboard/ControledeOS.html','os.html'],['dashboard/A365_Produtividade.html','produtividade.html'],['routes/mapa_cobertura_rotas.html','rotas.html']]){
  let html=read(file);
  const originalStyles=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match=>match[1]);
  manifest.pages[out]={source:file,cssSha256:originalStyles.map(css=>crypto.createHash('sha256').update(css).digest('hex'))};
  html=html.replace(/\/\*__EMBED_OS_START__\*\/[\s\S]*?\/\*__EMBED_OS_END__\*\//g,out==='os.html'?'/*__EMBED_OS_START__*/let EMBED_OS = [];/*__EMBED_OS_END__*/':'/*__EMBED_OS_START__*/[]/*__EMBED_OS_END__*/');
  const map=out==='rotas.html';
  const cache={especialistas:{},cidades:{},bairros:{}};const contas={};
  for(let i=0;i<9;i++){
   const reg=regionals[Math.floor(i/3)],name=`Técnico Demo ${String(i+1).padStart(2,'0')}`;const lat=-27.1-Math.floor(i/3)*.18+(i%3)*.03,lng=-49+(i%3)*.15;
   const polygon={type:'Polygon',coordinates:[[[lng-.055,lat-.035],[lng+.055,lat-.035],[lng+.055,lat+.035],[lng-.055,lat+.035],[lng-.055,lat-.035]]]};
   const rec={especialista:name,regional:reg.sigla,supervisor:reg.supervisor,vinculo:'EPV',rota:`DEMO-${reg.sigla}-${i%3+1}`,cidade:reg.cidade,uf:'SC',bairro:`Bairro Demo ${i%3+1}`,lat,lng,poligono:polygon,precisao:'bairro'};
   cache.especialistas[name]={...rec,nome:name};cache.cidades[`cidade-${i}`]=rec;cache.bairros[`bairro-${i}`]=rec;contas[name]=[420,390,450,320,310,350,250,240,270][i];
  }
  if(map){for(const [name,value]of Object.entries({CACHE:cache,CONTAS:contas,VOLUMES:volumes,GENERATED_AT:volumes.snapshotAt,REGIONAIS:regionals}))html=html.replace(new RegExp(`/\\*__EMBED_${name}_START__\\*/[\\s\\S]*?/\\*__EMBED_${name}_END__\\*/`,'g'),`/*__EMBED_${name}_START__*/${JSON.stringify(value)}/*__EMBED_${name}_END__*/`);}
  else html=html.replace(/\/\*__EMBED_META_START__\*\/[\s\S]*?\/\*__EMBED_META_END__\*\//g,'/*__EMBED_META_START__*/2026-10-12T12:00:00Z/*__EMBED_META_END__*/');
  const replacements={SIGLA_CIDADE:siglas,SUPERVISORES:supervisors,SUPERVISORES_FIXOS:Object.fromEntries(regionals.map(row=>[row.supervisor,{regionais:[row.sigla]}])),EMBED_OS:[],EMBED_REGIONAIS:regionals,EMBED_CONTAS:map?contas:accountRows,EMBED_CONTAS_META:{semRota:0,total:3000,estimado:false},DASHBOARD_GERADO:'2026-10-12',COLETOR:{url:'open_os.json',intervalo:180000,timer:null,erro:false,carregou:false,ultimoLabel:'',ultimaCount:0}};
  if(map){replacements.SUPERVISORES=replacements.SUPERVISORES_FIXOS;replacements.EMBED_CONTAS={especialistas:Object.fromEntries(Object.entries(contas).map(([name,amount],i)=>[name,{contas:amount,regional:regionals[Math.floor(i/3)].sigla,vinculo:'EPV',supervisor:regionals[Math.floor(i/3)].supervisor}]))};}
  html=html.replace(/<script([^>]*)>([\s\S]*?)<\/script>/g,(full,attributes,js)=>/application\/json/.test(attributes)?full:`<script${attributes}>${transformJS(js,replacements)}</script>`);
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.route('**/*',route=>route.abort());await page.setContent(html);
  html=await page.evaluate(({out,map})=>{
   for(const node of document.querySelectorAll('[id^="items-"],[id^="tags-"],.supcards,tbody,#regList,#osList,#tipoLegend,#epvList,#legend'))node.replaceChildren();
   for(const node of document.querySelectorAll('[data-os],.regrow,.supcard,.osc,.kanban-card'))node.remove();
   for(const node of document.querySelectorAll('.khi,.khi2,#metaInfo,#liveSub,#techCount,.tos-count,.kanban-count'))node.textContent='Base fictícia';
   for(const node of document.querySelectorAll('.kval,.rk,.lg-val,.lg-pct,#headerCount'))node.textContent='0';
   for(const node of document.querySelectorAll('[data-v]'))node.removeAttribute('data-v');
   for(const el of document.querySelectorAll('a[href="/"]'))el.href='index.html';
   for(const el of document.querySelectorAll('a[href="/admin"]'))el.href='admin.html';
   for(const el of document.querySelectorAll('a[href="/logout"]'))el.remove();
   for(const el of document.querySelectorAll('link[href*="fonts.google"],link[rel="preconnect"]'))el.remove();
   for(const node of document.querySelectorAll('[data-name],.user-pill'))node.textContent='Visitante Demo';
   for(const [id,label]of Object.entries({themeToggle:'Alternar tema',sidebarToggle:'Alternar filtros',clearBucketBtn:'Limpar filtro',filterIndicatorClear:'Limpar filtro',backOverview:'Voltar à visão geral'}))document.getElementById(id)?.setAttribute('aria-label',label);
   const banner=document.createElement('div');banner.className='public-demo-notice';banner.textContent='DEMONSTRAÇÃO PÚBLICA — Solução desenvolvida para a Orsegups. Dados, nomes e áreas fictícios.';
   const header=document.querySelector('header,.header');header?.after(banner);
   document.title+=' — Demo pública Orsegups';
   const link=document.createElement('link');link.rel='stylesheet';link.href='assets/public-boundary.css';document.head.append(link);
   const script=document.createElement('script');script.src='assets/public-boundary.js';document.head.prepend(script);
   if(map){document.querySelectorAll('link[href*="leaflet"]').forEach(link=>link.href='assets/vendor/leaflet.css');}
   return '<!doctype html>\n'+document.documentElement.outerHTML;
  },{out,map});
  // No external source fetches, and no data-query override to internal APIs.
  html=html.replace(/_qs\.get\('data'\)\s*\|\|\s*window\.COLETOR_URL\s*\|\|\s*/g,'');
  html=html.replaceAll('collector → SQLite','base fictícia').replaceAll('(banco, ao vivo)','(base demonstrativa)').replaceAll('Live: ','Demo: ').replaceAll('Live · ativo','Demo · ativo');
  fs.writeFileSync(path.join(root,out),html);await context.close();
 }
 fs.writeFileSync(path.join(root,'source-manifest.json'),JSON.stringify(manifest,null,2));
 await browser.close();
})();
