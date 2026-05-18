const LABELS = {
  bios:          'Controle de Agenda + RECRED',
  agendadas:     'Agendadas',
  nao_agendadas: 'Não agendadas'
};

// Carrega meta das 3 bases
function renderMeta(){
  fetch('/api/meta').then(r => r.json()).then(metas => {
    const box = document.getElementById('metaBox');
    if(!box) return;
    const linhas = [];
    for(const tipo of ['bios','agendadas','nao_agendadas']){
      const m = metas[tipo];
      const label = LABELS[tipo];
      if(m && m.registros){
        linhas.push(
          '<span><strong>' + label + ':</strong> ' +
          m.registros.toLocaleString('pt-BR') + ' O.S · ' +
          m.atualizado_em +
          (m.usuario ? ' · ' + m.usuario : '') +
          '</span>'
        );
      } else {
        linhas.push(
          '<span class="meta-none"><strong>' + label + ':</strong> sem dados</span>'
        );
      }
    }
    box.innerHTML = linhas.join('');
  }).catch(() => {});
}

renderMeta();

const fileInput = document.getElementById('fileInput');
const btnUp     = document.getElementById('btnUp');
const dzFile    = document.getElementById('dzFile');
const dzName    = document.getElementById('dzFileName');
const progWrap  = document.getElementById('progWrap');
const progFill  = document.getElementById('progFill');
const progLabel = document.getElementById('progLabel');
const dropzone  = document.getElementById('dropzone');
let selectedFile = null;

fileInput.addEventListener('change', e => setFile(e.target.files[0]));
dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('over'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('over'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('over');
  if(e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
});

function setFile(f){
  selectedFile = f;
  dzName.textContent = f.name;
  dzFile.classList.add('show');
  btnUp.disabled = false;
}

btnUp.addEventListener('click', async () => {
  if(!selectedFile) return;
  const tipo = document.querySelector('input[name="baseType"]:checked').value;
  btnUp.disabled = true;
  progWrap.classList.add('show');
  progFill.style.width = '30%';
  progLabel.textContent = 'Enviando arquivo...';
  const fd = new FormData();
  fd.append('arquivo', selectedFile);
  fd.append('tipo_base', tipo);
  try {
    progFill.style.width = '60%';
    const res  = await fetch('/upload', { method: 'POST', body: fd });
    const data = await res.json();
    progFill.style.width = '100%';
    if(data.ok){
      progLabel.textContent = data.registros.toLocaleString('pt-BR') + ' registros carregados com sucesso!';
      toast(data.registros.toLocaleString('pt-BR') + ' O.S carregadas em ' + LABELS[tipo] + '!', 'ok');
      renderMeta();
      // reseta o estado pra permitir novo upload sem reload
      setTimeout(() => {
        progWrap.classList.remove('show');
        progFill.style.width = '0%';
        dzFile.classList.remove('show');
        selectedFile = null;
        fileInput.value = '';
      }, 1800);
    } else {
      progLabel.textContent = 'Erro: ' + (data.erro || 'desconhecido');
      toast('Erro: ' + (data.erro || 'desconhecido'), 'err');
      btnUp.disabled = false;
    }
  } catch(e) {
    progLabel.textContent = 'Falha na conexão com o servidor.';
    toast('Falha na conexão.', 'err');
    btnUp.disabled = false;
  }
});

function toast(msg, type){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.className = '', 3500);
}
