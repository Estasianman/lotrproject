import { CombineArrayElements } from "../types";
import { getMoviePhotos } from "./getMoviePhotos";

// put character and movie info data into gameData array
const addArrayElements: CombineArrayElements = (
    arrayEmpty,
    arrayToTransfer
) => {
    for (let i = 0; i < 3; i++) {
        arrayEmpty[i] = arrayToTransfer[i];
    }
};

// put character photo url's into gameData array
const addCharacterPhotoArrayElements: CombineArrayElements = (
    arrayEmpty,
    characterArray
) => {
    for (let i = 0; i < 3; i++) {
        let name: string = "";

        // if the character is Gothmog or Haldir, then use a specific string
        if (characterArray[i].name == "Gothmog (Lieutenant of Morgul)") {
            arrayEmpty[i] = `/images/characters/Gothmog.jpg`;
            characterArray[i].name = "Gothmog";
        } else if (characterArray[i].name == "Haldir (Haladin)") {
            arrayEmpty[i] = `/images/characters/Haldir.jpg`;
        }
        // Else just put the character name after this string
        else {
            name = characterArray[i].name.replace(/ /g, "_");
            arrayEmpty[i] = `/images/characters/${name}.jpg`;
        }
    }
};

// put movie photo url's into gameData array
const addMoviePhotoArrayElements: CombineArrayElements = (
    arrayEmpty,
    MovieArray
) => {
    for (let i = 0; i < 3; i++) {
        arrayEmpty[i] = getMoviePhotos(MovieArray[i].name);
    }
};

export { addArrayElements, addCharacterPhotoArrayElements, addMoviePhotoArrayElements };