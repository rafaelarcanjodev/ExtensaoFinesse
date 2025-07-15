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
        alert("Erro ao sair da Aplicação");
      }
    }
)


document.querySelector('#btn-timer-plus').addEventListener('click', function(event){
    event.preventDefault();
    updateTimer(1);
})


document.querySelector('#btn-timer-minus').addEventListener('click', function(event){
    event.preventDefault();
    updateTimer(-1);
})

document.querySelector("#timer-form").addEventListener('change', async (event) => {
  event.preventDefault();

    var timerValue = getFormTimer("value");

    if (timerValue){
        chrome.runtime.sendMessage({
            action: 'saveTimer',
            data: {
                timer: timerValue
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


function updateTimer(increment){
    var timerValue = getFormTimer("value");
    var timerElement = getFormTimer("element");
    var newTimer = timerValue + increment;
    
    if(newTimer < 1 || newTimer > 120 || timerValue == false){    
        sendSnackbarNotification("Número Inválido","snack-bar-home");
    }
    else{  
        timerElement.value = timerValue + increment;
        timerElement.dispatchEvent(new Event('change', { bubbles: true }));
    }    
}


function getFormTimer(type){    
    var timerElement = document.getElementById("timerPrincipal");
    var timerValue = parseInt(timerElement.value, 10);

    if(timerValue <= 0 || timerValue >= 121){ 
        sendSnackbarNotification("Número Inválido","snack-bar-home");
        getTimerBackend().then(response => {timerElement.value = response})
    }
    else{
        return (type == "value") ? timerValue : 
               (type == "element") ? timerElement : 
               false;
    }
}
