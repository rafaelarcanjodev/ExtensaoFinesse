// Garante que o Pop Up foi aberto
document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('login-form');
  const loginDiv = document.getElementById('login-div');
  const timerPrincipal = document.getElementById('timerPrincipal');
  const snackBar = document.getElementById("snack-bar");  
  const contentDiv = document.getElementById('content-div');  
  const loadingModal = document.getElementById('loading-modal');

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
      event.preventDefault();
      
      showDiv(loadingModal);
      hideDiv(snackBar);
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const agentId = document.getElementById('agentId').value;        

      if (username && password && agentId) {
        
        chrome.runtime.sendMessage({
          action: 'saveCredentials',
          data: {
            username: username,
            password: password,
            agentId: agentId
          }
        },    
        function (response) {     
          console.log(response);           
          try{
            if (!response) throw new Error("Sem resposta do servidor");

            if (response.success) {
              hideDiv(loadingModal);
              showDiv(contentDiv);
              hideDiv(loginDiv);        
              agentStatus(result);
              alert("Credenciais salvas com sucesso!");
            } else { 
              throw new Error("Erro ao salvar credenciais");            
            }         
          }
          catch (error){
            console.log("entrou no catch");
            console.log(error);
            hideDiv(loadingModal);
            extensionNotification(error.message,'snack-bar');
            showDiv(snackBar);
            loginFormDataRecover(username,password,agentId);
          }  
        
        }); 

      } else {
        hideDiv(loadingModal);
        extensionNotification("Preencha todos os campos",'snack-bar');
        showDiv(snackBar);
      }
    });
  }
});
}); 




// Função para Salvar o Timer
const formTimer = document.getElementById('timer-form');
const snackBar = document.getElementById('snack-bar-home');
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
        extensionNotification("Timer salvo com sucesso!",'snack-bar-home');
        showDiv(snackBar);

      } else {
        console.log(response);
        extensionNotification("Falha ao salvar o timer",'snack-bar-home');
    }
    });
  } else {
    extensionNotification("Preencha todos os campos",'snack-bar-home');
  }
});

// Função que verifica a conexão com o Finesse no Backend usando callback
async function getFinesseStatusFront(callback) {
  connectApiFinesse((error, response) => {
      if (error) {
          console.log("Erro capturado no popup:", error);
          extensionNotification("Verifique a VPN, Cisco, Finesse e Credenciais", 'snack-bar', 15000);
          showDiv(snackBar);
          callback(error, false);
          return;
      }

      console.log("Resposta da API:", response); // Depuração

      if (response && response.status >= 200 && response.status < 300) {
          console.log("Conectado com sucesso. Status:", response.status);
          callback(null, response.data); // Retorna os dados para `agentStatus()`
      } else {
          console.log("Erro capturado no popup: Status HTTP " + response.status);
          extensionNotification("Falha no Login. Verifique VPN, Cisco, Finesse e Credenciais", 'snack-bar', 15000);
          showDiv(snackBar);
          callback("Falha na conexão", false);
      }
  });
}


/* // Função Assincrona que busca o timer no Backend
async function getCredentialsBackend() {
  return await getCredentials();
}

getCredentialsBackend(async (username, password, agentId) => {
  if (username && password && agentId) {
      loginFormDataRecover(username,password,agentId);
  } else{
    console.log("credenciais Não Disponiveis");
  }
});
 */


// Função Assincrona que busca o timer no Backend
async function getTimerBackend() {
  return await getTimer();
}

// Função recursiva para mostrar Div
function showDiv(showDiv) {
  if (showDiv) {
    showDiv.classList.remove('d-none');
  } else {
    console.log("Elemento para mostrar não encontrado: " + showDiv);
    extensionNotification("Favor reiniciar extensão");
  }
}

// Função Recursiva para esconder div
function hideDiv(hideDiv) {
  if (hideDiv) {
    hideDiv.classList.add('d-none');
  } else {
    console.log("Elemento para ocultar não encontrado: " + hideDiv);
    extensionNotification("Favor reiniciar extensão");
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
    extensionNotification("Falha ao carregar objeto do finesse","snack-bar");
  }
}


const buttonLoggout = document.getElementById("button-logout");
buttonLoggout.addEventListener("click", function(event) {
    event.preventDefault();

      try{
      const loginDiv = document.getElementById('login-div');
      const contentDiv = document.getElementById('content-div');

      // Limpa Credenciais
      removeCredentials();
      showDiv(loginDiv);
      hideDiv(contentDiv);
      return true;

      }catch(error){
        console.log(error);
        alert("Erro ao sair da Aplicação");
      }
    }
)

//Valor limpo pra poder, usar o clear timeout, limpar o "cache" e colocar uma mensagem em cima da outra se for necessário.
let notificationTimeout;

function extensionNotification(message = 'Error', elementId = 'snack-bar', time = 3000){  
  let errorMessage = document.getElementById(elementId);
  errorMessage.textContent = message;

  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    errorMessage.textContent = '';
  }, time);
}