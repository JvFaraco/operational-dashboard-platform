document.addEventListener('DOMContentLoaded', function(){
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeBtn');
  const themeIcon = document.getElementById('themeIcon');
  const user = document.getElementById('user');
  const pass = document.getElementById('pass');
  const loginBtn = document.getElementById('loginBtn');
  const errorBox = document.getElementById('errorBox');
  const footerDate = document.getElementById('footerDate');

  if (footerDate) {
    footerDate.textContent = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
  }

  function applyTheme(theme){
    root.setAttribute('data-theme', theme);
    localStorage.setItem('a365-login-theme', theme);
    if(themeIcon){
      themeIcon.innerHTML = theme === 'dark'
        ? '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>'
        : '<circle cx="12" cy="12" r="5"/>';
    }
  }

  applyTheme(localStorage.getItem('a365-login-theme') || 'dark');

  if(themeBtn){
    themeBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      const current = root.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  function doLogin(){
    const u = (user.value || '').trim().toLowerCase();
    const p = (pass.value || '').trim();
    if(u === 'admin' && p === '1234'){
      errorBox.classList.remove('show');
      localStorage.setItem('a365_logged_in', '1');
      window.location.href = 'upload.html';
    } else {
      errorBox.classList.add('show');
    }
  }

  if(loginBtn){ loginBtn.addEventListener('click', doLogin); }
  [user, pass].forEach(el => el && el.addEventListener('keydown', e => { if(e.key === 'Enter') doLogin(); }));

  const eyeBtn = document.getElementById('eyeBtn');
  if(eyeBtn && pass){
    eyeBtn.addEventListener('click', function () {
      const visible = pass.type === 'text';
      pass.type = visible ? 'password' : 'text';

      eyeBtn.innerHTML = visible
        ? `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        `
        : `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        `;
    });
  }
});