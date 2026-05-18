document.addEventListener('DOMContentLoaded', function(){

  const root = document.documentElement;
  const themeBtn = document.getElementById('themeBtn');
  const themeIcon = document.getElementById('themeIcon');
  const gearBtn = document.getElementById('gearBtn');
  const gearMenu = document.getElementById('gearMenu');
  const footerDate = document.getElementById('footerDate');

  // Footer
  if (footerDate) {
    footerDate.textContent =
      new Date().toLocaleDateString('pt-BR', {
        day:'2-digit',
        month:'long',
        year:'numeric'
      });
  }

  // Tema
  function applyTheme(theme){
    root.setAttribute('data-theme', theme);
    localStorage.setItem('a365-home-theme', theme);

    if(themeIcon){
      themeIcon.innerHTML =
        theme === 'dark'
        ? '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>'
        : '<circle cx="12" cy="12" r="5"/>';
    }
  }

  applyTheme(localStorage.getItem('a365-home-theme') || 'dark');

  // Botão tema
  if(themeBtn){
    themeBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();

      const current = root.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Dropdown
  if(gearBtn && gearMenu){

    gearBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();

      gearMenu.classList.toggle('open');
    });

    gearMenu.addEventListener('click', function(e){
      e.stopPropagation();
    });

    document.addEventListener('click', function(){
      gearMenu.classList.remove('open');
    });
  }

});