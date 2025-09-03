// =========================================================
// URLs monitoradas
// =========================================================

const urls = ["https://sncfinesse1.totvs.com.br:8445/*", "https://sncfinesse2.totvs.com.br:8445/*"];

// =========================================================
//  Inicia Intervalo de verificação com API Alarms
//  Somente se encontrar as URLs do Finesse
// =========================================================

startInterval("checkAgentStatus");

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "checkAgentStatus") {
    verifyTabsActive((isActiveTabFound) => {
      if (isActiveTabFound == true) {
        checkAgentStatus();
      }
    });
  }
});

function verifyTabsActive(callback) {
  chrome.tabs.query({ url: urls }, (tabs) => {
    if (tabs.length > 0) {
      callback(true);
    } else {
      callback(false);
    }
  });
}

// =========================================================
//  Funções do Intervalo de Verificação
// =========================================================

async function startInterval(nameAlarm) {
  var standartTimer = await getTimer("standart-timer");
  var nameAlarm = nameAlarm || "checkAgentStatus";

  if (standartTimer == null) {
    setTimer(5, "standart-timer");
    setTimer(30, "pause-timer");
    standartTimer = await getTimer("standart-timer");
  }

  log("### Intervalo de verificação [" + nameAlarm + "] iniciado com sucesso. Timer: " + standartTimer);
  chrome.alarms.create(nameAlarm, { periodInMinutes: standartTimer });
}

function stopinterval(nameAlarm) {
  chrome.alarms.clear(nameAlarm, (wasCleared) => {
    if (wasCleared) {
      log("### Intervalo de verificação [" + nameAlarm + "] parado com sucesso.");
    } else {
      log("### Não foi possível parar o intervalo de verificação [" + nameAlarm + "].");
      stopAllIntervals();
    }
  });
}

function stopAllIntervals() {
  chrome.alarms.clearAll((wasCleared) => {
    if (wasCleared) {
      log("### Todos os intervalos de verificação parados com sucesso.");
    } else {
      log("### Não foi possível parar todos os intervalo de verificação");
    }
  });
}

// =========================================================
//  Funções dos Timers da Extensão
// =========================================================

