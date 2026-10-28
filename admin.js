document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificar si existe una sesión activa
  const sessionData = JSON.parse(localStorage.getItem('fn_admin_session'));

  if (!sessionData || !sessionData.user) {
    // Si no ha iniciado sesión, reorientar al login en la raíz
    window.location.href = '../index.html';
    return;
  }

  // 2. Mapear roles para mostrar el nombre formal
  const userRole = sessionData.user;
  const roleNames = {
  "ceo": "CEO",
  "analista": "Analista",
  "coach": "Coach",
  "decanoFN1": "Decano FN1",
  "decanoFN2": "Decano FN2",
  "manager": "Manager"
};

  const formattedName = roleNames[userRole] || userRole.toUpperCase();

  // 3. Colocar el saludo con el nombre de quien entró
  const welcomeUserEl = document.getElementById('welcomeUser');
  const headerWelcomeEl = document.getElementById('headerWelcome');

  if (welcomeUserEl) welcomeUserEl.textContent = formattedName;
  if (headerWelcomeEl) headerWelcomeEl.textContent = `¡BIENVENIDO, ${formattedName}!`;

  // 4. Botón Cerrar Sesión
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('fn_admin_session');
      window.location.href = '../index.html';
    });
  }
});

// 5. Función para cambiar la página cargada en el área principal
function loadPage(url, btnElement) {
  const iframe = document.getElementById('adminIframe');
  const currentViewTitle = document.getElementById('currentViewTitle');
  
  if (iframe) {
    iframe.src = url;
  }

  if (currentViewTitle && btnElement) {
    const pageName = btnElement.innerText.trim();
    currentViewTitle.textContent = `Mostrando: ${pageName}`;
  }

  // Marcar botón activo
  const buttons = document.querySelectorAll('.admin-nav-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  if (btnElement) {
    btnElement.classList.add('active');
  }
}