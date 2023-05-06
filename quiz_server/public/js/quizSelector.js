let movieOutput = document.getElementById('movie-output');
let characterOutput = document.getElementById('character-output');
let submitButton = document.getElementById('submit-button');

// when user clicks on a photo, find the first child element (hidden radio button) and active it
document.querySelectorAll('li').forEach((element) => {
    element.addEventListener('click', function(){
        let namesButtons = element.lastElementChild;
        let radioButtons = namesButtons.firstElementChild;
        let figure = element.firstElementChild;
        let image = figure.firstElementChild;
        radioButtons.checked = true;

        // if the selection is a Movie, then display the selection name to the movieOutput textContent
        if (radioButtons.name == "checkboxMovie"){
            movieOutput.style.display = "block";
            movieOutput.textContent = radioButtons.value;
        }
        // if the selection is a Character, then display the selection name to the characterOutput textContent
        else if (radioButtons.name == "checkboxCharacter"){
            characterOutput.style.display = "block";
            characterOutput.textContent = radioButtons.value;
        }
        // if both a movie and character have been selected, then make the submit button pulse
        if (movieOutput.textContent != "" && characterOutput.textContent != ""){
            submitButton.style.color = "rgba(217, 139, 43, 1)";
            submitButton.style.border = "2px rgba(232, 208, 105, 1) solid";
            submitButton.classList.add("submit-pulse");
        }
    })
})