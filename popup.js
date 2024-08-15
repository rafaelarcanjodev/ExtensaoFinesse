let alertSound = new Audio(chrome.runtime.getURL('audio/alarm.mp3'));
alertSound.loop = true;
let isAudioPlaying = false;

// Listen when popup is open
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const logoutButton = document.getElementById('logout');
  const loginDiv = document.getElementById('login-div');
  const contentDiv = document.getElementById('content-div');

  getFinesseStatusFront().then(result => {
    if (result) {
      showDiv(contentDiv);
      hideDiv(loginDiv);
      getFinesseStatusFront();

    } else {
      showDiv(loginDiv);
      hideDiv(contentDiv);

      // Listen when form button tois pressed, to save new credentials
      loginForm.addEventListener('submit', (event) => {
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
              alert('Credenciais salvas com sucesso!');
              getFinesseStatusFront();

            } else {
              alert('Falha ao salvar as credenciais.');
            }
          });

        } else {
          alert("Preencha todos os campos");
        }
      });
    }
  });
});

// Listen Audio Messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  alert("abriu");

  if (message.action === "playAudioNotReady") {
    playAudio("Telefone Desconectado - Status Não Pronto");
  }
  else if (message.action === "playAudioDeviceError") {
    playAudio("Telefone Desconectado - Verifique a VPN / Cisco Jabber / Finesse")
  }
  else if (message.action === "playAudioIntervalTimeExceed") {
    playAudio("Você está a X minutos com o telefone em pausa, gostaria de seguir em intervalo?")
  }
  else if (message.action === "stopAudio") {
    stopAudio();
  }
});


// Listen button Logout
logoutButton.addEventListener('click', (event) => {
  event.preventDefault();
  logout();
});

function getFinesseStatusFront() {
  return getFinesseStatusBackground()
    .then(finesse => {
      if (finesse) {
        logedIn(finesse);
        return true;
      } else {
        alert("No Finesse data returned.");
        return false;
      }
    })
    .catch(error => {
      alert("Error retrieving Finesse Status:", error);
      return false;
    });
}

function playAudio(message) {
  alert(message);
  if (!isAudioPlaying) {
    audio.play().catch((error) => {
      console.error("Erro ao reproduzir o áudio: ", error);
      alert("3");
    });
    isAudioPlaying = true;
  }
}

function stopAudio() {
  alert("Conexão Reestabelecida");
  if (isAudioPlaying) {
    audio.pause();
    audio.currentTime = 0;
    isAudioPlaying = false;
  }
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