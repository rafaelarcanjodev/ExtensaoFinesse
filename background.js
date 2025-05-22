var finesseActive = false;
var intervalId;''
var timerVerification = 360000;
var urls = ["https://sncfinesse1.totvs.com.br:8445/*","https://sncfinesse2.totvs.com.br:8445/*"];
var notificationTimer;


// Start extension when tab is updated
chrome.tabs.onUpdated.addListener((changeInfo, tab) => {
    verifyTabsActive(isActiveTabFound => {
        if (isActiveTabFound) {
            console.log("Contador Iniciado por uma atualização da página");
            stopInterval();
            startInterval();
        } else {
            stopInterval();
        }
    });
});


// Salva credenciais e timer
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'saveCredentials') {
        const { username, password, agentId } = message.data;
    
        saveCredentials(username, password, agentId)
        .then((result) => {
            sendResponse({ success: result });
        })
        .catch((error) => {
            log("Erro ao salvar credenciais:", error);
            sendResponse({ success: false, error: error.message });
        });        

        return true;
    }
    
    
    if (message.action === 'saveTimer') {
        const { timer } = message.data;

        saveTimer(timer)
        .then((result) => {
            log("sucesso no then");
            log(result);
            sendResponse({ success: result });
        })
        .catch((error) => {
            sendResponse({ success: false, error: error.message });
        });

        return true;
    }
});



function startInterval() {
    if (!finesseActive && notificationTimer) {
        log("Intervalo de verificação iniciado");
        finesseActive = true;
        intervalId = setInterval(() => {
            verifyTabsActive(isActiveTabFound => {
                if (isActiveTabFound) {
                    checkFinesseStatus(notificationTimer);
                } else {
                    stopInterval();
                }
            });
        }, notificationTimer);
    }
}


function stopInterval() {
    if (intervalId) {
        clearInterval(intervalId);
        finesseActive = false;
        log("Intervalo de verificação interrompido");
    }
}


function verifyTabsActive(callback) {
    chrome.tabs.query({ url: urls }, (tabs) => {
        if (tabs.length > 0) {
            log("Tab encontrada");
            callback(true);
        } else {
            log("Nenhuma tab encontrada");
            callback(false);
        }
    });
}


function focusTab() {
    chrome.tabs.query({ url: urls }, (tabs) => {
        if (tabs && tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { active: true });
        }
    });
}


// Verificam e Enviam as notificações para cada status do agente
function checkFinesseStatus(timer) {
    connectApiFinesse()
    .then(finesse => {
        if (finesse) {
            if (finesse.reasonCodeId && finesse.reasonCodeId['text'] === "-1") {
                notification("playAudioNotReady");
                focusTab();
                stopInterval();
            } else if (finesse.reasonCodeId && finesse.reasonCodeId['text'] >= "1" && finesse.reasonCodeId['text'] <= "22") {
                if (!intervalId) { // Evita múltiplos timers
                    intervalId = setTimeout(() => {
                        notification("playAudioIntervalTimeExceed", timer);
                        focusTab();
                        stopInterval();
                    }, timer);
                }
            } else if (finesse.reasonCodeId && ["28", "23"].includes(finesse.reasonCodeId['text'])) {
                notification("playAudioDeviceError");
                focusTab();
                stopInterval();
            } else if (finesse.state['text'] === 'NOT_READY') {
                notification("playAudioNotReady");
                focusTab();
                stopInterval();
            }
        } else {
            log("Finesse não retornou informações");
        }
    })
    .catch(error => {
        log("Erro ao recuperar Status do Finesse:", error);
    });
}

async function removeUserCredential() {
    chrome.storage.local.remove(['username', 'password', 'agentId'], function () {
        log('Credenciais removidas.');
    });
}


async function saveCredentials(username, password, agentId) {
    try {
        const finesse = await connection(username, password, agentId);
        log("Resposta do Finesse:" + finesse);

        // Verifica se a resposta contém um erro
        if (finesse?.ApiErrors) {
            log("Erro ao conectar ao Finesse:", finesse.ApiErrors);
            return false;
        }

        if (finesse?.firstName) {  
            return new Promise((resolve, reject) => {
                chrome.storage.local.set({ username, password, agentId }, () => {
                    if (chrome.runtime.lastError) {                        
                        log("Erro ao salvar credenciais no navegador:", chrome.runtime.lastError);
                        reject(false);
                    } else {
                        log("Credenciais salvas de forma segura.");
                        resolve(true);
                    }
                });
            });
        } else {
            log("Erro ao conectar ao Finesse: resposta inesperada");
            return false;
        }
    } catch (error) {                                
        log("Erro na conexão com Finesse:", error);
        return false;
    }       
}


function getCredential(callback) {
    if (chrome && chrome.storage && chrome.storage.local) {
        items = chrome.storage.local.get(['username', 'password', 'agentId'], function (items) {
            if (chrome.runtime.lastError) {
                log(chrome.runtime.lastError);
                return false;
            }
            callback(items.username, items.password, items.agentId);
        });
    } else {
        log('chrome.storage.local não está disponível.');
    }
}


function saveTimer(timer) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.set({ timer }, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                log("Timer salvo de forma segura");
                resolve(true);
            });
        } catch (e) {
            reject(e);
        }
    });
}


async function getNotificationTimer() {  
    return new Promise((resolve, reject) => {  
        if (chrome && chrome.storage && chrome.storage.local) {  
            item = chrome.storage.local.get(['timer'], function (item) {  
                if (chrome.runtime.lastError) {  
                    log(chrome.runtime.lastError);  
                    reject(chrome.runtime.lastError); 
                    return;  
                }   
                resolve(item.timer);
            });  
        } else {  
            log('chrome.storage.local não está disponível.');  
            reject('chrome.storage.local não está disponível.');
        }  
    });  
}


async function connectApiFinesse() {
    return new Promise((resolve, reject) => {
        getCredential(async (username, password, agentId) => {
            if (username && password && agentId) {
                try {
                    const finesse = await connection(username, password, agentId);
                    log(finesse);
                    resolve(finesse);
                } catch (error) {                    
                    log("Erro na função connectApiFinesse:" + error);
                    reject(error);
                }
            } else {
                resolve(null);
            }
        });
    });
}


async function connection(username, password, agentId) {
    log("### Iniciando conexão API Finesse");
    const url = 'https://sncfinesse1.totvs.com.br:8445/finesse/api/User/' + agentId + '/';
    log("### " + url);
    const credentials = btoa(`${username}:${password}`);

    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = 10000; // 10 segundos
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${credentials}`
        },
        signal
    };

    try {
        const response = await fetch(url, options);

        clearTimeout(timeoutId);
        log("### Limpeza de Timeout");

        if (!response.ok) {
            log("### Erro na função connection com a API finnesse");
            throw new Error(`### HTTP error! status: ${response.status}`);
        }

        const data = await response.text();
        const finesse = xmlToJson(data);
        return finesse;

    } catch (error) {
        log('### Erro na conexão:', error.message);
        return false;
    }
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


function sendWindowsNotification(message) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "./icons/icon16.png",
        title: "Notificação Finesse",
        message: message
    }, function (notificationId) {
        if (chrome.runtime.lastError) {
            log("Erro ao criar notificação:", chrome.runtime.lastError);
        }
    });
}




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

            const content = xmlNode.replace(/<[\w:.-]+[^>]*>|<\/[\w:.-]+>/g, '');

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


// Desativar em Produção
function log(...args) {
  console.log(...args);
}