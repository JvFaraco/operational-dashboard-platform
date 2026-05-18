document.addEventListener('DOMContentLoaded', function(){

const savedTheme =
localStorage.getItem('a365-theme');

if(savedTheme){

document.documentElement.setAttribute(
'data-theme',
savedTheme
);

}

});