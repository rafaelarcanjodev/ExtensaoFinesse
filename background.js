// let buzzerInterval;

// // Função para iniciar o intervalo de verificação
// function startInterval() {
//   buzzerInterval = setInterval(() => {
//     chrome.tabs.query({ url: "https://sncfinesse2.totvs.com.br/*" }, (tabs) => {
//       if (tabs.length > 0) {
//         chrome.tabs.sendMessage(tabs[0].id, { action: "checkButtonState" }, (response) => {
//           if (response && response.status !== "Pronto") {
//             chrome.tabs.sendMessage(tabs[0].id, { action: "playAudio" });
//           } else {
//             chrome.tabs.sendMessage(tabs[0].id, { action: "stopAudio" });
//           }
//         });
//       } else {
//         clearInterval(buzzerInterval);
//       }
//     });
//   }, 5000); // Verifica a cada 5 segundos
// }

// // Inicia o intervalo quando a extensão é instalada ou atualizada
// chrome.runtime.onInstalled.addListener(() => {
//   startInterval();
// });

// // Escuta o evento quando a aba é atualizada
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === "complete" && tab.url.startsWith("https://sncfinesse2.totvs.com.br/")) {
//     startInterval();
//   }
// });

// // Escuta mensagens do popup para parar o áudio temporariamente
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "stopAudio") {
//     chrome.tabs.query({ url: "https://sncfinesse2.totvs.com.br/*" }, (tabs) => {
//       if (tabs.length > 0) {
//         chrome.tabs.sendMessage(tabs[0].id, { action: "stopAudio" });
//       }
//     });
//   }
// });



function saveCredentials(username, password, agentId) {
    // Verify that chrome.storage is working
    if (chrome && chrome.storage && chrome.storage.local) {
      
        chrome.storage.local.set({ username, password, agentId }, function() {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return false
            } else {
                alert('Credenciais salvas de forma segura.');
                return true;
            }
        });
    } else {
      alert('chrome.storage.local não está disponível.');
    }
  }  

function getCredentials(callback) {
    // Verify that chrome.storage is working
    if (chrome && chrome.storage && chrome.storage.local) {

        chrome.storage.local.get(['username', 'password', 'agentId'], function(items) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return false;
            }
            callback(items.username, items.password, items.agentId);
        });
    } else {
        alert('chrome.storage.local não está disponível.');
    }
}

function removeCredentials() {
    chrome.storage.local.remove(['username', 'password', 'agentId'], function() {
        alert('Credenciais removidas.');
    });
}