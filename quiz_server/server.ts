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
};

let gameData: GameVariables = {
    movieArray: [],
    correctMovieName: "",
    characterArray: [],
    correctCharacterName: "",
    userMovieAnswer: "",
    userCharacterAnswer: "",
    gameCounter: 1,
    score: 0,
    randomNumber: 0,
    moviePhotoArray: [],
    characterPhotoArray: [],
};

//random
const getRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min) + min);
};

//get API

const getApiData = async () => {
    //authorization token
    let token: string = "XfiSnDQochu1YXhRpuz5";
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

    // get photo from wiki page
    const getPhoto = async (name: string) => {

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
        const response = await axios.get(
            `https://lotr.fandom.com/wiki/${name}`
        );
        const rawHtml: string = response.data;

        let startIndex: number = rawHtml.indexOf('"https://static');
        let endIndex: number = rawHtml.indexOf('"', startIndex + 1);
        let htmlSubstring: string = rawHtml.substring(startIndex + 1, endIndex);
        let pngIndex: number = htmlSubstring.indexOf('png');
        let jpgIndex: number = htmlSubstring.indexOf('jpg');
        let gifIndex: number = htmlSubstring.indexOf('gif');
        let photoSource: string = "";
        if (pngIndex == -1 && gifIndex == -1) {
            photoSource = htmlSubstring.substring(0, jpgIndex + 3);
        }
        else if (jpgIndex == -1 && pngIndex == -1) {
            photoSource = htmlSubstring.substring(0, gifIndex + 3);
        }
        else if (jpgIndex == -1 && gifIndex == -1) {
            photoSource = htmlSubstring.substring(0, pngIndex + 3);
        }
        if (photoSource == "https://static.wikia.nocookie.net/lotr/images/e/e6/Site-logo.png"){
            photoSource = "/images/character_placeholder.jpg";
        }

        return photoSource;
    };

    const addArrayElements = (array: any[], arrayToAdd: any[]): void => {
        for (let i = 0; i < 3; i++) {
            array[i] = arrayToAdd[i];
        }
    };

    const addPhotoArrayElements = async (array: any[], name: any[]) => {
        for (let i = 0; i < 3; i++) {
            array[i] = await getPhoto(name[i].name);
        }
    }

    const main = async () => {

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

        let movieId: string = apiData.quote.movie;

        //find movie
        for (let i = 0; i < movies.docs.length; i++) {
            if (movieId == movies.docs[i]._id) {
                apiData.moviesArray[0] = movies.docs[i];
                apiData.correctMovieName = movies.docs[i].name;
                break;
            }
        }
        //getting wrong characters
        apiData.charactersArray[1] =
            characters.docs[getRandomNumber(0, characters.docs.length)];
        apiData.charactersArray[2] =
            characters.docs[getRandomNumber(0, characters.docs.length)];
        while (
            apiData.charactersArray[1] == apiData.charactersArray[0] ||
            apiData.charactersArray[2] == apiData.charactersArray[0] ||
            apiData.charactersArray[1].name == "MINOR_CHARACTER" ||
            apiData.charactersArray[2].name == "MINOR_CHARACTER"
        ) {
            apiData.charactersArray[1] = characters.docs[getRandomNumber(0, characters.docs.length)];
            apiData.charactersArray[2] = characters.docs[getRandomNumber(0, characters.docs.length)];
        }

        //getting wrong movies
        apiData.moviesArray[1] = movies.docs[getRandomNumber(2, movies.docs.length)];
        apiData.moviesArray[2] = movies.docs[getRandomNumber(2, movies.docs.length)];
        while (
            apiData.moviesArray[1] == apiData.moviesArray[0] ||
            apiData.moviesArray[2] == apiData.moviesArray[0] ||
            apiData.moviesArray[1] == apiData.moviesArray[2]
        ) {
            apiData.moviesArray[1] = movies.docs[getRandomNumber(2, movies.docs.length)];
            apiData.moviesArray[2] = movies.docs[getRandomNumber(2, movies.docs.length)];
        }
        gameData.correctMovieName = apiData.correctMovieName;
        gameData.correctCharacterName = apiData.correctCharacterName;
        gameData.randomNumber = getRandomNumber(1,3);

        addPhotoArrayElements(gameData.moviePhotoArray, apiData.moviesArray);
        addPhotoArrayElements(gameData.characterPhotoArray, apiData.charactersArray);

        addArrayElements(gameData.movieArray, apiData.moviesArray);
        addArrayElements(gameData.characterArray, apiData.charactersArray);
    }
    main();

    app.get("/", (req, res) => {
        res.render('quiz', { dataGame: gameData, dataApi: apiData });
    });

    app.post("/", (req, res) => {
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
        else if (gameData.userMovieAnswer == apiData.correctMovieName || gameData.userCharacterAnswer == apiData.correctCharacterName) {
            gameData.score = gameData.score + 0.5;
        }
        gameData.gameCounter++;
        main();

        setTimeout(() => {
            res.render('quiz', { dataGame: gameData, dataApi: apiData });
        }, 500);
    });

    app.listen(app.get("port"), () =>
        console.log("[server] http://localhost:" + app.get("port"))
    );
}
getApiData();
export { }
