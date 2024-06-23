let audio = new Audio('https://cms-artifacts.motionarray.com/content/motion-array/924336/Countdown_mp3_1710861138.mp3?Expires=2026221286420&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=aRbr9cwjumQmW-JPq7b6TA2WX0yDRbQ9NCWjbK8v8lrVkTaG7BOZ7riMSWLG5afFZjo8bZVFgshIp71G-~JJIn7Nffcwdg-1kDvesLCT4VgRC2yqOspADLp-PDbf6am6dl44dcRgSNOWykZKAgCdu0QaZvKBuyOvBH2N1M7NhoiNaBXlBE3~TxUzvOCoBgS5ZTfacVRlY42ecsu7q95a79LExqudl8QwP59H~oGmnhVCRrwnHoiLmfLJ-CNZo2FfT4H5Lqs1EHpuCLDEuNkar1jooxtvH2O3nGnZVj7AHqaGUmQc9rbMAQov3yPR~Z5xnu0a-xcKRSSaab2Ea-KBMw__');
audio.loop = true;
let isAudioPlaying = false;
let buzzerInterval;

// Function Play Audio
function playAudio() {
  if (!isAudioPlaying) {
    audio.play().catch((error) => {
      console.error("Erro ao reproduzir o áudio: ", error);
    });
    isAudioPlaying = true;
  }
}

// Function Stop Audio
function stopAudio() {
  if (isAudioPlaying) {
    audio.pause();
    audio.currentTime = 0;
    isAudioPlaying = false;
  }
}

// Verify button periodically
function checkButtonState() {
  const divStatusTelefone = document.getElementById("voice-state-select-headerOptionText");
  const divWithoutConnection = document.getElementsByClassName('ft-sz-14 text-center alertbanner-content-1YOV6');
  
  const divFailToConect = document.getElementById("spinner_modal_message");

  if (
        (divStatusTelefone && divStatusTelefone.innerText.trim() !== "Pronto")||
        (divWithoutConnection && divWithoutConnection[0].innerText == true)||
        (divFailToConect && divFailToConect.innerText.trim() == "Falha ao conectar ao telefone. Nova tentativa de início de sessão em 60 segundos")    
    ) {

    playAudio();
    createPopUp();

    // Define Alarm Interval
    if (!buzzerInterval) {
      buzzerInterval = setInterval(() => {
        playAudio();
      }, 1000); // Define seconds of play interval
    }

  } else {
    stopAudio();
    clearPopUp();
    clearInterval(buzzerInterval);
    buzzerInterval = null;
  }
}


function createPopUp() {
  if (document.getElementById('custom-alert')) return;

  const alertDiv = document.createElement('div');
  alertDiv.id = 'custom-alert';
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '0';
  alertDiv.style.left = '0';
  alertDiv.style.width = '100%';
  alertDiv.style.height = '100%';
  alertDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
  alertDiv.style.display = 'flex';
  alertDiv.style.alignItems = 'center';
  alertDiv.style.justifyContent = 'center';
  alertDiv.style.zIndex = '10000';

  const alertContent = document.createElement('div');
  alertContent.style.backgroundColor = 'white';
  alertContent.style.padding = '20px';
  alertContent.style.borderRadius = '10px';
  alertContent.style.textAlign = 'center';
  alertContent.innerHTML = `
    <h2>Aviso</h2>
    <p>O telefone caiu</p>
    <button id="back-button">Estou de Volta</button>
  `;

  alertDiv.appendChild(alertContent);
  document.body.appendChild(alertDiv);

  document.getElementById('back-button').addEventListener('click', () => {
    document.body.removeChild(alertDiv);
    clearInterval(buzzerInterval);
    stopAudio();
    // Send command to background.js for stop Audio.
    chrome.runtime.sendMessage({ action: "stopAudio" });
  });
}

// Clear Pop Up
function clearPopUp() {
  const alertDiv = document.getElementById('custom-alert');
  if (alertDiv) {
    document.body.removeChild(alertDiv);
  }
}

// Hear messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkButtonState") {
    checkButtonState();
    // Return actual state of button
    sendResponse({ status: document.getElementById("voice-state-select-headerOptionText").innerText.trim() });
  } else if (message.action === "playAudio") {
    playAudio();
  } else if (message.action === "stopAudio") {
    stopAudio();
    clearCustomAlert();
    clearInterval(buzzerInterval);
    buzzerInterval = null;
  }
});

// Verify button periodically
setInterval(checkButtonState, 5000);
checkButtonState();

// Verify when change tabs on navigator
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkButtonState();
  } else {
    stopAudio();
    clearCustomAlert();
    clearInterval(buzzerInterval);
    buzzerInterval = null;
  }
});
