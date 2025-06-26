// Garante que o Pop Up foi aberto
document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('login-form');
  const loginDiv = document.getElementById('login-div');
  const timerPrincipal = document.getElementById('timerPrincipal');
  const contentDiv = document.getElementById('content-div');
  const loadingModal = document.getElementById('loading-modal');

  getTimerBackend().then(timer => {
    timer = parseInt(timer, 10);
    timer = timer / 60000;
    timerPrincipal.value = timer;
  });

  getFinesseStatusFront().then(response => {
    if (response) {
      showDiv(contentDiv);
      hideDiv(loadingModal);
      hideDiv(loginDiv);  
      agentStatus(response);

    } else {
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
              } else { 
                throw new Error("Login Inválido");
              }
            }
            catch (error){
              log("entrou no catch");
              log(error);
              hideDiv(loadingModal);
              sendSnackbarNotification(error.message,'snack-bar');
              loginFormDataRecover(username,password,agentId);
              return false;
            } 
          }); 

        } else {
          hideDiv(loadingModal);
          sendSnackbarNotification("Preencha todos os campos",'snack-bar');
        }
      });
    }
  });
}); 


var formTimer = document.getElementById('timer-form');
var snackBar = document.getElementById('snack-bar-home');

formTimer.addEventListener('change', (event) => {
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
    }, function (timer) { 
        if (timer && timer.success) {
            sendSnackbarNotification("Timer salvo com sucesso!", 'snack-bar-home');
        } else {
            sendSnackbarNotification("Falha ao salvar o timer", 'snack-bar-home');
        }
    });
  } else {
    sendSnackbarNotification("Preencha todos os campos",'snack-bar-home');
  }
});


// Função Assincrona que busca o timer no Backend
async function getTimerBackend() {
  return await getNotificationTimer();
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

  if (finesse) {
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
  }
  else{
    sendSnackbarNotification("Falha ao carregar objeto do finesse","snack-bar");
  }
}

function showCircleStatus(agentStatus){
  const greenCircle = document.getElementById('green-circle-div');
  const redCircle = document.getElementById('red-circle-div');

  if(agentStatus == "READY"){    
    greenCircle.classList.remove('d-none');
    redCircle.classList.add('d-none');

  }else{
    greenCircle.classList.add('d-none');
    redCircle.classList.remove('d-none');
  }
}

const buttonLoggout = document.getElementById("button-logout");
buttonLoggout.addEventListener("click", function(event) {
    event.preventDefault();

      try{
      const loginDiv = document.getElementById('login-div');
      const contentDiv = document.getElementById('content-div');
      const menuDiv = document.getElementById('menu-content');

      removeUserCredential();
      menuDiv.classList.toggle('d-none');
      showDiv(loginDiv);
      hideDiv(contentDiv);
      return true;

      }catch(error){
        log(error);
        alert("Erro ao sair da Aplicação");
      }
    }
)


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


const buttonNotificateWindows = document.getElementById("button-notification");
buttonNotificateWindows.addEventListener("click", function(event) {
    event.preventDefault();

      try{
        log("tentou");
        sendWindowsNotification("teste");
      }catch(error){
        log(error);
        alert("Erro ao notificar, verifique as permissões de notificação da extensão, ou entre em contato com nosso suporte");
      }
    }
)


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