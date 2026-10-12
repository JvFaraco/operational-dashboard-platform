// Public demo boundary: the original UI reads its original contracts, but
// requests can only reach the four bundled fictional datasets.
(()=>{
 const original=window.fetch.bind(window),allowed=new Set(['open_os.json','finished_os.json','regionais.json','route_account_volumes.json']);
 window.fetch=(input,options)=>{const url=new URL(typeof input==='string'?input:input.url,location.href);if(url.origin!==location.origin||!allowed.has(url.pathname.split('/').pop()))return Promise.reject(new Error('Fonte não disponível na demonstração pública'));return original(url,options);};
 document.addEventListener('DOMContentLoaded',()=>{const button=document.getElementById('themeToggle');if(button&&!button.textContent.trim())button.textContent='◐';});
})();
