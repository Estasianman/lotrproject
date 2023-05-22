let main = document.getElementsByTagName("main")[0];
main.classList.toggle("main-close");
let mainClass = document.getElementsByClassName("main-close")[0];

function toggleDropDownMenu() {
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        let openDropdown = dropdowns[i];
        // if menu is already open, close it and move main up:
        if (openDropdown.classList.contains("show")) {
            openDropdown.classList.remove("show");
            mainClass.classList.remove("main");
            mainClass.setAttribute('class', 'main-close');
            return;
        }
    }
    // if menu is not open, open it and move main down:
    document.getElementById("myDropdown").classList.toggle("show");
    mainClass.classList.remove("main-close");
    mainClass.setAttribute('class', 'main');
    window.scrollTo(0, 0);
}

// if user clicks anywhere on screen, close the dropdown menu
window.onclick = function (event) {
    if (!event.target.matches("#profile-button")) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains("show")) {
                openDropdown.classList.remove("show");
                mainClass.classList.remove("main");
                mainClass.setAttribute('class', 'main-close');
            }
        }
    }
};

// When user scrolls, close the menu bar:
let lastScrollTop = 0;

window.addEventListener("scroll", function () {
    let st = window.pageYOffset || document.documentElement.scrollTop;
    // Only if scroll direction is down, close menu:
    if (st > lastScrollTop) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains("show")) {
                openDropdown.classList.remove("show");
                mainClass.classList.remove("main");
                mainClass.setAttribute('class', 'main-close');
            }
        }
    }
    lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
}, false);