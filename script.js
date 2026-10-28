// Credenciales autorizadas
const USERS = {
  "ceo": "yeiko2026fn",
  "analista": "brayan2026fn",
  "coach": "alex2026fn",
  "decanoFN1": "cesarFN",
  "decanoFN2": "oswaldFN",
  "manager": "aby2026fn"
};

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const toggleBtn = document.getElementById('toggleBtn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorMsg = document.getElementById('errorMessage');
  const card = document.getElementById('loginCard');

  // Ocultar mensaje de error cuando el usuario vuelva a escribir
  usernameInput.addEventListener('input', hideError);
  passwordInput.addEventListener('input', hideError);

  // Botón para alternar visibilidad de contraseña
  toggleBtn.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.textContent = 'OCULTAR';
    } else {
      passwordInput.type = 'password';
      toggleBtn.textContent = 'VER';
    }
  });

  // Procesar inicio de sesión
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const userVal = usernameInput.value.trim().toLowerCase();
    const passVal = passwordInput.value;

    if (USERS[userVal] && USERS[userVal] === passVal) {
      // Guardar sesión activa en localStorage
      const sessionData = {
        user: userVal,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('fn_admin_session', JSON.stringify(sessionData));

      // Redirigir al panel principal
      window.location.href = 'pages/admin.html';
    } else {
      // Mostrar alerta y ejecutar animación
      errorMsg.style.display = 'block';
      card.classList.remove('shake');
      void card.offsetWidth; // Forzar reflow de animación
      card.classList.add('shake');
    }
  });

  function hideError() {
    errorMsg.style.display = 'none';
  }
});