// =========================================================
//  Identifica a abertura do Pop Up
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================
  //  Definindo variáveis e recuperando valores
  // =========================================================

  var formLogin = document.getElementById("login-form");
  var loginDiv = document.getElementById("login-div");
  var contentDiv = document.getElementById("content-div");
  var loadingModal = document.getElementById("loading-modal");
  var standartTimer = document.getElementById("standartTimer");
  var pauseTimer = document.getElementById("pauseTimer");

  showDiv(loadingModal);

  getTimer("standartTimer").then((response) => {
    standartTimer.value = response;
  });

  getTimer("pauseTimer").then((response) => {
    pauseTimer.value = response;
  });

  // =========================================================
  //  Função que conecta no finesse e tenta recuperar status do agente
  // Caso a resposta seja "null" ele abre o modal de login
  // =========================================================

  getUserCredentialsAndConnect().then((response) => {
    if (response == null) {
      hideDiv(loadingModal);
      showDiv(loginDiv);
      hideDiv(contentDiv);

      // =========================================================
      //  Início do listener que espera o envio do form de login
      // =========================================================

      formLogin.addEventListener("submit", (event) => {
        event.preventDefault();

        showDiv(loadingModal);

        var username = document.getElementById("username").value;
        var password = document.getElementById("password").value;
        var agentId = document.getElementById("agentId").value;
        username.trim();
        password.trim();
        agentId.trim();

        if (username && password && agentId) {
          chrome.runtime.sendMessage(
            {
              action: "setCredentials",
              data: {
                username: username,
                password: password,
                agentId: agentId,
              },
            },
            async function (response) {
              log("setCredentials - Response Front:");
              log(response);

              try {
                if (!response) {
                  throw new Error("Sem resposta do Servidor");
                } else if (response.success) {
                  window.location.reload();
                } else if (response.success == false) {
                  throw new Error("Verifique a VPN, Cisco, Finesse e Credenciais");
                } else {
                  throw new Error("Login Inválido");
                }
              } catch (error) {
                log("entrou no catch");
                log(error);
                hideDiv(loadingModal);
                sendSnackbarNotification(error.message);
                loginFormDataRecover(username, password, agentId);
                return false;
              }
            }
          );
        } else {
          hideDiv(loadingModal);
          sendSnackbarNotification("Preencha todos os campos");
        }
      });
    } else {
      showDiv(contentDiv);
      hideDiv(loadingModal);
      hideDiv(loginDiv);
      agentStatus(response);
    }
  });
});

function loginFormDataRecover(username, password, agentId) {
  document.getElementById("username").value = username;
  document.getElementById("password").value = password;
  document.getElementById("agentId").value = agentId;
}

// =========================================================
//  Função que lê objeto Finesse e define o Status do agente
// =========================================================

function agentStatus(finesse) {
  var agentNameDiv = document.getElementById("connection-status-div");
  var reasonDiv = document.getElementById("reason-description-div");

  if (finesse == false) {
    showCircleStatus("NOT READY");
    agentNameDiv.innerText = "Desconectado";
    reasonDiv.innerText = "Verifique a VPN";
  } else if (finesse) {
    showCircleStatus(finesse.state["text"]);
    agentNameDiv.innerText = finesse.firstName["text"] + " " + finesse.lastName["text"];

    if (finesse.state["text"] == "READY") {
      reasonDiv.innerText = finesse.state["text"];
    } else if (finesse.reasonCodeId && finesse.reasonCodeId["text"] == "-1") {
      reasonDiv.innerText = "Não Está Pronto";
    } else if ((finesse.reasonCodeId && finesse.reasonCodeId["text"] == "28") || finesse.reasonCodeId["text"] <= "23") {
      reasonDiv.innerText = finesse.label["text"];
    } else if ((finesse.reasonCodeId && finesse.reasonCodeId["text"] >= "-1") || finesse.reasonCodeId["text"] <= "22") {
      reasonDiv.innerText = finesse.label["text"];
    } else {
      reasonDiv.innerText = "Finesse Fechado";
    }
  } else {
    sendSnackbarNotification("Falha ao carregar objeto do finesse", "snack-bar");
  }
}

// =========================================================
//  Funções de manipulação de classes CSS
// =========================================================

function showDiv(showDiv) {
  if (showDiv) {
    showDiv.classList.remove("d-none");
  } else {
    log("Elemento para mostrar não encontrado: " + showDiv);
    sendSnackbarNotification("Favor reiniciar extensão");
  }
}

function hideDiv(hideDiv) {
  if (hideDiv) {
    hideDiv.classList.add("d-none");
  } else {
    log("Elemento para ocultar não encontrado: " + hideDiv);
    sendSnackbarNotification("Favor reiniciar extensão");
  }
}

function showCircleStatus(agentStatus) {
  const greenCircle = document.getElementById("green-circle-div");
  const redCircle = document.getElementById("red-circle-div");

  if (agentStatus == "READY") {
    greenCircle.classList.remove("d-none");
    redCircle.classList.add("d-none");
  } else {
    greenCircle.classList.add("d-none");
    redCircle.classList.remove("d-none");
  }
}

// =========================================================
//  Notificações via Snackbar da extensão
// =========================================================

var snackBar = document.getElementById("snack-bar-home");
var notificationTimeout;

function sendSnackbarNotification(message = "Error", elementId = "snack-bar", time = 3000) {
  var errorMessage = document.getElementById(elementId);
  errorMessage.textContent = message;

  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    errorMessage.textContent = "";
  }, time);
}
