// Garante que o Pop Up foi aberto
document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('login-form');
  const loginDiv = document.getElementById('login-div');
  const contentDiv = document.getElementById('content-div');
  const timerPrincipal = document.getElementById('timerPrincipal');

  // Retorna o timer do backend para apresentar em tela
  getTimerBackend().then(timer => { 
    timer = parseInt(timer, 10);
    timer = timer / 60000;
    timerPrincipal.value = timer;
  });
  
  // Pega o status do agente para definir se irá mostrar tela de login ou a aplicação
  getFinesseStatusFront().then(result => {
    if (result) {
      showDiv(contentDiv);
      hideDiv(loginDiv);
      agentStatus(result);

    } else {
      showDiv(loginDiv);
      hideDiv(contentDiv);

      // Validação de Formulário
      formLogin.addEventListener('submit', (event) => {
        alert("click");
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const agentId = document.getElementById('agentId').value;

        if (username && password && agentId) {
          try{
            chrome.runtime.sendMessage({
              action: 'saveCredentials',
              data: {
                username: username,
                password: password,
                agentId: agentId
              }
            }, 
            
            function (response,username,password,agentId) {              
              if (response.success) {
                log.dir(response);
                console.log(response.success);
                alert("Credenciais salvas com sucesso!");
                getFinesseStatusFront();

              } else {
                loginFormDataRecover(username,password,agentId);
                throw(error);
              }
            });          
          }
          catch (error){
            alert("Falha ao conectar no Finesse" + error);            
            loginFormDataRecover(username,password,agentId);
          }
        } else {
          alert("Preencha todos os campos");
          loginFormDataRecover(username,password,agentId);
        }
      });
    }
  });
});


// Função para Salvar o Timer
const formTimer = document.getElementById('timer-form');
formTimer.addEventListener('submit', (event) => {
  event.preventDefault();

  var timer = document.getElementById('timerPrincipal').value;
  timer = parseInt(timer, 10);
  timer = timer * 60000;

  if (timer) {
    chrome.runtime.sendMessage({
      action: 'saveTimer',
      data: {
        timer: timer
      }
    }, function (response) {
      if (response.success) {
        alert("Timer salvo com sucesso!");

      } else {
        console.log(response);
        alert("Falha ao salvar o timer.");
    }
    });
  } else {
    alert("Preencha todos os campos");
  }
});

// Função Assincrona que verifica a conexão com o Finesse no Backend
async function getFinesseStatusFront() {
  return await connectApiFinesse();
}

// Função Assincrona que busca o timer no Backend
async function getTimerBackend() {
  return await getTimer();
}

// Função recursiva para mostrar Div
function showDiv(showDiv) {
  if (showDiv) {
    showDiv.classList.remove('hidden');
  } else {
    console.error("Elemento para mostrar não encontrado.");
  }
}

// Função Recursiva para esconder div
function hideDiv(hideDiv) {
  if (hideDiv) {
    hideDiv.classList.add('hidden');
  } else {
    console.error("Elemento para ocultar não encontrado.");
  }
}

// Função que recupera Dados do formulário de login
function loginFormDataRecover(username,password,agentId){
  document.getElementById('username').value = username;
  document.getElementById('password').value = password;
  document.getElementById('agentId').value = agentId;
}


// Função que lê objeto do finesse e retorna status do agente
function agentStatus(finesse) {
  var statusDiv = document.getElementById('status-div');
  var agentNameDiv = document.getElementById('agent-name-div');
  var reasonDiv = document.getElementById('reason-div');

  if (finesse) {
    statusDiv.innerText = finesse.state['text'];
    agentNameDiv.innerText = finesse.firstName['text'] + " " + finesse.lastName['text'];

    if (finesse.state['text'] == 'READY') {
      reasonDiv.innerText = finesse.state['text'];
    } else if (finesse.reasonCodeId && finesse.reasonCodeId['text'] == "-1") {
      reasonDiv.innerText = "Não Está Pronto";
    } else if (finesse.reasonCodeId && finesse.reasonCodeId['text'] == "28" || finesse.reasonCodeId['text'] <= "23") {
      reasonDiv.innerText = finesse.label['text'];
    } else if (finesse.reasonCodeId && finesse.reasonCodeId['text'] >= "-1" || finesse.reasonCodeId['text'] <= "22") {
      reasonDiv.innerText = finesse.label['text'];
    } else {
      reasonDiv.innerText = "Finesse Fechado";
    }
  }
  else{
    alert("Falha ao carregar objeto do finesse");
  }
}

function logout() {
  const loginDiv = document.getElementById('login-div');
  const contentDiv = document.getElementById('content-div');

  // Limpa Credenciais
  removeCredentials();
  showDiv(loginDiv);
  hideDiv(contentDiv);
}