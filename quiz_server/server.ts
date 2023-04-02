import express from "express";
const axios = require("axios");
const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'));

app.set("view engine", "ejs");
app.set("port", 3000);

//character interface
export interface Characters {
    docs: Doc[];
    total: number;
    limit: number;
    offset: number;
    page: number;
    pages: number;
}

export interface Doc {
    _id: string;
    height: string;
    race: string;
    gender?: Gender;
    birth: string;
    spouse: string;
    death: string;
    realm: string;
    hair: string;
    name: string;
    wikiUrl?: string;
}

export enum Gender {
    Empty = "",
    Female = "Female",
    GenderMale = "male",
    Male = "Male",
    Males = "Males",
    MostLikelyMale = "Most likely male",
    NaN = "NaN",
}

//quote interfaces
export interface Quotes {
    docs: qDoc[];
    total: number;
    limit: number;
    offset: number;
    page: number;
    pages: number;
}

export interface qDoc {
    _id: string;
    dialog: string;
    movie: Movie;
    character: string;
    id: string;
}

export enum Movie {
    The5Cd95395De30Eff6Ebccde5B = "5cd95395de30eff6ebccde5b",
    The5Cd95395De30Eff6Ebccde5D = "5cd95395de30eff6ebccde5d",
}

//Movie interface
export interface Movies {
    docs: MovieDoc[];
    total: number;
    limit: number;
    offset: number;
    page: number;
    pages: number;
}

export interface MovieDoc {
    _id: string;
    name: string;
    runtimeInMinutes: number;
    budgetInMillions: number;
    boxOfficeRevenueInMillions: number;
    academyAwardNominations: number;
    academyAwardWins: number;
    rottenTomatoesScore: number;
}

interface RandomFunction {
    (min: number, max: number): number
}

interface CombineArrayElements {
    (arrayEmpty: any[], arrayToTransfer: any[]): void | Promise<void>
}

interface ApiData {
    quote: qDoc,
    charactersArray: Doc[],
    moviesArray: MovieDoc[];
    correctCharacterName: string,
    correctMovieName: string
}

let apiData: ApiData = {
    quote: {
        _id: "",
        dialog: "",
        movie: Movie.The5Cd95395De30Eff6Ebccde5D,
        character: "",
        id: ""
    },
    charactersArray: [],
    moviesArray: [],
    correctCharacterName: "",
    correctMovieName: ""
};

let quotes: Quotes;
let characters: Characters = {
    docs: [],
    total: 0,
    limit: 0,
    offset: 0,
    page: 0,
    pages: 0,
};
let movies: Movies;

interface GameVariables {
    movieArray: MovieDoc[],
    correctMovieName: string,
    characterArray: Doc[],
    correctCharacterName: string,
    userMovieAnswer: string,
    userCharacterAnswer: string,
    gameCounter: number,
    score: number,
    randomNumber: number,
    moviePhotoArray: any[],
    characterPhotoArray: any[],
    previousQuizAnswers: string
};

let gameData: GameVariables = {
    movieArray: [],
    correctMovieName: "",
    characterArray: [],
    correctCharacterName: "",
    userMovieAnswer: "",
    userCharacterAnswer: "",
    gameCounter: 7,
    score: 0,
    randomNumber: 0,
    moviePhotoArray: [],
    characterPhotoArray: [],
    previousQuizAnswers: ""
};

interface SaveQuotes {
    gameQuotesArray: string[],
    characterFromQuoteArray: string[]
}

let saveGameQuotes: SaveQuotes = {
    gameQuotesArray: [],
    characterFromQuoteArray: []
};



//get API

