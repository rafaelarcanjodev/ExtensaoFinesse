// Escuta o clique no botão no popup para parar o áudio
document.getElementById("stopAudioBtn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "stopAudio" });
  });
  