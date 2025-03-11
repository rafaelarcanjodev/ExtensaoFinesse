let buzzerIntervalStarted = false; // Intervalo que só inicia quando encontra o Finesse
let intervalId; //Identificador do Intervalo
const urls = ["https://sncfinesse1.totvs.com.br:8445/*","https://sncfinesse2.totvs.com.br:8445/*"]; // URL do Finesse

// Temporizador das Notificações
const timer = getTimer()
.then(timerValue => {
    console.log("Timer carregado:", timerValue);
    startInterval(timerValue);
})
.catch(error => {
    console.error("Erro ao obter o timer:", error);
});

// Inicia procura por abas quando há uma atualização no navegador
chrome.tabs.onUpdated.addListener((changeInfo, tab) => {
    verifyTabsActive(isActiveTabFound => {
        if (isActiveTabFound == true) {
            startInterval();
        } else {
            stopInterval();
        }
    });
});

// Salva credenciais e timer
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.action === 'saveCredentials') {
        const { username, password, agentId } = message.data;
        const credentialResult = saveCredentials(username, password, agentId);
    
        if (credentialResult) {
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false });
        }
    }
    
    if (message.action === 'saveTimer') {
        const { timer } = message.data;
        const timerResult = saveTimer(timer);
        sendResponse({ success: !!timerResult });
    }
    return true;

});

// Inicia intervalo de verificação
async function startInterval(timer) {
    if (buzzerIntervalStarted) return;
    
    buzzerIntervalStarted = true;
    console.log("Iniciando intervalo de verificação...");

    verifyTabsActive(isActiveTabFound => {
        if (isActiveTabFound == true) {
            startInterval();
        } else {
            stopInterval();
        }
    });

    intervalId = setInterval(async () => {
        const isActiveTabFound = await verifyTabsActive();
        
        if (!isActiveTabFound) {
            stopInterval();
            return;
        }

        await checkFinesseStatus(timer);
    }, timer);
}


// Para intervalo de verificação
function stopInterval() {
    if (intervalId) {
        clearInterval(intervalId);
        buzzerIntervalStarted = false;
        console.log("Intervalo de verificação interrompido.");
    }
}

// Procura aba ativa do finesse
function verifyTabsActive(callback) {
    chrome.tabs.query({ url: urls }, (tabs) => {
        if (tabs.length > 0) {
            console.log("Tab encontrada");
            callback(true);
        } else {
            console.log("Nenhuma tab encontrada");
            callback(false);
        }
    });
}

// Verifica se URL é compatível com Array cadastradO.
function isMatchingUrl(url) {
    console.log("Validando URL: ");
    console.log(url);
    return urls.some(pattern => url.includes(pattern));
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
                console.log("Finesse não retornou informações");
            }
        })
        .catch(error => {
            console.error("Error ao recuperar Status do Finesse:", error);
        });
}


// Conecta na API do Finesse
async function connectApiFinesse() {
    return new Promise((resolve, reject) => {
        getCredentials(async (username, password, agentId) => {
            if (username && password && agentId) {
                try {
                    const finesse = await connection(username, password, agentId);
                    console.log(finesse);
                    resolve(finesse);
                } catch (error) {
                    console.error("Erro ao conectar ao Finesse:", error);
                    reject(error);
                }
            } else {
                console.log("Entre em contato com a equipe de desenvolvimento.");
                resolve(null);
            }
        });
    });
}

// Foca na ABA do Finesse
function focusTab() {
    chrome.tabs.query({ url: urls }, (tabs) => {
        if (tabs && tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { active: true });
        }
    });
}


// Configuração da Notificação
function notification(message, timer) {
    const notifications = {
        playAudioNotReady: "Telefone Desconectado - Status Não Pronto",
        playAudioDeviceError: "Telefone Desconectado - Verifique a VPN / Cisco Jabber / Finesse",
        playAudioIntervalTimeExceed: "Você está a " + (timer / 1000) + " segundos com o telefone em pausa"
    };

    if (notifications[message]) {
        windowsNotification(notifications[message]);
    }
}

// Envio da Notificação pro Windows
function windowsNotification(message) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "./icons/icon16.png",
        title: "Notificação Finesse",
        message: message
    }, function (notificationId) {
        if (chrome.runtime.lastError) {
            console.error("Erro ao criar notificação:", chrome.runtime.lastError);
        }
    });
}

// Salvar Credenciais no navegador
function saveCredentials(username, password, agentId) {

    if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ username, password, agentId }, function () {

            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return false
            } else {
                console.log('Credenciais salvas de forma segura.');
                return true;
            }
        });
    } else {
        console('chrome.storage.local não está disponível.');
    }
}


// Salvar timer no navegador
function saveTimer(timer) {
    try{
        chrome.storage.local.set({ timer });
        console.log('Timer salvo de forma segura');
        startInterval(timer);
    }
    catch (error) {
        console.log('Erro ao salvar o timer');        
        throw error;
    }
}

// Disponibilizar credenciais para o front
function getCredentials(callback) {
    if (chrome && chrome.storage && chrome.storage.local) {

        items = chrome.storage.local.get(['username', 'password', 'agentId'], function (items) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return false;
            }

            callback(items.username, items.password, items.agentId);
        });
    } else {
        console.log('chrome.storage.local não está disponível.');
    }
}

// Disponibilizar credenciais para o front
async function getTimer() {  
    return new Promise((resolve, reject) => {  
        if (chrome && chrome.storage && chrome.storage.local) {  
            item = chrome.storage.local.get(['timer'], function (item) {  
                if (chrome.runtime.lastError) {  
                    console.error(chrome.runtime.lastError);  
                    reject(chrome.runtime.lastError); 
                    return;  
                }   
                resolve(item.timer);
            });  
        } else {  
            console.log('chrome.storage.local não está disponível.');  
            reject('chrome.storage.local não está disponível.');
        }  
    });  
}

// Apagar Credenciais do navegador
async function removeCredentials() {
    chrome.storage.local.remove(['username', 'password', 'agentId'], function () {
        console.log('Credenciais removidas.');
    });
}

// Monta requisição para o finesse
async function connection(username, password, agentId) {
    const url = `https://sncfinesse2.totvs.com.br:8445/finesse/api/User/${agentId}/`;
    console.log(url);

    const credentials = btoa(`${username}:${password}`);
    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${credentials}`
        },
        signal: signal
    };

    try {
        const response = await fetch(url, options); // Espera o fetch resolver

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }

        clearTimeout(timeoutId);

        const data = await response.text();
        const finesse = xmlToJson(data);

        return finesse;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('A requisição foi cancelada por exceder o tempo limite.');
        }

        throw error;
    }
}

// Conversor XML para Json
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