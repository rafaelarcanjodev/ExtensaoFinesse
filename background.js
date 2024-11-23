let buzzerIntervalStarted = false;
let intervalId;
const urls = ["https://sncfinesse1.totvs.com.br:8445/*", "https://sncfinesse2.totvs.com.br:8445/*"];

const timer = getTimer()  
.then(timer => {  
    console.log(timer);  
})  
.catch(error => {  
    console.error("Erro ao obter o timer:", error);  
});


// // Start extension on install
// chrome.runtime.onInstalled.addListener(() => {
//     console.log("Contador Iniciado na Instalação");
//     stopInterval();
//     startInterval();
// });

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

// Save Credentials
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveCredentials') {
        const { username, password, agentId } = message.data;
        const result = saveCredentials(username, password, agentId);
        sendResponse({ success: !!result });
    }

    if (message.action === 'saveTimer') {
        const { timer } = message.data;
        const result = saveTimer(timer);
        sendResponse({ success: !!result });
    }
    return true;
});

function startInterval() {
    if (!buzzerIntervalStarted && timer) {
        buzzerIntervalStarted = true;
        intervalId = setInterval(() => {
            verifyTabsActive(isActiveTabFound => {
                if (isActiveTabFound) {
                    checkFinesseStatus(timer);
                } else {
                    stopInterval();
                }
            });
        }, timer);
    }
}

function stopInterval() {
    if (intervalId) {
        clearInterval(intervalId);
        buzzerIntervalStarted = false;
        console.log("Intervalo de verificação interrompido.");
    }
}

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

function isMatchingUrl(url) {
    console.log("Validando URL: ");
    console.log(url);
    return urls.some(pattern => url.startsWith(pattern));
}

function checkFinesseStatus(timer) {
    connectApiFinesse()
        .then(finesse => {
            if (finesse) {
                if (finesse.reasonCodeId && finesse.reasonCodeId['text'] === "-1") {
                    notification("playAudioNotReady");
                    focusTab();
                } else if (finesse.reasonCodeId && finesse.reasonCodeId['text'] >= "1" && finesse.reasonCodeId['text'] <= "22") {
                    stopInterval();
                    setInterval(() => {
                        notification("playAudioIntervalTimeExceed", timer);
                        focusTab();
                    }, timer);
                } else if (finesse.reasonCodeId && ["28", "23"].includes(finesse.reasonCodeId['text'])) {
                    notification("playAudioDeviceError");
                    focusTab();
                } else if (finesse.state['text'] === 'NOT_READY') {
                    notification("playAudioNotReady");
                    focusTab();
                }
            } else {
                console.log("Finesse não retornou informações");
            }
        })
        .catch(error => {
            console.error("Error ao recuperar Status do Finesse:", error);
        });
}

async function connectApiFinesse() {
    return new Promise((resolve, reject) => {
        getCredentials(async (username, password, agentId) => {
            if (username && password && agentId) {
                try {
                    const finesse = await connection(username, password, agentId);
                    resolve(finesse);
                } catch (error) {
                    reject(error);
                }
            } else {
                console.log("Entre em contato com a equipe de desenvolvimento.");
                resolve(null);
            }
        });
    });
}

function focusTab() {
    chrome.tabs.query({ url: urls }, (tabs) => {
        if (tabs && tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { active: true });
        }
    });
}

function notification(message, timer) {
    const notifications = {
        playAudioNotReady: "Telefone Desconectado - Status Não Pronto",
        playAudioDeviceError: "Telefone Desconectado - Verifique a VPN / Cisco Jabber / Finesse",
        playAudioIntervalTimeExceed: "Você está a " + (timer / 1000) + " segundos com o telefone em pausa"
    };

    if (notifications[message]) {
        //windowsNotification(notifications[message]);
    }
}

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
function saveCredentials(username, password, agentId) {
    if (chrome && chrome.storage && chrome.storage.local) {
        try{
            chrome.storage.local.set({ username, password, agentId })
            console.log('Credenciais salvas de forma segura');
            return true;
        }
        catch (error) {
            console.log('Erro ao salvar Credenciais');
            throw error;
        };
                
    } else {
        console.error('chrome.storage.local não está disponível');
    }
}

function saveTimer(timer) {
    if (chrome && chrome.storage && chrome.storage.local) {
        try{
            chrome.storage.local.set({ timer });
            console.log('Timer salvo de forma segura');
            return true;
        }
        catch (error) {
            console.log('Erro ao salvar o timer');        
            throw error;
        }
    } else {
        console.error('chrome.storage.local não está disponível.');
    }
}

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

async function removeCredentials() {
    chrome.storage.local.remove(['username', 'password', 'agentId'], function () {
        console.log('Credenciais removidas.');
    });
}


async function connection(username, password, agentId) {
    const url = 'https://sncfinesse1.totvs.com.br:8445/finesse/api/User/' + agentId + '/';
    const credentials = btoa(`${username}:${password}`);

    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = 5000;
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
            throw new Error('Erro na requisição: ' + response.statusText);
        }

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