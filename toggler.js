document.querySelector('.menu-button').addEventListener('click', function () {
    document.querySelector('.animated-icon').classList.toggle('open');

    document.getElementById('menu-content').classList.toggle('d-none');
});


document.querySelector('#btn-timer-plus').addEventListener('click', function(){
    var timerPrincipal = document.querySelector('#timerPrincipal');
    var newTimer = parseInt(timerPrincipal.value, 10) + 1;
    timerPrincipal.value = newTimer;        
    timerPrincipal.dispatchEvent(new Event('change', { bubbles: true }));
})

document.querySelector('#btn-timer-minus').addEventListener('click', function(){
    var timerPrincipal = document.querySelector('#timerPrincipal');
    var newTimer = parseInt(timerPrincipal.value, 10) - 1;
    timerPrincipal.value = newTimer;
    timerPrincipal.dispatchEvent(new Event('change', { bubbles: true }));
})