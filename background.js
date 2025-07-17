const urls = ["https://sncfinesse1.totvs.com.br:8445/*","https://sncfinesse2.totvs.com.br:8445/*"];

startAlarm("checkAgentStatus");

async function startAlarm(nameAlarm) {
    var standartTimer = await getTimer("standartTimer");
    
    var nameAlarm = nameAlarm || "checkAgentStatus";

    if(standartTimer){
        log("### Alarme " + nameAlarm  + " iniciado com sucesso. Timer: " + standartTimer);
        chrome.alarms.create(nameAlarm, { periodInMinutes: standartTimer });
    } else{
        saveStandartTimer(5);
        savePauseTimer(30);
    }
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
            log("Alarme " + nameAlarm + " parado com sucesso.");
        } else {
            log("Não foi possível parar o alarme " + nameAlarm + ".");
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
        const { timer, type } = message.data;

        if (type == "standartTimer"){
            saveStandartTimer(timer)
                .then((result) => { 
                    stopAlarm("checkAgentStatus");
                    startAlarm("checkAgentStatus");
                    sendResponse({ success: result }); 
                })
                .catch((error) => { sendResponse({ success: false, error: error.message }); 
            });
            
        } else if (type == "pauseTimer"){
            savePauseTimer(timer)
                .then((result) => { 
                    stopAlarm("checkAgentStatus");
                    startAlarm("checkAgentStatus");
                    sendResponse({ success: result }); 
                })
                .catch((error) => { sendResponse({ success: false, error: error.message }); 
            });
        }
        
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
        reasonCodeId = parseInt(reasonCodeId);
        var finesseState = finesse.state ? finesse.state['text'] : null;
        var standartTimer = await getTimer("standartTimer");
        var pauseTimer = await getTimer("pauseTimer");
        var countTimer = (pauseTimer - standartTimer) * 60000;

        if (reasonCodeId == -1) {

            log("### Primeira Condição " + reasonCodeId + " - " + finesseState);
            notification("playAudioNotReady");
            tabActiveFocus();
            
        } else if (reasonCodeId > 0 && reasonCodeId < 23) {               
            stopAlarm("checkAgentStatus");
            log("### Iniciando Contador de Pausa: " + countTimer);

            setTimeout(function(){
                log("### Segunda Condição " + reasonCodeId + " - " + finesseState);
                notification("playAudioIntervalTimeExceed", pauseTimer);
                tabActiveFocus();
                startAlarm("checkAgentStatus");
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
    .catch(error => {
        log("### Erro ao recuperar Status do Finesse:", error);       
    });
}


async function removeUserCredential() {
    chrome.storage.local.remove(['username', 'password', 'agentId'], function () {
        log('### Credenciais removidas.');
        stopAlarm("checkAgentStatus");
        window.location.reload();
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


function saveStandartTimer(standartTimer) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.set({ standartTimer }, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                log("### Timer Padrão salvo de forma segura");
                resolve(true);
            });
        } catch (e) {
            reject(e);
        }
    });
}


function savePauseTimer(pauseTimer) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.set({ pauseTimer }, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                log("### Timer de Pausa salvo de forma segura");
                resolve(true);
            });
        } catch (e) {
            reject(e);
        }
    });
}


async function getTimer(type) {  
    return new Promise((resolve, reject) => {  
        if (chrome && chrome.storage && chrome.storage.local) {  
            item = chrome.storage.local.get(['standartTimer','pauseTimer'], function (item) {  
                if (chrome.runtime.lastError) {  
                    log(chrome.runtime.lastError);  
                    reject(chrome.runtime.lastError); 
                    return;  
                }
                
                var standartTimer = parseInt(item.standartTimer, 10); 
                var pauseTimer = parseInt(item.pauseTimer, 10); 
                
                if (type == "standartTimer"){
                    resolve (standartTimer);
                }

                if (type == "pauseTimer"){
                    resolve (pauseTimer);
                }
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
    const timeout = 2000; // 2 segundos
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
        log(response);

        clearTimeout(timeoutId);
        if (!response.ok) {
            log("### Erro na função connectApiFinesse com a API finnesse " + response.status);
            sendSnackbarNotification("Verifique a VPN, Cisco, Finesse e Credenciais", 'snack-bar', 3000);
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