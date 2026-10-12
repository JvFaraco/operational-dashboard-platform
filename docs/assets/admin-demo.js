// Preserve the original admin presentation; server actions are illustrative.
document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();alert('Ação simulada. Esta demo não envia dados nem altera os sistemas da Orsegups.');}));
document.querySelectorAll('[data-demo-form]').forEach(fieldset=>fieldset.disabled=false);
document.querySelectorAll('[data-demo-action]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();alert('Tela demonstrativa. Nenhum cadastro real será alterado.');}));
document.querySelectorAll('[data-demo-toggle]').forEach(button=>button.addEventListener('click',()=>{const status=button.closest('tr').querySelector('[data-demo-status]');const active=status.textContent==='Ativo';status.textContent=active?'Inativo':'Ativo';button.textContent=active?'Ativar':'Inativar';button.setAttribute('aria-label',`${button.textContent} ${button.dataset.demoName}`);}));
