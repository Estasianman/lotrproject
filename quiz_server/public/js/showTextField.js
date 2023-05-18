const showTextField = () => {
    const blacklistField = document.getElementById("blacklist-field");
    blacklistField.style.display = "block";

    const form = document.getElementById("blacklist-form");
    form.addEventListener("submit", function (event) {
        event.preventDefault();
    });
}