// =========================================================
//  Listeners dos Botões
// =========================================================

document.querySelector(".menu-button").addEventListener("click", function (event) {
  event.preventDefault();

  document.querySelector(".animated-icon").classList.toggle("open");
  document.getElementById("menu-content").classList.toggle("d-none");
});

document.querySelector("#btn-menu-documentation").addEventListener("click", function (event) {
  event.preventDefault();
  window.open("https://tdn.totvs.com/pages/viewpage.action?pageId=961629221", "_blank");
});

document.querySelector("#btn-menu-store").addEventListener("click", function (event) {
  event.preventDefault();
  window.open("https://chromewebstore.google.com/detail/finesse-notifier/cglkkcedledghdpkbopambajgmjmkkab", "_blank");
});

document.querySelector("#btn-menu-form").addEventListener("click", function (event) {
  event.preventDefault();
  window.open(
    "https://docs.google.com/forms/d/e/1FAIpQLSeeMiF6LywX6OfRddaWB1igSbn0TylLtRUy28AFWNP4KpC4iA/viewform?usp=dialog",
    "_blank"
  );
});

document.querySelector("#btn-menu-notification").addEventListener("click", function (event) {
  event.preventDefault();

  try {
    log("tentou");
    sendWindowsNotification("teste");
  } catch (error) {
    log(error);
    alert(
      "Erro ao notificar, verifique as permissões de notificação da extensão, ou entre em contato com nosso suporte"
    );
  }
});

document.querySelector("#btn-menu-logout").addEventListener("click", function (event) {
  event.preventDefault();

  try {
    const loginDiv = document.getElementById("login-div");
    const contentDiv = document.getElementById("content-div");
    const menuDiv = document.getElementById("menu-content");

    deleteUserCredential();
    menuDiv.classList.toggle("d-none");
    showDiv(loginDiv);
    hideDiv(contentDiv);
    return true;
  } catch (error) {
    log(error);
    sendSnackbarNotification("Erro ao sair da Aplicação", "snack-bar-home");
  }
});

document.querySelector("#btn-standart-timer-plus").addEventListener("click", function (event) {
  event.preventDefault();
  updateTimer(1, "standart-timer");
});

document.querySelector("#btn-standart-timer-minus").addEventListener("click", function (event) {
  event.preventDefault();
  updateTimer(-1, "standart-timer");
});

document.querySelector("#btn-pause-timer-plus").addEventListener("click", function (event) {
  event.preventDefault();
  updateTimer(1, "pause-timer");
});

document.querySelector("#btn-pause-timer-minus").addEventListener("click", function (event) {
  event.preventDefault();
  updateTimer(-1, "pause-timer");
});

document.querySelectorAll(".no-letters").forEach((input) => {
  input.addEventListener("input", function () {
    this.value = this.value.replace(/[a-zA-Z]/g, "");
  });
});

document.querySelector("#timer-form").addEventListener("change", async (event) => {
  event.preventDefault();

  var changedInputId = event.target.id;
  var standartTimer = getFormTimer("value", "standart-timer");
  var pauseTimer = getFormTimer("value", "pause-timer");
  var timerElement = getFormTimer("element", !changedInputId);

  var timerValue =
    changedInputId == "standart-timer"
      ? standartTimer
      : changedInputId == "pause-timer"
      ? pauseTimer
      : timerValue == null;

  timerValue = validateTimerValue(timerValue, pauseTimer, standartTimer);

  if (timerValue == null) {
    setFormTimer(changedInputId, timerElement);
  } else if (standartTimer == null || pauseTimer == null) {
    setFormTimer(changedInputId, timerElement);
  } else {
    chrome.runtime.sendMessage(
      {
        action: "setTimer",
        data: {
          timer: timerValue,
          type: changedInputId,
        },
      },
      function (response) {
        if (response && response.success) {
          sendSnackbarNotification("Timer salvo com sucesso!", "snack-bar-home");
        } else {
          sendSnackbarNotification("Falha ao salvar o timer", "snack-bar-home");
        }
      }
    );
  }
});

// =========================================================
//  Funções do botão de + e -
// =========================================================

function updateTimer(increment, type) {
  var timerValue = getFormTimer("value", type);
  var timerElement = getFormTimer("element", type);
  var standartTimer = getFormTimer("value", "standart-timer");
  var pauseTimer = getFormTimer("value", "pause-timer");
  var newTimer = timerValue + increment;

  timerValue = validateTimerValue(newTimer, pauseTimer, standartTimer);

  if (timerValue == false) {
    setFormTimer(type, timerElement);
  } else {
    timerElement.value = timerValue;
    timerElement.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

// =========================================================
//  Função que busca e valida timer digitado no formulário
// =========================================================

function getFormTimer(resultType, timerType) {
  var timerElement = document.getElementById(timerType);
  var standartTimer = parseInt(document.getElementById("standart-timer").value, 10);
  var pauseTimer = parseInt(document.getElementById("pause-timer").value, 10);

  var timerValue =
    timerType == "standart-timer" ? standartTimer : timerType == "pause-timer" ? pauseTimer : timerValue == null;

  var validatedTimerValue = validateTimerValue(timerValue, pauseTimer, standartTimer);

  if (validatedTimerValue == null) {
    setFormTimer(timerType, timerElement);
    return null;
  } else {
    return resultType == "value" ? validatedTimerValue : resultType == "element" ? timerElement : false;
  }
}

function setFormTimer(timerType, timerElement) {
  getTimer(timerType).then((response) => {
    timerElement.value = response;
  });
}

function validateTimerValue(timerValue, pauseTimer, standartTimer) {
  if (timerValue == isNaN) {
    sendSnackbarNotification("Número Inválido", "snack-bar-home");
    return null;
  } else if (pauseTimer <= standartTimer) {
    sendSnackbarNotification("Tempo de Pausa não pode ser menor que Tempo Padrão", "snack-bar-home");
    return null;
  } else if (timerValue <= 0 || timerValue > 120) {
    sendSnackbarNotification("Escolha um número entre 1 e 120 (minutos)", "snack-bar-home");
    return null;
  } else {
    return timerValue;
  }
}
