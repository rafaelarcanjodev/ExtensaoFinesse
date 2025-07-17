// Garante que o Pop Up foi aberto
document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('login-form');
  const loginDiv = document.getElementById('login-div');
  const standartTimer = document.getElementById('standartTimer');
  const pauseTimer = document.getElementById('pauseTimer');
  const contentDiv = document.getElementById('content-div');
  const loadingModal = document.getElementById('loading-modal');

  getTimerBackend("standartTimer").then(result => {
    standartTimer.value = result;
  });

  getTimerBackend("pauseTimer").then(result => {
    pauseTimer.value = result;
  });
  
  showDiv(loadingModal);

  getFinesseStatusFront().then(response => {
    if (response == null) {

      hideDiv(loadingModal);
      showDiv(loginDiv);
      hideDiv(contentDiv);

      // Validação de Formulário
      formLogin.addEventListener('submit', (event) => {
        event.preventDefault();
        
        showDiv(loadingModal);
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const agentId = document.getElementById('agentId').value;  
        username.trim();
        password.trim();
        agentId.trim();      

        if (username && password && agentId) {
          
          chrome.runtime.sendMessage({
            action: 'saveCredentials',
            data: {
              username: username,
              password: password,
              agentId: agentId
            }
          }, async function (response) {
            log("saveCredentials - Response Front:");
            log(response);

            try{
              if (!response){
                throw new Error("Sem resposta do Servidor");

              } else if (response.success) {
                window.location.reload();              
              } else if (response.success == false) {
                throw new Error("Verifique a VPN, Cisco, Finesse e Credenciais");          
              } else { 
                throw new Error("Login Inválido");
              }
            }
            catch (error){
              log("entrou no catch");
              log(error);
              hideDiv(loadingModal);
              sendSnackbarNotification(error.message);
              loginFormDataRecover(username,password,agentId);
              return false;
            } 
          }); 

        } else {
          hideDiv(loadingModal);
          sendSnackbarNotification("Preencha todos os campos");
        }
      });
    } else {

      showDiv(contentDiv);
      hideDiv(loadingModal);
      hideDiv(loginDiv);  
      agentStatus(response);

    }
  });
}); 


var snackBar = document.getElementById('snack-bar-home');

// Função Assincrona que busca o timer no Backend
async function getTimerBackend(type) {
  return await getTimer(type);
}


// Função que verifica a conexão com o Finesse no Backend usando callback
async function getFinesseStatusFront() {
  return await getUserCredentialsAndConnect();
}


// Função recursiva para mostrar Div
function showDiv(showDiv) {
  if (showDiv) {
    showDiv.classList.remove('d-none');
  } else {
    log("Elemento para mostrar não encontrado: " + showDiv);
    sendSnackbarNotification("Favor reiniciar extensão");
  }
}


// Função Recursiva para esconder div
function hideDiv(hideDiv) {
  if (hideDiv) {
    hideDiv.classList.add('d-none');
  } else {
    log("Elemento para ocultar não encontrado: " + hideDiv);
    sendSnackbarNotification("Favor reiniciar extensão");
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
  var agentNameDiv = document.getElementById('agent-name-div');
  var reasonDiv = document.getElementById('reason-div');

  if (finesse == false) {
    showCircleStatus("NOT READY");
    agentNameDiv.innerText = "Desconectado";
    reasonDiv.innerText = "Verifique a VPN";
    
  } else if (finesse){      
    showCircleStatus(finesse.state['text']);
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
  } else {
    sendSnackbarNotification("Falha ao carregar objeto do finesse","snack-bar");
  }
}


function showCircleStatus(agentStatus){
  const greenCircle = document.getElementById('green-circle-div');
  const redCircle = document.getElementById('red-circle-div');

  if(agentStatus == "READY"){    
    greenCircle.classList.remove('d-none');
    redCircle.classList.add('d-none');

  } else {
    greenCircle.classList.add('d-none');
    redCircle.classList.remove('d-none');
  }
}

//Valor limpo pra poder, usar o clear timeout, limpar o "cache" e colocar uma mensagem em cima da outra se for necessário.
var notificationTimeout;

function sendSnackbarNotification(message = 'Error', elementId = 'snack-bar', time = 3000){  
  var errorMessage = document.getElementById(elementId);
  errorMessage.textContent = message;

  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    errorMessage.textContent = '';
  }, time);
}


function notification(message, timer) {
  const notifications = {
      playAudioNotReady: "Telefone Desconectado - Status Não Pronto",
      playAudioDeviceError: "Telefone Desconectado - Verifique a VPN / Cisco Jabber / Finesse",
      playAudioIntervalTimeExceed: "Você está a " + (timer / 1000) + " segundos com o telefone em pausa"
  };

  if (notifications[message]) {
      sendWindowsNotification(notifications[message]);
  }
}