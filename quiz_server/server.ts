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

interface ApiData {
    quote: any,
    characterCorrect: Doc,
    correctMovie: Doc,
    wrongCharacter1: Doc,
    wrongCharacter2: Doc,
    wrongMovie1: Doc,
    wrongMovie2: Doc
}

let apiData: ApiData = {
    quote: "",
    characterCorrect: {
        _id: "",
        height: "",
        race: "",
        gender: Gender.Empty,
        birth: "",
        spouse: "",
        death: "",
        realm: "",
        hair: "",
        name: "",
        wikiUrl: "",
    },

    correctMovie: {
        _id: "",
        height: "",
        race: "",
        gender: Gender.Empty,
        birth: "",
        spouse: "",
        death: "",
        realm: "",
        hair: "",
        name: "",
        wikiUrl: "",
    },
    wrongCharacter1: {
        _id: "",
        height: "",
        race: "",
        gender: Gender.Empty,
        birth: "",
        spouse: "",
        death: "",
        realm: "",
        hair: "",
        name: "",
        wikiUrl: "",
    },
    wrongCharacter2: {
        _id: "",
        height: "",
        race: "",
        gender: Gender.Empty,
        birth: "",
        spouse: "",
        death: "",
        realm: "",
        hair: "",
        name: "",
        wikiUrl: "",
    },
    wrongMovie1: {
        _id: "",
        height: "",
        race: "",
        gender: Gender.Empty,
        birth: "",
        spouse: "",
        death: "",
        realm: "",
        hair: "",
        name: "",
        wikiUrl: "",
    },
    wrongMovie2: {
        _id: "",
        height: "",
        race: "",
        gender: Gender.Empty,
        birth: "",
        spouse: "",
        death: "",
        realm: "",
        hair: "",
        name: "",
        wikiUrl: "",
    }
};