async function getTimer(type) {
  return new Promise((resolve, reject) => {
    item = chrome.storage.local.get([type], function (item) {
      if (chrome.runtime.lastError) {
        log(chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      }

      var timer = parseInt(item[type], 10);

      if (timer == null || timer == undefined || isNaN(timer)) {
        log("### Não é possível consultar timer [" + type + "] com valor inválido: " + timer);
        resolve(null);
      } else {
        log("### Timer [" + type + "] recuperado de forma segura com o valor: " + item[type] + " minutos");
        resolve(timer);
      }
    });
  });
}

async function setTimer(timer, type) {
  return new Promise((resolve, reject) => {
    if (timer == null || timer == undefined || isNaN(timer)) {
      log("### Não é possível salvar o timer [" + type + "] com valor inválido: " + timer);
      reject(false);
    } else {
      chrome.storage.local.set({ [type]: timer }, () => {
        log("### Timer [" + type + "] salvo de forma segura com o valor: " + timer + " minutos");
        resolve(true);
      });
    }
  });
}

// =========================================================
// Funções que escutam mensagens enviadas do formulário (popup)
// Para serem executadas no service worker (background)
// =========================================================

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "setCredentials") {
    const { username, password, agentId } = message.data;
    setUserCredential(username, password, agentId)
      .then((response) => {
        sendResponse({ success: response });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.action === "setTimer") {
    const { timer, type } = message.data;
    setTimer(timer, type)
      .then((response) => {
        stopinterval("checkAgentStatus");
        startInterval("checkAgentStatus");
        sendResponse({ success: response });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});

// =========================================================
//  Verificar Status do Agente
// =========================================================

function checkAgentStatus() {
  getUserCredentialsAndConnect()
    .then(async (finesse) => {
      if (!finesse) {
        log("Finesse não retornou informações");
        return;
      }

      log("### Iniciando Verificação do Status do Agente");
      var reasonCodeId = finesse.reasonCodeId ? finesse.reasonCodeId["text"] : null;
      reasonCodeId = parseInt(reasonCodeId);
      var finesseState = finesse.state ? finesse.state["text"] : null;
      var standartTimer = await getTimer("standart-timer");
      var pauseTimer = await getTimer("pause-timer");
      var countTimer = (pauseTimer - standartTimer) * 60000;

      if (reasonCodeId == -1) {
        log("### Primeira Condição " + reasonCodeId + " - " + finesseState);
        notification("playAudioNotReady");
        tabActiveFocus();
      } else if (reasonCodeId > 0 && reasonCodeId < 23) {
        stopinterval("checkAgentStatus");
        log("### Iniciando Contador de Pausa: " + countTimer);

        setTimeout(function () {
          log("### Segunda Condição " + reasonCodeId + " - " + finesseState);
          notification("playAudioIntervalTimeExceed", pauseTimer);
          tabActiveFocus();
          startInterval("checkAgentStatus");
        }, countTimer);
      } else if ([28, 23].includes(reasonCodeId)) {
        log("### Terceira Condição " + reasonCodeId + " - " + finesseState);
        notification("playAudioDeviceError");
        tabActiveFocus();
      } else if (finesseState == "NOT_READY") {
        log("### Quarta Condição " + reasonCodeId + " - " + finesseState);
        notification("playAudioNotReady");
        tabActiveFocus();
      }
    })
    .catch((error) => {
      log("### Erro ao recuperar Status do Finesse:", error);
    });
}

// =========================================================
//  Funções de set, get e delete do Usuário
// =========================================================

async function setUserCredential(username, password, agentId) {
  try {
    const finesse = await connectApiFinesse(username, password, agentId);

    if (finesse?.ApiErrors) {
      log("### Erro ao conectar ao Finesse:", finesse.ApiErrors);
      return finesse;
    }

    if (finesse?.firstName) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ username, password, agentId }, () => {
          if (chrome.runtime.lastError) {
            log("### Erro ao salvar credenciais no navegador:", chrome.runtime.lastError);
            reject(false);
          } else {
            log("### Credenciais salvas de forma segura.");
            resolve(true);
          }
        });
      });
    } else {
      log("### Erro ao conectar ao Finesse: resposta inesperada");
      return finesse;
    }
  } catch (error) {
    log("### Erro na conexão com Finesse:", error);
    return finesse.status;
  }
}

function getUserCredential(callback) {
  items = chrome.storage.local.get(["username", "password", "agentId"], function (items) {
    if (chrome.runtime.lastError) {
      log(chrome.runtime.lastError);
      return false;
    }
    callback(items.username, items.password, items.agentId);
  });
}

async function getUserCredentialsAndConnect() {
  return new Promise((resolve, reject) => {
    getUserCredential(async (username, password, agentId) => {
      if (username && password && agentId) {
        try {
          var finesse = await connectApiFinesse(username, password, agentId);
          log(finesse);
          resolve(finesse);
        } catch (error) {
          log("Erro na função getUserCredentialsAndConnect:" + error);
          reject(finesse);
        }
      } else {
        resolve(null);
      }
    });
  });
}

async function deleteUserCredential() {
  chrome.storage.local.remove(["username", "password", "agentId"], function () {
    log("### Credenciais removidas.");
    stopinterval("checkAgentStatus");
    window.location.reload();
  });
}

// =========================================================
//  Conexão com API Finesse
// =========================================================

