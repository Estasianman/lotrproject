let elem = document.getElementsByTagName("main")[0];
let button = document.getElementById("full-screen-button");
button.textContent = "Full Screen";

function openFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
        button.textContent = "Full Screen";
        return;
    }
    else if (elem.requestFullscreen) {
        elem.requestFullscreen();
        button.textContent = "Exit Full Screen";
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
        button.textContent = "Exit Full Screen";
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
        button.textContent = "Exit Full Screen";
    }
}