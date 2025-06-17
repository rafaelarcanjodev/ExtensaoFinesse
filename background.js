const urls = ["https://sncfinesse1.totvs.com.br:8445/*","https://sncfinesse2.totvs.com.br:8445/*"];

startAlarm();

async function resolverTimer(){
    var notificationTimer = await getNotificationTimer();
    log("### Timer sem conversão: " + notificationTimer);

    notificationTimer = parseInt(notificationTimer, 10);
    notificationTimer = notificationTimer / 60000;    
    log("### Timer atualizado: " + notificationTimer);
    return notificationTimer;
}


async function startAlarm() {
    var notificationTimer = await resolverTimer();
    log("### Timer final: " + notificationTimer);
    
    chrome.alarms.create("checkAgentStatus", { periodInMinutes: notificationTimer });
}


chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "checkAgentStatus") {
        verifyTabsActive(isActiveTabFound => {
            if (isActiveTabFound) {
                checkAgentStatus();
            }
        });
    }
});


function stopAlarm(nameAlarm) {
    chrome.alarms.clear(nameAlarm, (wasCleared) => {
        if (wasCleared) {
            console.log("Alarme " + nameAlarm + " parado com sucesso.");
        } else {
            console.log("Não foi possível parar o alarme " + nameAlarm + ".");
        }
    });
}


// Salva credenciais e timer
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

    if (message.action === 'saveCredentials') {
        const { username, password, agentId } = message.data;
        saveUserCredential(username, password, agentId)
            .then((result) => { sendResponse({ success: result }); })
            .catch((error) => { sendResponse({ success: false, error: error.message });
            
        });        
        return true;
    }    
    
    if (message.action === 'saveTimer') {
        const { timer } = message.data;
        saveNotificationTimer(timer)
            .then((result) => { 
                stopAlarm("checkAgentStatus");
                startAlarm("checkAgentStatus");
                sendResponse({ success: result }); 
            })
            .catch((error) => { sendResponse({ success: false, error: error.message }); 
        });
        return true;
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


function tabActiveFocus() {
    chrome.tabs.query({ url: urls }, (tabs) => {
        if (tabs && tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { active: true });
        }
    });
}


function checkAgentStatus() {
    getUserCredentialsAndConnect()
        .then(async finesse => {
        if (!finesse) {
            log("Finesse não retornou informações");            
            return;
        }

        log("### Iniciando Verificação do Status do Agente");
        var reasonCodeId = finesse.reasonCodeId ? finesse.reasonCodeId['text'] : null;
        var finesseState = finesse.state ? finesse.state['text'] : null;

        if (reasonCodeId === "-1") {

            log("### Primeira Condição " + reasonCodeId + " - " + finesseState);
            notification("playAudioNotReady");
            tabActiveFocus();
            
        } else if (reasonCodeId > "0" && reasonCodeId < "23") {               
            
            var notificationTimer = await resolverTimer();

            log("### Segunda Condição " + reasonCodeId + " - " + finesseState);
            notification("playAudioIntervalTimeExceed", notificationTimer);
            tabActiveFocus();

        } else if (["28", "23"].includes(reasonCodeId)) {      

            log("### Terceira Condição " + reasonCodeId + " - " + finesseState);
            notification("playAudioDeviceError");
            tabActiveFocus();
            
        } else if (finesseState === 'NOT_READY') {   

            log("### Quarta Condição " + reasonCodeId + " - " + finesseState);
            notification("playAudioNotReady");
            tabActiveFocus();
            
        }
    })
    .catch(error => {
        log("### Erro ao recuperar Status do Finesse:", error);       
    });
}


async function removeUserCredential() {
    chrome.storage.local.remove(['username', 'password', 'agentId'], function () {
        log('### Credenciais removidas.');
        stopAlarm("checkAgentStatus");
    });
}


async function saveUserCredential(username, password, agentId) {
    try {
        const finesse = await connectApiFinesse(username, password, agentId);
        log("### Resposta do Finesse:" + finesse);

        if (finesse?.ApiErrors) {
            log("### Erro ao conectar ao Finesse:", finesse.ApiErrors);
            return false;
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
            return false;
        }
    } catch (error) {                                
        log("### Erro na conexão com Finesse:", error);
        return false;
    }       
}


function getUserCredential(callback) {
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


function saveNotificationTimer(timer) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.set({ timer }, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                log("### Timer salvo de forma segura");
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


async function getUserCredentialsAndConnect() {
    return new Promise((resolve, reject) => {
        getUserCredential(async (username, password, agentId) => {
            if (username && password && agentId) {
                try {
                    const finesse = await connectApiFinesse(username, password, agentId);
                    log(finesse);
                    resolve(finesse);
                } catch (error) {                    
                    log("Erro na função getUserCredentialsAndConnect:" + error);
                    reject(error);
                }
            } else {
                resolve(null);
            }
        });
    });
}


async function connectApiFinesse(username, password, agentId) {
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
        if (!response.ok) {
            log("### Erro na função connectApiFinesse com a API finnesse");
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


function notification(message, time) {

    const notifications = {
        playAudioNotReady: "Telefone Desconectado - Status Não Pronto",
        playAudioDeviceError: "Telefone Desconectado - Verifique a VPN / Cisco Jabber / Finesse",
        playAudioIntervalTimeExceed: "Você está a mais de " + time + " minutos com o telefone em pausa"
    };

    if (notifications[message]) {
        sendWindowsNotification(notifications[message]);
    }
}


function sendWindowsNotification(message) {
    
    clearAllNotifications();
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


function clearAllNotifications() {
    chrome.notifications.getAll((notifications) => {
        for (let notificationId in notifications) {
            chrome.notifications.clear(notificationId, (wasCleared) => {});
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
    const now = new Date();
    const timestamp = formatDate(now);
    console.log(`[${timestamp}]`, ...args);
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses começam em 0
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}