async function connectApiFinesse(username, password, agentId) {
  log("### Iniciando conexão API Finesse");
  const url = "https://sncfinesse1.totvs.com.br:8445/finesse/api/User/" + agentId + "/";
  log("### " + url);
  const credentials = btoa(`${username}:${password}`);

  const controller = new AbortController();
  const signal = controller.signal;
  const timeout = 2000; // 2 segundos
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const options = {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    signal,
  };

  try {
    const response = await fetch(url, options);
    log(response);

    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`### [connectApiFinesse] Response Not Okay. status: ${response.status}`);
    }

    const data = await response.text();
    const finesse = xmlToJson(data);
    return finesse;
  } catch (error) {
    log("### [connectApiFinesse] Erro na conexão:", error);
    return response;
  }
}

// =========================================================
//  Funções de Notificação
// =========================================================

function notification(message, time) {
  const notifications = {
    playAudioNotReady: "Telefone Desconectado - Status Não Pronto",
    playAudioDeviceError: "Telefone Desconectado - Verifique a VPN / Cisco Jabber / Finesse",
    playAudioIntervalTimeExceed: "Você está a mais de " + time + " minutos com o telefone em pausa",
  };

  if (notifications[message]) {
    sendWindowsNotification(notifications[message]);
  }
}

function sendWindowsNotification(message) {
  clearAllNotifications();
  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: "../icons/icon16.png",
      title: "Notificação Finesse",
      message: message,
    },
    function (notificationId) {
      if (chrome.runtime.lastError) {
        log("Erro ao criar notificação:", chrome.runtime.lastError);
      } else {
        log("Notificação enviada com sucesso.");
      }
    }
  );
}

function clearAllNotifications() {
  chrome.notifications.getAll((notifications) => {
    for (let notificationId in notifications) {
      chrome.notifications.clear(notificationId, (wasCleared) => {});
    }
  });
}

function tabActiveFocus() {
  chrome.tabs.query({ url: urls }, (tabs) => {
    if (tabs && tabs.length > 0) {
      chrome.tabs.update(tabs[0].id, { active: true });
    }
  });
}

chrome.notifications.onClicked.addListener(function (notificationId) {
  chrome.tabs.query({ url: urls }, function (tabs) {
    if (tabs.length > 0) {
      const targetTab = tabs[0];

      chrome.windows.update(targetTab.windowId, { focused: true });
      chrome.tabs.update(targetTab.id, { active: true });
    }
  });
});

// =========================================================
//  Conversão de xml para json
// =========================================================

function xmlToJson(xmlString) {
  function parseNode(xmlNode) {
    const obj = {};

    const tagMatch = xmlNode.match(/<([\w:.-]+)([^>]*)>/);
    if (tagMatch) {
      const tagName = tagMatch[1];
      obj["tagName"] = tagName;

      const attrString = tagMatch[2];
      const attrPattern = /([\w:.-]+)="([^"]*)"/g;
      let match;
      while ((match = attrPattern.exec(attrString)) !== null) {
        obj[match[1]] = match[2];
      }

      const content = xmlNode.replace(/<[\w:.-]+[^>]*>|<\/[\w:.-]+>/g, "");

      if (content.trim()) {
        if (/<[\w:.-]+[^>]*>/.test(content)) {
          obj["children"] = parseXml(content);
        } else {
          obj["text"] = content.trim();
        }
      }
    } else {
      return xmlNode.trim();
    }

    return obj;
  }

  function parseXml(xml) {
    const obj = {};
    const tagPattern = /<([\w:.-]+)[^>]*>.*?<\/\1>/g;
    let match;
    while ((match = tagPattern.exec(xml)) !== null) {
      const node = parseNode(match[0]);
      const tagName = node.tagName;
      delete node.tagName;

      if (obj[tagName]) {
        if (!Array.isArray(obj[tagName])) {
          obj[tagName] = [obj[tagName]];
        }
        obj[tagName].push(node);
      } else {
        obj[tagName] = node;
      }
    }
    return obj;
  }

  return parseXml(xmlString);
}

// =========================================================
// Funções de Log
// Podem ser desativadas em Prod
// =========================================================

function log(...args) {
  const now = new Date();
  const timestamp = formatDate(now);
  console.log(`[${timestamp}]`, ...args);
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}
