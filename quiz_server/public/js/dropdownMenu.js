let main = document.getElementsByTagName("main")[0];
main.classList.toggle("main-close");
let mainClass = document.getElementsByClassName("main-close")[0];

function toggleDropDownMenu() {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        let i;
        for (i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains("show")) {
                openDropdown.classList.remove("show");
                mainClass.classList.remove("main");
                mainClass.setAttribute('class', 'main-close');
                return;
            }
    }
    // document.getElementById("myDropdown").style.height = "40px";
    document.getElementById("myDropdown").classList.toggle("show");

    mainClass.classList.remove("main-close");
    mainClass.setAttribute('class', 'main');
}

// if user clicks anywhere on screen, close the dropdown menu
window.onclick = function (event) {
    if (!event.target.matches("#profile-button")) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        let i;
        for (i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains("show")) {
                openDropdown.classList.remove("show");
                mainClass.classList.remove("main");
                mainClass.setAttribute('class', 'main-close');
            }
        }
    }
};