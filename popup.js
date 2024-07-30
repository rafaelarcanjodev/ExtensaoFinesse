// Form Login and Logout Event Listener
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const logoutButton = document.getElementById('logout');

  // Recover Credentials
  getCredentials((username, password, agentId) => {
    if (username && password && agentId) {
      // Login
      login(username, password, agentId);

    } else if (loginForm && logoutButton) {
      // Login
      loginForm.addEventListener('submit', (event) => {
        event.preventDefault();      
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const agentId = document.getElementById('agentId').value;

        if (username && password && agentId){
          saveCredentials(username, password, agentId);
          var finesse = login(username, password, agentId);

        } else{
          alert("Preencha todos os campos");
        }
      });
    } else {
      alert("Entre em contato com a equipe de desenvolvimento: rafael.arcanjo@totvs.com.br");
    }
  }); 

  // Logout
  logoutButton.addEventListener('click', (event) => {
    event.preventDefault();
    logout();
  });

});

async function login(username, password, agentId) {
  var loginDiv = document.getElementById('loginDiv');
  var contentDiv = document.getElementById('content');

  try {
    const finesse = await connection(username, password, agentId);

    if (finesse) {
      hideDiv(loginDiv);
      showDiv(contentDiv);
    }

  } catch (error) {
    alert('Erro, verifique a VPN e as credenciais' + error);
  }
}

function logout() {  
  const loginDiv = document.getElementById('loginDiv');
  const contentDiv = document.getElementById('content');

  // Clear credentials
  removeCredentials();
  showDiv(loginDiv);
  hideDiv(contentDiv);
}

function showDiv(showDiv) {
  if (showDiv) {
    showDiv.classList.remove('hidden');
  } else {
    console.error("Elemento para mostrar não encontrado.");
  }
}

function hideDiv(hideDiv) {
  if (hideDiv) {
    hideDiv.classList.add('hidden');
  } else {
    console.error("Elemento para ocultar não encontrado.");
  }
}