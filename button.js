document.querySelector('.menu-button').addEventListener('click', function (event) {
    event.preventDefault();

    document.querySelector('.animated-icon').classList.toggle('open');
    document.getElementById('menu-content').classList.toggle('d-none');
});


document.querySelector('#btn-menu-documentation').addEventListener('click', function(event){
    event.preventDefault();
    window.open('https://tdn.totvs.com/pages/viewpage.action?pageId=961629221', '_blank');
})


document.querySelector('#btn-menu-store').addEventListener('click', function(event){
    event.preventDefault();
    window.open('https://chromewebstore.google.com/detail/finesse-notifier/cglkkcedledghdpkbopambajgmjmkkab', '_blank');
})


document.querySelector('#btn-menu-form').addEventListener('click', function(event){
    event.preventDefault();
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSeeMiF6LywX6OfRddaWB1igSbn0TylLtRUy28AFWNP4KpC4iA/viewform?usp=dialog', '_blank');
})


document.querySelector('#btn-menu-notification').addEventListener("click", function(event) {
    event.preventDefault();

      try{
        log("tentou");
        sendWindowsNotification("teste");
      }catch(error){
        log(error);
        alert("Erro ao notificar, verifique as permissões de notificação da extensão, ou entre em contato com nosso suporte");
      }
    }
)


document.querySelector('#btn-menu-logout').addEventListener("click", function(event) {
    event.preventDefault();

      try{
        const loginDiv = document.getElementById('login-div');
        const contentDiv = document.getElementById('content-div');
        const menuDiv = document.getElementById('menu-content');

        removeUserCredential();
        menuDiv.classList.toggle('d-none');
        showDiv(loginDiv);
        hideDiv(contentDiv);
        return true;

      }catch(error){
        log(error);
        sendSnackbarNotification("Erro ao sair da Aplicação","snack-bar-home");
      }
    }
)


document.querySelector('#btn-standart-timer-plus').addEventListener('click', function(event){
    event.preventDefault();
    updateTimer(1, "standartTimer");
})


document.querySelector('#btn-standart-timer-minus').addEventListener('click', function(event){
    event.preventDefault();
    updateTimer(-1, "standartTimer");
})


document.querySelector('#btn-pause-timer-plus').addEventListener('click', function(event){
    event.preventDefault();
    updateTimer(1, "pauseTimer");
})


document.querySelector('#btn-pause-timer-minus').addEventListener('click', function(event){
    event.preventDefault();
    updateTimer(-1, "pauseTimer");
})


document.querySelectorAll('.no-letters').forEach(input => {
    input.addEventListener('input', function() {
        this.value = this.value.replace(/[a-zA-Z]/g, '');
    });
});


document.querySelector("#timer-form").addEventListener('change', async (event) => {
  event.preventDefault();

    var changedInputId = event.target.id;
    var standartTimer = getFormTimer("value", "standartTimer");
    var pauseTimer = getFormTimer("value", "pauseTimer");
    var timerElement = getFormTimer("element", !changedInputId);
    
    var timerValue = 
        changedInputId == "standartTimer" ? standartTimer : 
        changedInputId == "pauseTimer" ? pauseTimer : 
        timerValue == null;
    
    if (isNaN(timerValue)){        
        sendSnackbarNotification("Número Inválido","snack-bar-home");
        getTimerBackend(changedInputId).then(response => {timerElement.value = response});
    }
    else if (standartTimer == false || pauseTimer == false) {
        getTimerBackend(changedInputId).then(response => {timerElement.value = response});    
    }
    else {
        chrome.runtime.sendMessage({
            action: 'saveTimer',
            data: {
                timer: timerValue,
                type: changedInputId
            }
    }, function (response) { 
        if (response && response.success) {
            sendSnackbarNotification("Timer salvo com sucesso!", 'snack-bar-home');
        } else {
            sendSnackbarNotification("Falha ao salvar o timer", 'snack-bar-home');
        }
    });
  }
});


function updateTimer(increment, type){
    var timerValue = getFormTimer("value", type);
    var timerElement = getFormTimer("element", type);    
    var newTimer = timerValue + increment;
    
    if(newTimer < 1 || newTimer > 120 || timerValue == false){    
        sendSnackbarNotification("Escolha um tempo entre 1 e 120 (minutos)","snack-bar-home");
    } 

    else{  
        timerElement.value = timerValue + increment;
        timerElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
}


function getFormTimer(resultType, timerType){    

    var timerElement = document.getElementById(timerType);
    var standartTimer = parseInt(document.getElementById("standartTimer").value, 10);
    var pauseTimer = parseInt(document.getElementById("pauseTimer").value, 10); 


    console.log("get Form " + standartTimer + " " + pauseTimer); 

    var timerValue = 
        timerType == "standartTimer" ? standartTimer : 
        timerType == "pauseTimer" ? pauseTimer : 
        timerValue == null; 

    if(timerValue == isNaN){ 
        sendSnackbarNotification("Número Inválido","snack-bar-home");
        getTimerBackend(timerType).then(response => {timerElement.value = response});
    }

    else if(timerValue <= 0 || timerValue >= 120){ 
        sendSnackbarNotification("Escolha um número entre 1 e 120 (minutos)","snack-bar-home");
        getTimerBackend(timerType).then(response => {timerElement.value = response});
    }

    else if(pauseTimer <= standartTimer){
        sendSnackbarNotification("Tempo de Pausa não pode ser menor que Tempo Padrão","snack-bar-home");
        getTimerBackend(timerType).then(response => {timerElement.value = response});
        return false;
    }

    else{
        return (resultType == "value") ? timerValue : 
               (resultType == "element") ? timerElement : 
               false;
    }
}
