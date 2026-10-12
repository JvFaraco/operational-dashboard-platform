const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),crypto=require('node:crypto');
test('CSS copiado permanece igual ao fonte registrado',async()=>{
 const manifest=JSON.parse(fs.readFileSync('docs/source-manifest.json','utf8'));
 for(const [file,record]of Object.entries(manifest.pages)){const html=fs.readFileSync('docs/'+file,'utf8');const hashes=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match=>crypto.createHash('sha256').update(match[1]).digest('hex'));expect(hashes).toEqual(record.cssSha256);}
});
test('menu original apresenta a solução Orsegups e os três módulos',async({page})=>{
 await page.goto('./');await expect(page.getByText(/desenvolvida para a Orsegups/)).toBeVisible();
 for(const name of ['Controle de O.S','Mapa de Rotas','Produtividade'])await expect(page.getByRole('link').filter({has:page.getByRole('heading',{name,exact:true})})).toBeVisible();
});
test('lógica original de OS filtra por supervisor e exporta a seleção',async({page})=>{
 await page.goto('os.html');await expect(page.locator('#kpiTotal')).toHaveText('84');
 await page.locator('.supcard').filter({hasText:'Supervisor Demo A'}).click();await expect(page.locator('#kpiTotal')).toHaveText('28');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#exportBtn').click()]);
 const stream=await download.createReadStream();let body='';for await(const chunk of stream)body+=chunk.toString();expect(body.trim().split(/\r?\n/)).toHaveLength(29);expect(body).toContain('DEMO-0001');
 await page.locator('#resetBtn').click();await expect(page.locator('#kpiTotal')).toHaveText('84');
});
test('produtividade preserva regras de dias da semana e período',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-12T12:00:00Z'));
 await page.goto('produtividade.html');await expect(page.locator('#kpiRow1 .kval').first()).toHaveText('288');
 await page.getByText('Sábado',{exact:true}).click();await page.getByText('Domingo',{exact:true}).click();await expect(page.locator('#kpiRow1 .kval').first()).toHaveText('432');
 await page.locator('.supcard').filter({hasText:'Supervisor Demo A'}).click();await expect(page.locator('#kpiRow1 .kval').first()).toHaveText('144');
 await page.getByText('Este mês',{exact:true}).click();await expect(page.locator('#kpiRow1 .kval').first()).toHaveText('72');
});
test('mapa original renderiza especialistas e permite foco na rota',async({page})=>{
 await page.goto('rotas.html');await expect(page.locator('#loader')).toBeHidden();await expect(page.locator('.epv-item')).toHaveCount(9);await page.locator('.epv-item').first().click();await expect(page.locator('.epv-item.is-selected')).toHaveCount(1);await expect(page.locator('.leaflet-container')).toBeVisible();
});
test('admin original altera somente o exemplo e restaura ao recarregar',async({page})=>{
 await page.goto('admin.html');const button=page.getByRole('button',{name:'Inativar Operador Demo'});await button.click();await expect(page.getByRole('button',{name:'Ativar Operador Demo'})).toBeVisible();await page.reload();await expect(button).toBeVisible();
});
test('admin sem JavaScript mantém formulários inertes',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto('http://127.0.0.1:4175/operational-dashboard-platform/admin.html');
 expect(await page.locator('form input,form button,form select').evaluateAll(controls=>controls.every(control=>control.matches(':disabled')))).toBeTruthy();await context.close();
});
test('mobile preserva telas sem overflow',async({page})=>{
 for(const width of [390,320]){await page.setViewportSize({width,height:844});for(const file of ['index.html','os.html','produtividade.html','rotas.html','admin.html']){await page.goto(file);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}}
});
test('telas originais funcionam sem APIs externas, mesmo sem tiles',async({page})=>{
 const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>{const url=route.request().url();if(url.startsWith('http://127.0.0.1:4175/')||url.startsWith('data:'))return route.continue();if(route.request().resourceType()!=='image')external.push(url);return route.abort();});
 for(const file of ['index.html','os.html','produtividade.html','rotas.html','admin.html']){await page.goto(file);await page.waitForLoadState('networkidle');}
 expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('aviso e dados da demonstração nunca desaparecem no download HTML',async({page})=>{
 await page.goto('os.html');await expect(page.locator('#kpiTotal')).toHaveText('84');const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#downloadHtmlBtn').click()]);const stream=await download.createReadStream();let html='';for await(const chunk of stream)html+=chunk.toString();expect(html).toContain('Orsegups');expect(html).toContain('Técnico Demo 01');expect(html).not.toContain('MARIO CELSO IZIDORO');
});
