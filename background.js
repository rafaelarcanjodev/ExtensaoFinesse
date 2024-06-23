let buzzerInterval;

// Função para iniciar o intervalo de verificação
function startInterval() {
  buzzerInterval = setInterval(() => {
    chrome.tabs.query({ url: "https://sncfinesse2.totvs.com.br/*" }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "checkButtonState" }, (response) => {
          if (response && response.status !== "Pronto") {
            chrome.tabs.sendMessage(tabs[0].id, { action: "playAudio" });
          } else {
            chrome.tabs.sendMessage(tabs[0].id, { action: "stopAudio" });
          }
        });
      } else {
        clearInterval(buzzerInterval);
      }
    });
  }, 5000); // Verifica a cada 5 segundos
}

// Inicia o intervalo quando a extensão é instalada ou atualizada
chrome.runtime.onInstalled.addListener(() => {
  startInterval();
});

// Escuta o evento quando a aba é atualizada
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.startsWith("https://sncfinesse2.totvs.com.br/")) {
    startInterval();
  }
});

// Escuta mensagens do popup para parar o áudio temporariamente
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "stopAudio") {
    chrome.tabs.query({ url: "https://sncfinesse2.totvs.com.br/*" }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "stopAudio" });
      }
    });
  }
});
