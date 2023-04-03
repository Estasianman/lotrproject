let movieOutput = document.getElementById('movie-output');
let characterOutput = document.getElementById('character-output');
let submitButton = document.getElementById('submit-button');

document.querySelectorAll('li').forEach((element) => {
    element.addEventListener('click', function(){
        let namesButtons = element.lastElementChild;
        let radioButtons = namesButtons.firstElementChild;
        let figure = element.firstElementChild;
        let image = figure.firstElementChild;
        // console.log(image)
        radioButtons.checked = true;

        if (radioButtons.name == "checkboxMovie"){
            movieOutput.style.display = "block";
            movieOutput.textContent = radioButtons.value;
        }
        else if (radioButtons.name == "checkboxCharacter"){
            characterOutput.style.display = "block";
            characterOutput.textContent = radioButtons.value;
        }
        if (movieOutput.textContent != "" && characterOutput.textContent != ""){
            submitButton.style.color = "rgba(217, 139, 43, 1)";
            submitButton.style.border = "2px rgba(232, 208, 105, 1) solid";
            submitButton.classList.add("submit-pulse");
        }
    })
})