const getApiData = async (): Promise<void> => {
    //authorization token
    let token: string = "UOzmNvWKAN3QRiFrHRIh";
    //authorization header
    const auth = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
    //get quotes
    let result = await axios.get("https://the-one-api.dev/v2/quote", auth);
    quotes = result.data;

    //get characters
    result = await axios.get("https://the-one-api.dev/v2/character", auth);
    characters = result.data;

    //get movies
    result = await axios.get("https://the-one-api.dev/v2/movie", auth);
    movies = result.data;

    //random
    const getRandomNumber : RandomFunction = (min, max) => Math.floor(Math.random() * (max - min) + min);

    // get photo from wiki page
    const getPhoto = async (name: string): Promise<string> => {
        let badCharacter: boolean = false;
        let startIndex: number = 0;
        let endIndex: number = 0;
        let htmlSubstring: string = "";
        let photoSource: string = "";

        name = name.replace(/ /g, "_");
        switch (name) {
            case "The_Unexpected_Journey":
                name = `The_Hobbit:_An_Unexpected_Journey`;
                break;
            case "The_Desolation_of_Smaug":
                name = `The_Hobbit:_${name}`;
                break;
            case "The_Battle_of_the_Five_Armies":
                name = `The_Hobbit:_${name}`;
                break;
            case "The_Fellowship_of_the_Ring":
                name = `The_Lord_of_the_Rings:_${name}`;
                break;
            case "The_Two_Towers":
                name = `The_Lord_of_the_Rings:_${name}`;
                break;
            case "The_Return_of_the_King":
                name = `The_Lord_of_the_Rings:_${name}`;
                break;
            default:
                break;
        }
        if (name == "Mar" || name == "Wife_of_Barach" || name == "Argeleb_I" || name == "Carc" || name == "Éomer") {
            badCharacter = true;
        }
        if (!badCharacter) {

            const response = await axios.get(
                `https://lotr.fandom.com/wiki/${name}`
            );
            const rawHtml: string = response.data;

            startIndex = rawHtml.indexOf('"https://static');
            endIndex = rawHtml.indexOf('"', startIndex + 1);
            htmlSubstring = rawHtml.substring(startIndex + 1, endIndex);
            let pngIndex: number = -1;
            if (name == "Legolas"){
                pngIndex = htmlSubstring.indexOf('PNG');
            }
            else{
                pngIndex = htmlSubstring.indexOf('png');
            }
            
            let jpgIndex: number = htmlSubstring.indexOf('jpg');
            let gifIndex: number = htmlSubstring.indexOf('gif');

            if (pngIndex == -1 && gifIndex == -1) {
                photoSource = htmlSubstring.substring(0, jpgIndex + 3);
            }
            else if (jpgIndex == -1 && pngIndex == -1) {
                photoSource = htmlSubstring.substring(0, gifIndex + 3);
            }
            else if (jpgIndex == -1 && gifIndex == -1) {
                photoSource = htmlSubstring.substring(0, pngIndex + 3);
            }
            if (photoSource == "https://static.wikia.nocookie.net/lotr/images/e/e6/Site-logo.png") {
                photoSource = "/images/character_placeholder.jpg";
            }
        }
        else {
            photoSource = "/images/character_placeholder.jpg";
        }

        return photoSource;
    };

    const addArrayElements : CombineArrayElements = (arrayEmpty, arrayToTransfer) => {
        for (let i = 0; i < 3; i++) {
            arrayEmpty[i] = arrayToTransfer[i];
        }
    };

    const addPhotoArrayElements: CombineArrayElements = async (arrayEmpty, name) => {
        for (let i = 0; i < 3; i++) {
            arrayEmpty[i] = await getPhoto(name[i].name);
        }
    }

    const main = async (): Promise<void> => {

        //find quote and character
        let quoteId: number = 0;
        let characterId: string = "";
        //find character
        quoteId = getRandomNumber(0, quotes.docs.length);
        apiData.quote = quotes.docs[quoteId];
        
        characterId = apiData.quote.character;

        for (let i = 0; i < characters.docs.length; i++) {
            if (characterId == characters.docs[i]._id) {
                apiData.charactersArray[0] = characters.docs[i];
                apiData.correctCharacterName = characters.docs[i].name;
                break;
            }
        }

        while (apiData.charactersArray[0].name == "MINOR_CHARACTER") {
            quoteId = getRandomNumber(0, quotes.docs.length);
            apiData.quote = quotes.docs[quoteId];
            characterId = apiData.quote.character;

            for (let i = 0; i < characters.docs.length; i++) {
                if (characterId == characters.docs[i]._id) {
                    apiData.charactersArray[0] = characters.docs[i];
                    apiData.correctCharacterName = characters.docs[i].name;
                    break;
                }
            }
        };
        // Save Quotes and characters in array
        if (saveGameQuotes.gameQuotesArray[0] != "" && gameData.gameCounter == 1){
            saveGameQuotes.gameQuotesArray.splice(0, saveGameQuotes.gameQuotesArray.length);
            saveGameQuotes.characterFromQuoteArray.splice(0, saveGameQuotes.characterFromQuoteArray.length);
        }
        saveGameQuotes.gameQuotesArray.push(apiData.quote.dialog);
        saveGameQuotes.characterFromQuoteArray.push(apiData.correctCharacterName);

        //find movie
        let movieId: string = apiData.quote.movie;
        for (let i = 0; i < movies.docs.length; i++) {
            if (movieId == movies.docs[i]._id) {
                apiData.moviesArray[0] = movies.docs[i];
                apiData.correctMovieName = movies.docs[i].name;
                break;
            }
        }

        //getting wrong movies

        do {
            apiData.moviesArray[1] = movies.docs[getRandomNumber(2, movies.docs.length)];
            apiData.moviesArray[2] = movies.docs[getRandomNumber(2, movies.docs.length)];

        }while(
            apiData.moviesArray[1] == apiData.moviesArray[0] ||
            apiData.moviesArray[2] == apiData.moviesArray[0] ||
            apiData.moviesArray[1] == apiData.moviesArray[2]
        );
        addPhotoArrayElements(gameData.moviePhotoArray, apiData.moviesArray);
        addPhotoArrayElements(gameData.characterPhotoArray, apiData.charactersArray);
        gameData.correctMovieName = apiData.correctMovieName;
        gameData.correctCharacterName = apiData.correctCharacterName;
        gameData.randomNumber = getRandomNumber(1, 4);

        //getting wrong characters

        const getWrongCharacters = (array: Doc): Doc => {
            let hasQuotes: boolean = false;
            let allQuotes: qDoc[] = quotes.docs;

            do {
                hasQuotes = false;
                array = characters.docs[getRandomNumber(0, characters.docs.length)];

                //check if character has quotes in the API. Otherwise get a different character
                for (let j = 0; j < allQuotes.length && hasQuotes == false; j++) {
                    if (array._id == allQuotes[j].character) {
                        hasQuotes = true;
                    }
                }
            } while (!hasQuotes || array.name == apiData.charactersArray[0].name ||
                    array.name == "MINOR_CHARACTER" ||
                    array.name == "User:Technobliterator/Showcase");

            return array;
        }
        apiData.charactersArray[1] = getWrongCharacters(apiData.charactersArray[1]);
        apiData.charactersArray[2] = getWrongCharacters(apiData.charactersArray[2]);

        while(apiData.charactersArray[1] == apiData.charactersArray[2]){
            apiData.charactersArray[1] = getWrongCharacters(apiData.charactersArray[1]);
        }

        addArrayElements(gameData.movieArray, apiData.moviesArray);
        addArrayElements(gameData.characterArray, apiData.charactersArray);
    }
    main();

    let routes = ["/quiz", "/sudden_death", "/highscore"];

    app.get(routes, (req, res) => {
        res.render('quiz', { dataGame: gameData, dataApi: apiData });
    });

    app.post("/quiz", (req, res) => {
        gameData.userMovieAnswer = req.body.checkboxMovie;
        gameData.userCharacterAnswer = req.body.checkboxCharacter;
        gameData.previousQuizAnswers = "";
        if (gameData.userMovieAnswer == undefined) {
            gameData.userMovieAnswer = "";
        }
        if (gameData.userCharacterAnswer == undefined) {
            gameData.userCharacterAnswer = "";
        }
        if (gameData.userMovieAnswer == apiData.correctMovieName && gameData.userCharacterAnswer == apiData.correctCharacterName) {
            gameData.score++;
            gameData.previousQuizAnswers = `Beide juiste antwoorden! Movie was:<span id="answers-span">  ${gameData.correctMovieName}</span>. Karakter was:<span id="answers-span">  ${gameData.correctCharacterName}</span>.`;
        }
        else if (gameData.userMovieAnswer == apiData.correctMovieName && gameData.userCharacterAnswer != apiData.correctCharacterName) {
            gameData.score = gameData.score + 0.5;
            gameData.previousQuizAnswers = `Alleen filmantwoord correct. Movie was:<span id="answers-span">  ${gameData.correctMovieName}</span>. Karakter was:<span id="answers-span">  ${gameData.correctCharacterName}</span>.`;
        }
        else if(gameData.userMovieAnswer != apiData.correctMovieName && gameData.userCharacterAnswer == apiData.correctCharacterName){
            gameData.score = gameData.score + 0.5;
            gameData.previousQuizAnswers = `Alleen karakterantwoord correct. Movie was:<span id="answers-span">  ${gameData.correctMovieName}</span>. Karakter was:<span id="answers-span">  ${gameData.correctCharacterName}</span>.`;
        }
        else if (gameData.gameCounter != 0){
            gameData.previousQuizAnswers = `Beide foute antwoorden. Movie was:<span id="answers-span">  ${gameData.correctMovieName}</span>. Karakter was:<span id="answers-span">  ${gameData.correctCharacterName}</span>.`;
        }
        gameData.gameCounter++;
        main();

        setTimeout(() => {
            res.render('quiz', { dataGame: gameData, dataApi: apiData });
        }, 1000);
    });

    // app.post("/sudden_death", (req, res) => {
    //     gameData.userMovieAnswer = req.body.checkboxMovie;
    //     gameData.userCharacterAnswer = req.body.checkboxCharacter;
    //     if (gameData.userMovieAnswer == undefined) {
    //         gameData.userMovieAnswer = "";
    //     }
    //     if (gameData.userCharacterAnswer == undefined) {
    //         gameData.userCharacterAnswer = "";
    //     }
    //     if (gameData.userMovieAnswer == apiData.correctMovieName && gameData.userCharacterAnswer == apiData.correctCharacterName) {
    //         gameData.score++;
    //     }
    //     else  {
    //         res.render('quiz', { dataGame: gameData, dataApi: apiData });
    //     }
    //     gameData.gameCounter++;
    //     main();

    //     setTimeout(() => {
    //         res.render('quiz', { dataGame: gameData, dataApi: apiData });
    //     }, 500);
    // });

    app.post("/highscore", (req, res) => {
        gameData.userMovieAnswer = req.body.checkboxMovie;
        gameData.userCharacterAnswer = req.body.checkboxCharacter;
        if (gameData.userMovieAnswer == undefined) {
            gameData.userMovieAnswer = "";
        }
        if (gameData.userCharacterAnswer == undefined) {
            gameData.userCharacterAnswer = "";
        }
        if (gameData.userMovieAnswer == apiData.correctMovieName && gameData.userCharacterAnswer == apiData.correctCharacterName) {
            gameData.score++;
        }
        res.render('highscore', { dataGame: gameData, dataApi: apiData, dataQuotes: saveGameQuotes });
    });

    app.listen(app.get("port"), () =>
        console.log("[server] http://localhost:" + app.get("port"))
    );
}
getApiData();
export { }