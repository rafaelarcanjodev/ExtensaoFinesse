document.querySelector('.menu-button').addEventListener('click', function () {
    document.querySelector('.animated-icon').classList.toggle('open');

    document.getElementById('menu-content').classList.toggle('d-none');
});