let quotes: any = "";
let characters: Characters = {
    docs: [],
    total: 0,
    limit: 0,
    offset: 0,
    page: 0,
    pages: 0,
};
let movies: any = "";

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


    const main = async () => {

        //find quote and character
        let quoteId: number = 0;
        let characterId: string = "";
        //find character
        quoteId = getRandomNumber(0, quotes.docs.length);
        apiData.quote = quotes.docs[quoteId];
        characterId = apiData.quote.character;
        apiData.characterCorrect = characters.docs[getRandomNumber(0, characters.docs.length)];
        for (let i = 0; i < characters.docs.length; i++) {
            if (characterId == characters.docs[i]._id) {
                apiData.characterCorrect = characters.docs[i];
                break;
            }
        }

        while (apiData.characterCorrect.name == "MINOR_CHARACTER") {
            quoteId = getRandomNumber(0, quotes.docs.length);
            apiData.quote = quotes.docs[quoteId];
            characterId = apiData.quote.character;
            apiData.characterCorrect = characters.docs[getRandomNumber(0, characters.docs.length)];
            for (let i = 0; i < characters.docs.length; i++) {
                if (characterId == characters.docs[i]._id) {
                    apiData.characterCorrect = characters.docs[i];
                    break;
                }
            }
        };
        apiData.correctMovie = movies.docs[getRandomNumber(0, characters.docs.length)];
        let movieId: string = apiData.quote.movie;

        //find movie
        for (let i = 0; i < movies.docs.length; i++) {
            if (movieId == movies.docs[i]._id) {
                apiData.correctMovie = movies.docs[i];
                break;
            }
        }
        //getting wrong characters
        apiData.wrongCharacter1 =
            characters.docs[getRandomNumber(0, characters.docs.length)];
        apiData.wrongCharacter2 =
            characters.docs[getRandomNumber(0, characters.docs.length)];
        while (
            apiData.wrongCharacter1 == apiData.characterCorrect ||
            apiData.wrongCharacter2 == apiData.characterCorrect ||
            apiData.wrongCharacter1.name == "MINOR_CHARACTER" ||
            apiData.wrongCharacter2.name == "MINOR_CHARACTER"
        ) {
            apiData.wrongCharacter1 = characters.docs[getRandomNumber(0, characters.docs.length)];
            apiData.wrongCharacter2 = characters.docs[getRandomNumber(0, characters.docs.length)];
        }

        //getting wrong movies
        apiData.wrongMovie1 = movies.docs[getRandomNumber(2, movies.docs.length)];
        apiData.wrongMovie2 = movies.docs[getRandomNumber(2, movies.docs.length)];
        while (
            apiData.wrongMovie1 == apiData.correctMovie ||
            apiData.wrongMovie2 == apiData.correctMovie ||
            apiData.wrongMovie1 == apiData.wrongMovie2
        ) {
            apiData.wrongMovie1 = movies.docs[getRandomNumber(2, movies.docs.length)];
            apiData.wrongMovie2 = movies.docs[getRandomNumber(2, movies.docs.length)];
        }
    }
    main();

    //extra code to get character photo from wiki page
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

        return photoSource;
    };

    interface GameVariables {
        correctMovie: Doc,
        correctCharacter: Doc,
        userMovieAnswer: string,
        userCharacterAnswer: string,
        gameCounter: number,
        score: number,
        halfPoints: number,
        scoreString: string,
        movieFoto1: any,
        movieFoto2: any,
        movieFoto3: any,
        characterFoto1: any,
        characterFoto2: any,
        characterFoto3: any,

    }

    let gameData: GameVariables = {
        correctMovie: apiData.correctMovie,
        correctCharacter: apiData.characterCorrect,
        userMovieAnswer: "",
        userCharacterAnswer: "",
        gameCounter: 1,
        score: 0,
        halfPoints: 0,
        scoreString: "",
        movieFoto1: getPhoto(apiData.correctMovie.name),
        movieFoto2: getPhoto(apiData.wrongMovie1.name),
        movieFoto3: getPhoto(apiData.wrongMovie2.name),
        characterFoto1: getPhoto(apiData.characterCorrect.name),
        characterFoto2: getPhoto(apiData.wrongCharacter1.name),
        characterFoto3: getPhoto(apiData.wrongCharacter2.name),
    };
    gameData.scoreString = `${gameData.score}`;
    gameData.scoreString = (parseFloat(gameData.scoreString)).toFixed(2);

    gameData.movieFoto1.then((result: any) => {
        gameData.movieFoto1 = result;
    });
    gameData.movieFoto2.then((result: any) => {
        gameData.movieFoto2 = result;
    });
    gameData.movieFoto3.then((result: any) => {
        gameData.movieFoto3 = result;
    });

    gameData.characterFoto1.then((result: any) => {
        gameData.characterFoto1 = result;
    });
    gameData.characterFoto2.then((result: any) => {
        gameData.characterFoto2 = result;
    });
    gameData.characterFoto3.then((result: any) => {
        gameData.characterFoto3 = result;
    });

    app.get("/", (req, res) => {
        res.render('quiz', { data: gameData, dataApi: apiData });
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
        if (gameData.userMovieAnswer == gameData.correctMovie.name && gameData.userCharacterAnswer == gameData.correctCharacter.name) {
            gameData.scoreString = `${gameData.score + 1},${gameData.halfPoints}`;
            gameData.score++;
        }
        else if (gameData.userMovieAnswer == gameData.correctMovie.name || gameData.userCharacterAnswer == gameData.correctCharacter.name) {
            if (gameData.halfPoints == 0) {
                gameData.scoreString = `${gameData.score},${gameData.halfPoints + 5}`;
                gameData.halfPoints = gameData.halfPoints + 5;
            }
            else {
                gameData.scoreString = `${gameData.score + 1},${gameData.halfPoints - 5}`;
                gameData.score++;
                gameData.halfPoints = gameData.halfPoints - 5;
            }
        }
        gameData.gameCounter++;
        main();
        gameData.movieFoto1 = getPhoto(apiData.correctMovie.name).then((result: any) => {
            gameData.movieFoto1 = result;
        });
        gameData.movieFoto2 = getPhoto(apiData.wrongMovie1.name).then((result: any) => {
            gameData.movieFoto2 = result;
        });
        gameData.movieFoto3 = getPhoto(apiData.wrongMovie2.name).then((result: any) => {
            gameData.movieFoto3 = result;
        });
        gameData.characterFoto1 = getPhoto(apiData.characterCorrect.name).then((result: any) => {
            gameData.characterFoto1 = result;
        });
        gameData.characterFoto2 = getPhoto(apiData.wrongCharacter1.name).then((result: any) => {
            gameData.characterFoto2 = result;
        });
        gameData.characterFoto3 = getPhoto(apiData.wrongCharacter2.name).then((result: any) => {
            gameData.characterFoto3 = result;
        });
        gameData.correctMovie = apiData.correctMovie;
        gameData.correctCharacter = apiData.characterCorrect;

        setTimeout(() => {
            res.render('quiz', { data: gameData, dataApi: apiData });
        }, 1000);
    });

    app.listen(app.get("port"), () =>
        console.log("[server] http://localhost:" + app.get("port"))
    );
}
getApiData();
export { }
