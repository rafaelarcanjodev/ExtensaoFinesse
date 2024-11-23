// Listen when popup is open
document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('login-form');
  const loginDiv = document.getElementById('login-div');
  const contentDiv = document.getElementById('content-div');
  const timerPrincipal = document.getElementById('timerPrincipal');

  getTimerBackend().then(timer => { 
    timer = parseInt(timer, 10);
    timer = timer / 60000;
    timerPrincipal.value = timer;
  });
  
  getFinesseStatusFront().then(result => {
    if (result) {
      showDiv(contentDiv);
      hideDiv(loginDiv);
      logedIn(result);

    } else {
      showDiv(loginDiv);
      hideDiv(contentDiv);

      // Listen form button is pressed, to save new credentials
      formLogin.addEventListener('submit', (event) => {
        event.preventDefault();
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
          }, function (response) {
            if (response.success) {
              alert("Credenciais salvas com sucesso!");
              getFinesseStatusFront();

            } else {
              alert("Falha ao salvar as credenciais.");
            }
          });

        } else {
          alert("Preencha todos os campos");
        }
      });
    }
  });
});


//Listen form button is pressed, to save new credentials
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

async function getFinesseStatusFront() {
  return await connectApiFinesse();
}

async function getTimerBackend() {
  return await getTimer();
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

function logedIn(finesse) {
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

  // Clear credentials
  removeCredentials();
  showDiv(loginDiv);
  hideDiv(contentDiv);
}


// function colorCircleStatus(status) {
//   const applicationOpenDiv = document.getElementById('application-open-div');
//   const applicationClosedDiv = document.getElementById('application-closed-div');

//   if (status == true) {
//     applicationOpenDiv.classList.remove('hidden');
//     applicationClosedDiv.classList.add('hidden');
//   } else if (status == false) {
//     applicationClosedDiv.classList.remove('hidden');
//     applicationOpenDiv.classList.add('hidden');
//   } else {
//     applicationClosedDiv.classList.add('hidden');
//     applicationOpenDiv.classList.add('hidden');
//   }
// }