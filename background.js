let buzzerInterval;
const urls = ["https://sncfinesse1.totvs.com.br:8445/*", "https://sncfinesse2.totvs.com.br:8445/*"];

// Start extension when install
chrome.runtime.onInstalled.addListener(() => {
    startInterval();
});

// Start extension when tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && isMatchingUrl(tab.url)) {
        startInterval();
    }
});

// Save Credentials
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'saveCredentials') {
        const { username, password, agentId } = message.data;

        const result = saveCredentials(username, password, agentId);

        if (result) {
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false });
        }
    }
    return true; // Manter o canal aberto para enviar uma resposta assíncrona
});


// Stop Audio
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "stopAudio") {
        chrome.tabs.query({ url: "https://sncfinesse2.totvs.com.br/*" }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "stopAudio" });
            }
        });
    }
});


function startInterval() {
    buzzerInterval = setInterval(() => {
        verifyTabs((isActiveTabFound) => {
            if (isActiveTabFound) {
                checkFinesseStatus();
            } else {
                console.log("Nenhuma aba ativa foi encontrada. Processo interrompido.");
            }
        });
    }, 10000); // Verify every 5 seconds
}

function verifyTabs(callback) {
    chrome.tabs.query({ url: urls }, (tabs) => {
        if (tabs && tabs.length > 0) {
            let foundActiveTab = false;
            tabs.forEach(tab => {
                if (tab.active) {
                    //console.log("Tab ativa encontrada:", tab.url);
                    foundActiveTab = true;
                    callback(true);
                }
            });

            if (!foundActiveTab) {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
}


function isMatchingUrl(url) {
    return urls.some(pattern => url.startsWith(pattern));
}

function checkFinesseStatus() {
    getFinesseStatusBackground()
        .then(finesse => {
            if (finesse) {
                chrome.tabs.query({ url: urls }, (tabs) => {
                    if (tabs && tabs.length > 0) {

                        if (finesse.reasonCodeId && finesse.reasonCodeId['text'] == "-1") {
                            chrome.tabs.sendMessage(tabs[0].id, { action: finesse.reasonCodeId['text'] == "-1" ? "playAudioNotReady" : "stopAudio" });
                            focusTab();
                        } else if (finesse.reasonCodeId && finesse.reasonCodeId['text'] == "28") {
                            chrome.tabs.sendMessage(tabs[0].id, { action: finesse.reasonCodeId['text'] == "28" ? "playAudioDeviceError" : "stopAudio" });
                            focusTab();
                        } else if (finesse.reasonCodeId && finesse.reasonCodeId['text'] == "23") {
                            chrome.tabs.sendMessage(tabs[0].id, { action: finesse.reasonCodeId['text'] == "23" ? "playAudioDeviceError" : "stopAudio" });
                            focusTab();
                        } else if (finesse.reasonCodeId && (finesse.reasonCodeId['text'] >= "-1" || finesse.reasonCodeId['text'] <= "22")) {
                            setInterval(() => {
                                chrome.tabs.sendMessage(tabs[0].id, { action: finesse.reasonCodeId['text'] >= "-1" ? "playAudioIntervalTimeExceed" : "stopAudio" });
                                focusTab();
                            }, 10000); // Verify every 5 seconds
                        } else if (finesse.state['text'] == 'NOT_READY') {
                            chrome.tabs.sendMessage(tabs[0].id, { action: finesse.state['text'] == "NOT_READY" ? "playAudioNotReady" : "stopAudio" });
                            focusTab();
                        }
                    }
                });
            } else {
                console.log("No Finesse data returned.");
            }
        })
        .catch(error => {
            console.error("Error retrieving Finesse Status:", error);
        });
}


async function getFinesseStatusBackground() {
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
                console.log("Entre em contato com a equipe de desenvolvimento: rafael.arcanjo@totvs.com.br");
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

function removeCredentials() {
    chrome.storage.local.remove(['username', 'password', 'agentId'], function () {
        console.log('Credenciais removidas.');
    });
}


async function connection(username, password, agentId) {
    const url = 'https://sncfinesse1.totvs.com.br:8445/finesse/api/User/' + agentId + '/';
    const credentials = btoa(`${username}:${password}`);

    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = 5000; // 5 seconds
    const timeoutId = setTimeout(() => controller.abort(), timeout); // start timer

    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${credentials}`
        },
        signal
    };

    try {
        const response = await fetch(url, options);

        // Clear timeout
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