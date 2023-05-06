function toggleDropDownMenu() {
    document.getElementById("myDropdown").classList.toggle("show");
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
            }
        }
    }
};
