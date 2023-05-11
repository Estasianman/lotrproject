import express from "express";
const axios = require("axios");
import { MongoClient } from "mongodb";
const uri =
  "mongodb+srv://server:server123@rikcluster.mh2n1dx.mongodb.net/?retryWrites=true&w=majority";
const app = express();
import session from "express-session";
let client = new MongoClient(uri);

declare module "express-session" {
  export interface SessionData {
    user: Player;
  }
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("port", 3000);

app.use(
  session({
    name: "login",
    secret: "argew",
    resave: false,
    saveUninitialized: true,

    cookie: {
      maxAge: 6000000,
    },
  })
);

// Player interface which is saved in databank
interface Player {
  name: string;
  ww: string;
  qscore?: number;
  sdscore?: number;
  favorites?: FavoriteList[];
  blacklisted?: Blacklist[];
}

// Blacklist interface
interface Blacklist {
  characterName: string;
  blacklistQuotes: string[];
  reason: string[];
}

// FavoriteList interface
interface FavoriteList {
  characterName: string;
  favoriteQuotes: string[];
  characterInfo: Doc;
}

//API character interface
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

//API quote interfaces
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

//API Movie interface
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

// Random generator interface
interface RandomFunction {
  (min: number, max: number): number;
}

interface CombineArrayElements {
  (arrayEmpty: any[], arrayToTransfer: any[]): void;
}

// interface to save data from the API
interface ApiData {
  quote: qDoc;
  charactersArray: Doc[];
  moviesArray: MovieDoc[];
  correctCharacterName: string;
  correctMovieName: string;
}

let apiData: ApiData = {
  quote: {
    _id: "",
    dialog: "",
    movie: Movie.The5Cd95395De30Eff6Ebccde5D,
    character: "",
    id: "",
  },
  charactersArray: [],
  moviesArray: [],
  correctCharacterName: "",
  correctMovieName: "",
};

// These three variables below are used to save all quotes, movies, and characters from API while server is running so that we only have to do an API call once when server is started
let quotes: Quotes;
let movies: Movies;
let characters: Characters = {
  docs: [],
  total: 0,
  limit: 0,
  offset: 0,
  page: 0,
  pages: 0,
};

// main game variables used in the quiz
interface Highscores {
  name: string;
  score: number;
}

interface GameVariables {
  movieArray: MovieDoc[];
  correctMovieName: string;
  characterArray: Doc[];
  correctCharacterName: string;
  userMovieAnswer: string;
  userCharacterAnswer: string;
  gameCounter: number;
  score: number;
  randomNumberMovie: number;
  randomNumberCharacter: number;
  moviePhotoArray: any[];
  characterPhotoArray: any[];
  gameType: string;
  headerTitle: string;
  userCorrectFeedback: {
    rightMovie: number;
    rightCharacter: number;
  };
  qHighscores: Highscores[];
  sHighscores: Highscores[];
}

let gameData: GameVariables = {
  movieArray: [],
  correctMovieName: "",
  characterArray: [],
  correctCharacterName: "",
  userMovieAnswer: "",
  userCharacterAnswer: "",
  gameCounter: 0,
  score: 0,
  randomNumberMovie: 0,
  randomNumberCharacter: 0,
  moviePhotoArray: [],
  characterPhotoArray: [],
  gameType: "",
  headerTitle: "",
  userCorrectFeedback: {
    rightMovie: 0,
    rightCharacter: 0,
  },
  qHighscores: [],
  sHighscores: [],
};

// find Doc (character info) to put in favorite list data
const findCharacterInfoForFavoriteList = (nameToFind: string): Doc => {
  let foundCharacterInfo: Doc = {
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
  };

  let found: boolean = false;

  for (let i = 0; i < characters.docs.length && !found; i++) {
    if (characters.docs[i].name == nameToFind) {
      foundCharacterInfo = characters.docs[i];
      found = true;
    }
  }
  return foundCharacterInfo;
};

//add to blacklist
const addtoBlacklist = async (
  req: any,
  name: string,
  quote: string,
  reason: string
): Promise<void> => {
  try {
    //connect
    await client.connect();

    // check if character already has quotes in the blacklist:
    let characterIndex: number = -1;
    for (
      let i = 0;
      i < req.session.user.blacklisted.length && characterIndex == -1;
      i++
    ) {
      if (req.session.user.blacklisted[i].characterName == name) {
        characterIndex = i;
      }
    }

    // if character already has quotes in the blacklist, then add the new quote to the characters list of blacklist quotes:
    if (characterIndex != -1) {
      req.session.user.blacklisted[characterIndex].blacklistQuotes.push(quote);
      req.session.user.blacklisted[characterIndex].reason.push(reason);
    }
    // if character is not in the blacklist yet then add a new blacklist object to the users blacklist array:
    else {
      let newBlacklistData: Blacklist = {
        characterName: name,
        blacklistQuotes: [],
        reason: [],
      };

      newBlacklistData.blacklistQuotes.push(quote);
      newBlacklistData.reason.push(reason);
      req.session.user.blacklisted.push(newBlacklistData);
    }

    //add to database
    await client
      .db("LOTR")
      .collection("users")
      .updateOne(
        { name: req.session.user.name },
        { $set: { blacklisted: req.session.user.blacklisted } }
      );
  } catch (exc: any) {
    console.log(exc.message);
  } finally {
    await client.close();
  }
};

//add to favorites
const addtoFavorites = async (
  req: any,
  name: string,
  quote: string
): Promise<void> => {
  try {
    //connect
    await client.connect();

    // check if character already has quotes in the favorite list:
    let characterIndex: number = -1;
    for (
      let i = 0;
      i < req.session.user.favorites.length && characterIndex == -1;
      i++
    ) {
      if (req.session.user.favorites[i].characterName == name) {
        characterIndex = i;
      }
    }

    // if character already has quotes in the favorite list, then add the new quote to the characters list of favorite list quotes:
    if (characterIndex != -1) {
      req.session.user.favorites[characterIndex].favoriteQuotes.push(quote);
    }
    // if character is not in the favorite list yet then add a new favorite list object to the users favorite list array:
    else {
      let newFavoriteListData: FavoriteList = {
        characterName: name,
        favoriteQuotes: [],
        characterInfo: {
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
      };

      newFavoriteListData.favoriteQuotes.push(quote);
      newFavoriteListData.characterInfo =
        findCharacterInfoForFavoriteList(name);
      req.session.user.favorites.push(newFavoriteListData);
    }

    //add to database
    await client
      .db("LOTR")
      .collection("users")
      .updateOne(
        { name: req.session.user.name },
        { $set: { favorites: req.session.user.favorites } }
      );
  } catch (exc: any) {
    console.log(exc.message);
  } finally {
    await client.close();
  }
};

//check if user is logged in
const checkSession = (req: any, res: any, next: any): void => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

//main function
const getApiData = async (): Promise<void> => {
  //authorization token
  let token: string = "UOzmNvWKAN3QRiFrHRIh";
  //authorization header
  const auth = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    //get quotes from api
    let result = await axios.get("https://the-one-api.dev/v2/quote", auth);
    quotes = result.data;

    //get characters from api
    result = await axios.get("https://the-one-api.dev/v2/character", auth);
    characters = result.data;

    //get movies from api
    result = await axios.get("https://the-one-api.dev/v2/movie", auth);
    movies = result.data;
  } catch (error: any) {
    console.log(`${error.message}: ${error.response.data}`);
    return;
  }

  //random number generator
  const getRandomNumber: RandomFunction = (min, max) =>
    Math.floor(Math.random() * (max - min) + min);

  // get movie photo url function
  const getMoviePhotos = (name: string): string => {
    let photoSource: string = "";

    name = name.replace(/ /g, "_");
    switch (name) {
      case "The_Unexpected_Journey":
        photoSource = "/images/an-unexpected-journey.jpg";
        break;
      case "The_Desolation_of_Smaug":
        photoSource = "/images/the-desolation-of-smaug.jpg";
        break;
      case "The_Battle_of_the_Five_Armies":
        photoSource = "/images/battle-of-five-armies.jpg";
        break;
      case "The_Fellowship_of_the_Ring":
        photoSource = "/images/fellowship.jpg";
        break;
      case "The_Two_Towers":
        photoSource = "/images/two-towers.jpg";
        break;
      case "The_Return_of_the_King":
        photoSource = "/images/return-of-the-king.jpg";
        break;
      default:
        break;
    }
    return photoSource;
  };

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

  const main = async (req: any): Promise<void> => {
    // get users blacklisted quotes
    let blacklistedQuotes: string[] = [];
    let quoteId: number = 0;
    let characterId: string = "";

    // if user has no blacklist quotes we can skip this step
    if (
      req.session.user.blacklisted != null &&
      req.session.user.blacklisted != undefined
    ) {
      for (const character of req.session.user.blacklisted) {
        for (let i = 0; i < character.blacklistQuotes.length; i++) {
          blacklistedQuotes.push(character.blacklistQuotes[i]);
        }
      }

      //find random quote
      // check if random quote is not in the users blacklist
      let notInBlacklist: boolean = false;

      while (!notInBlacklist) {
        quoteId = getRandomNumber(0, quotes.docs.length);
        apiData.quote = quotes.docs[quoteId];
        if (blacklistedQuotes.indexOf(apiData.quote.dialog) == -1) {
          notInBlacklist = true;
        }
      }
      characterId = apiData.quote.character;
    } else {
      quoteId = getRandomNumber(0, quotes.docs.length);
      apiData.quote = quotes.docs[quoteId];
      characterId = apiData.quote.character;
    }

    // find the character that matches the random quote
    for (let i = 0; i < characters.docs.length; i++) {
      if (characterId == characters.docs[i]._id) {
        apiData.charactersArray[0] = characters.docs[i];
        apiData.correctCharacterName = characters.docs[i].name;
        break;
      }
    }

    // check if the character from the random quote is not MINOR_CHARACTER, else get new quote and character
    while (apiData.charactersArray[0].name == "MINOR_CHARACTER") {
      if (
        req.session.user.blacklisted != null &&
        req.session.user.blacklisted != undefined
      ) {
        let notInBlacklist: boolean = false;

        while (!notInBlacklist) {
          quoteId = getRandomNumber(0, quotes.docs.length);
          apiData.quote = quotes.docs[quoteId];
          if (blacklistedQuotes.indexOf(apiData.quote.dialog) == -1) {
            notInBlacklist = true;
          }
        }
      } else {
        quoteId = getRandomNumber(0, quotes.docs.length);
        apiData.quote = quotes.docs[quoteId];
      }

      characterId = apiData.quote.character;

      for (let i = 0; i < characters.docs.length; i++) {
        if (characterId == characters.docs[i]._id) {
          apiData.charactersArray[0] = characters.docs[i];
          apiData.correctCharacterName = characters.docs[i].name;
          break;
        }
      }
    }

    //find correct movie from where that quote came from
    let movieId: string = apiData.quote.movie;
    for (let i = 0; i < movies.docs.length; i++) {
      if (movieId == movies.docs[i]._id) {
        apiData.moviesArray[0] = movies.docs[i];
        apiData.correctMovieName = movies.docs[i].name;
        break;
      }
    }

    //getting random wrong movies
    do {
      apiData.moviesArray[1] =
        movies.docs[getRandomNumber(2, movies.docs.length)];
      apiData.moviesArray[2] =
        movies.docs[getRandomNumber(2, movies.docs.length)];
    } while (
      apiData.moviesArray[1] == apiData.moviesArray[0] ||
      apiData.moviesArray[2] == apiData.moviesArray[0] ||
      apiData.moviesArray[1] == apiData.moviesArray[2]
    );

    // put correct movie and character names into gameData
    gameData.correctMovieName = apiData.correctMovieName;
    gameData.correctCharacterName = apiData.correctCharacterName;
    //get random number to be used on quiz.ejs for displaying selections
    gameData.randomNumberMovie = getRandomNumber(1, 4);
    gameData.randomNumberCharacter = getRandomNumber(1, 3);

    //get random wrong characters function
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
      } while (
        !hasQuotes ||
        array.name == apiData.charactersArray[0].name ||
        array.name == "MINOR_CHARACTER" ||
        array.name == "User:Technobliterator/Showcase"
      );

      return array;
    };

    // Call getWrongCharacters function
    apiData.charactersArray[1] = getWrongCharacters(apiData.charactersArray[1]);
    apiData.charactersArray[2] = getWrongCharacters(apiData.charactersArray[2]);

    // make sure the two random wrong characters are not the same
    while (apiData.charactersArray[1] == apiData.charactersArray[2]) {
      apiData.charactersArray[1] = getWrongCharacters(
        apiData.charactersArray[1]
      );
    }

    // Put character and movie data into gameData arrays
    addCharacterPhotoArrayElements(
      gameData.characterPhotoArray,
      apiData.charactersArray
    );
    addMoviePhotoArrayElements(gameData.moviePhotoArray, apiData.moviesArray);

    addArrayElements(gameData.movieArray, apiData.moviesArray);
    addArrayElements(gameData.characterArray, apiData.charactersArray);
  };

  const getHighScores = async () => {
    gameData.qHighscores.slice(0, gameData.qHighscores.length);
    gameData.sHighscores.slice(0, gameData.sHighscores.length);
    try {
      await client.connect();

      const data = await client
        .db("LOTR")
        .collection("users")
        .find({})
        .sort({ qscore: -1 })
        .limit(10);
      let qScores = await data.toArray();
      qScores.forEach((element, index) => {
        if (element.qscore != undefined) {
          gameData.qHighscores[index] = { name: "", score: 0 };
          gameData.qHighscores[index].name = element.name;
          gameData.qHighscores[index].score = element.qscore;
        }
      });
      const data2 = await client
        .db("LOTR")
        .collection("users")
        .find({})
        .sort({ sdscore: -1 })
        .limit(10);
      let sScores = await data2.toArray();
      sScores.forEach((element, index) => {
        if (element.sdscore != undefined) {
          gameData.sHighscores[index] = { name: "", score: 0 };
          gameData.sHighscores[index].name = element.name;
          gameData.sHighscores[index].score = element.sdscore;
        }
      });
    } catch (error: any) {
      console.log(error.message);
    } finally {
      await client.close();
    }
  };

  // array for app.get routes:
  let routes = [
    "/quiz",
    "/sudden_death",
    "/highscore",
    "/index",
    "/favorites",
    "/blacklist",
    "/account",
  ];

  app.get(routes, checkSession, async (req, res) => {
    let parsedUrl = new URL(`http://localhost:${app.get("port")}${req.url}`);
    let path = parsedUrl.pathname;
    console.log(path);
    // check which app.get route was requested:
    switch (path) {
      case "/quiz":
        // reset game variables when user starts a new game:
        gameData.score = 0;
        gameData.gameCounter = 1;
        gameData.userCorrectFeedback.rightMovie = 0;
        gameData.userCorrectFeedback.rightCharacter = 0;

        main(req);
        gameData.headerTitle = "10 Rounds";
        gameData.gameType = "quiz";
        res.render("quiz", { dataGame: gameData, dataApi: apiData });
        break;
      case "/sudden_death":
        // reset game variables when user starts a new game:
        gameData.score = 0;
        gameData.gameCounter = 1;
        gameData.userCorrectFeedback.rightMovie = 0;
        gameData.userCorrectFeedback.rightCharacter = 0;

        main(req);
        gameData.headerTitle = "Sudden Death";
        gameData.gameType = "sudden_death";
        res.render("quiz", { dataGame: gameData, dataApi: apiData });
        break;
      case "/highscore":
        await getHighScores();
        gameData.headerTitle = "Highscore";
        gameData.gameType = "quiz";
        res.render("highscore", {
          dataGame: gameData,
          dataApi: apiData,
        });
        break;
      case "/index":
        gameData.headerTitle = "LOTR Quiz";
        gameData.gameType = "";
        res.render("index", {
          dataGame: gameData,
          dataApi: apiData,
          userData: req.session.user,
          alertstate: null,
        });
        break;
      case "/favorites":
        if (req.session.user!.favorites == undefined) {
          let alert: string =
            "You have no favorite quotes yet! <br>Maybe you should play another round";
          gameData.headerTitle = "LOTR Quiz";
          gameData.gameType = "";
          res.render("index", {
            dataGame: gameData,
            dataApi: apiData,
            userData: req.session.user,
            alertstate: alert,
          });
        } else {
          for (let i = 0; i < req.session.user!.favorites!.length; i++) {
            req.session.user!.favorites![i].characterInfo =
              findCharacterInfoForFavoriteList(
                req.session.user!.favorites![i].characterName
              );
          }
          gameData.headerTitle = "Favorites";
          gameData.gameType = "";
          res.render("favorites", {
            dataGame: gameData,
            dataApi: apiData,
            favoriteData: req.session.user!.favorites,
          });
        }

        break;
      case "/blacklist":
        console.log(req.session.user);
        if (req.session.user?.blacklisted == null) {
          let alert: string =
            "You have no blacklisted quotes yet!<br><span>Maybe you should play another round</span>";
          gameData.headerTitle = "LOTR Quiz";
          gameData.gameType = "";
          res.render("index", {
            dataGame: gameData,
            dataApi: apiData,
            userData: req.session.user,
            alertstate: alert,
          });
        } else {
          gameData.headerTitle = "Blacklist";
          gameData.gameType = "";
          res.render("blacklist", {
            dataGame: gameData,
            dataApi: apiData,
            blacklistData: req.session.user!.blacklisted,
          });
        }
        break;
      case "/account":
        gameData.headerTitle = "Account";
        gameData.gameType = "";
        res.render("account", { dataGame: gameData, dataApi: apiData });
        break;

      default:
        break;
    }
  });

  app.get("/", (req, res) => {
    gameData.gameType = "";
    let loggedIn: boolean;
    if (req.session.user) {
      loggedIn = true;
    } else {
      loggedIn = false;
    }

    res.render("landing", { loggedIn: loggedIn });
  });

  app.get("/login", (req, res) => {
    gameData.gameType = "";
    res.render("login");
  });

  app.get("/create", (req, res) => {
    gameData.gameType = "";
    res.render("create");
  });

  //create new User
  app.post("/create", async (req, res) => {
    let NewUser: Player = {
      name: req.body.name,
      ww: req.body.ww,
    };

    try {
      await client.connect();
      const result = await client
        .db("LOTR")
        .collection("users")
        .insertOne(NewUser);
    } catch (exc: any) {
      console.log(exc.message);
    } finally {
      await client.close();
    }
    res.redirect("/login");
  });

  //login
  app.post("/login", async (req, res) => {
    try {
      await client.connect();
      let profile: Player = {
        name: req.body.name,
        ww: req.body.ww,
      };
      let result: Player | null = await client
        .db("LOTR")
        .collection("users")
        .findOne<Player>({ name: profile.name, ww: profile.ww });
      if (result) {
        req.session.user = result;
        req.session.save();
      }
    } catch (exc: any) {
      console.log(exc.message);
    } finally {
      await client.close();
    }
    res.redirect("/index");
  });

  // NOTE: quiz scores are saved into the databank from the app.post highscore
  app.post("/quiz", async (req, res) => {
    gameData.userCorrectFeedback.rightMovie = 0;
    gameData.userCorrectFeedback.rightCharacter = 0;
    // get user/player answers from quiz
    gameData.userMovieAnswer = req.body.checkboxMovie;
    gameData.userCharacterAnswer = req.body.checkboxCharacter;

    // if one of the questions was not answered then change variable from undefined to an empty string
    if (gameData.userMovieAnswer == undefined) {
      gameData.userMovieAnswer = "";
    }
    if (gameData.userCharacterAnswer == undefined) {
      gameData.userCharacterAnswer = "";
    }

    // check if user/player has answered questions correctly

    if (
      gameData.userMovieAnswer == apiData.correctMovieName &&
      gameData.userCharacterAnswer == apiData.correctCharacterName &&
      gameData.gameCounter != 0
    ) {
      gameData.score++;
      gameData.userCorrectFeedback.rightMovie = 1;
      gameData.userCorrectFeedback.rightCharacter = 1;
      // Both correct
    } else if (
      gameData.userMovieAnswer == apiData.correctMovieName &&
      gameData.userCharacterAnswer != apiData.correctCharacterName
    ) {
      gameData.score = gameData.score + 0.5;
      gameData.userCorrectFeedback.rightMovie = 1;
      gameData.userCorrectFeedback.rightCharacter = -1;
      // Only Movie correct
    } else if (
      gameData.userMovieAnswer != apiData.correctMovieName &&
      gameData.userCharacterAnswer == apiData.correctCharacterName
    ) {
      gameData.score = gameData.score + 0.5;
      gameData.userCorrectFeedback.rightMovie = -1;
      gameData.userCorrectFeedback.rightCharacter = 1;
      // Only character correct
    } else if (gameData.gameCounter != 0) {
      gameData.userCorrectFeedback.rightMovie = -1;
      gameData.userCorrectFeedback.rightCharacter = -1;
      // Both wrong
    }

    // Set the game round +1
    gameData.gameCounter++;

    // call main function to get new quote, characters, and movies
    main(req);

    res.render("quiz", { dataGame: gameData, dataApi: apiData });
  });

  app.post("/sudden_death", async (req, res) => {
    gameData.userCorrectFeedback.rightMovie = 0;
    gameData.userCorrectFeedback.rightCharacter = 0;
    // get user/player answers from quiz
    gameData.userMovieAnswer = req.body.checkboxMovie;
    gameData.userCharacterAnswer = req.body.checkboxCharacter;

    // if one of the questions was not answered then change variable from undefined to an empty string
    if (gameData.userMovieAnswer == undefined) {
      gameData.userMovieAnswer = "";
    }
    if (gameData.userCharacterAnswer == undefined) {
      gameData.userCharacterAnswer = "";
    }

    // check if user/player has answered questions correctly
    if (
      gameData.userMovieAnswer == apiData.correctMovieName &&
      gameData.userCharacterAnswer == apiData.correctCharacterName
    ) {
      gameData.score++;
      gameData.userCorrectFeedback.rightMovie = 1;
      gameData.userCorrectFeedback.rightCharacter = 1;
      // Both are correct

      // Set the game round +1
      gameData.gameCounter++;

      // call main function to get new quote, characters, and movies:
      main(req);

      res.render("quiz", { dataGame: gameData, dataApi: apiData });
    } else if (gameData.gameCounter != 0) {
      // Both are wrong.

      // if game score is higher than the users highest score, or if it is the users first time playing then save the score in the databank:
      if (
        req.session.user!.sdscore! < gameData.score ||
        req.session.user!.sdscore! == undefined ||
        req.session.user!.sdscore! == null
      )
        try {
          await client.connect();
          req.session.user!.sdscore = gameData.score;

          let result = await client
            .db("LOTR")
            .collection("users")
            .updateOne(
              { name: req.session.user?.name },
              { $set: { sdscore: gameData.score } }
            );
          await getHighScores();
          res.render("highscore", { dataGame: gameData, dataApi: apiData });
        } catch (exc: any) {
          console.log(exc.message);
        } finally {
          await client.close();
        }
      // if the score is less than the users highest score, go directly to highscore page:
      else {
        await getHighScores();
        res.render("highscore", { dataGame: gameData, dataApi: apiData });
      }
    }
    // this is where a new sudden_death quiz starts if retrying from highscore page:
    else {
      // Set the game round +1
      gameData.gameCounter++;

      // call main function to get new quote, characters, and movies
      main(req);

      res.render("quiz", { dataGame: gameData, dataApi: apiData });
    }
  });

  app.post("/highscore", async (req, res) => {
    gameData.userMovieAnswer = req.body.checkboxMovie;
    gameData.userCharacterAnswer = req.body.checkboxCharacter;
    if (gameData.userMovieAnswer == undefined) {
      gameData.userMovieAnswer = "";
    }
    if (gameData.userCharacterAnswer == undefined) {
      gameData.userCharacterAnswer = "";
    }
    if (
      gameData.userMovieAnswer == apiData.correctMovieName &&
      gameData.userCharacterAnswer == apiData.correctCharacterName
    ) {
      gameData.score++;
    } else if (
      gameData.userMovieAnswer == apiData.correctMovieName ||
      gameData.userCharacterAnswer == apiData.correctCharacterName
    ) {
      gameData.score = gameData.score + 0.5;
    }

    // after the 10 rounds are played, if the score is higher than the users highest score, or if it is the users first time playing then save the score in the databank:
    if (
      req.session.user!.qscore! < gameData.score ||
      req.session.user!.qscore! == undefined ||
      req.session.user!.qscore! == null
    ) {
      try {
        await client.connect();
        req.session.user!.qscore = gameData.score;

        let result = await client
          .db("LOTR")
          .collection("users")
          .updateOne(
            { name: req.session.user?.name },
            { $set: { qscore: gameData.score } }
          );
        await getHighScores();
        res.render("highscore", { dataGame: gameData, dataApi: apiData });
      } catch (exc: any) {
        console.log(exc.message);
      } finally {
        await client.close();
      }
    }
    // if the score is less than the users highest score, go directly to highscore page
    else {
      await getHighScores();
      res.render("highscore", { dataGame: gameData, dataApi: apiData });
    }
  });

  //remove from favorites
  app.get(
    "/deleteFavoriteQuote/:characterIndex/:quoteindex",
    checkSession,
    async (req, res) => {
      try {
        let characterIndex: number = parseInt(req.params.characterIndex);
        let quoteIndex: number = parseInt(req.params.quoteindex);
        req.session.user!.favorites![characterIndex].favoriteQuotes.splice(
          quoteIndex,
          1
        );
        if (
          req.session.user!.favorites![characterIndex].favoriteQuotes ==
          undefined
        ) {
          req.session.user!.blacklisted?.splice(characterIndex, 1);
        }

        await client.connect();

        //remove from list on database
        await client
          .db("LOTR")
          .collection("users")
          .updateOne(
            { name: req.session.user?.name },
            { $set: { blacklisted: req.session.user?.blacklisted } }
          );
      } catch (exc) {
        console.log(exc);
      } finally {
        await client.close();
        res.redirect("/favorites");
      }
    }
  );

  //remove from blacklist
  app.get(
    "/deleteBlacklistQuote/:characterIndex/:quoteindex",
    checkSession,
    async (req, res) => {
      try {
        let characterIndex: number = parseInt(req.params.characterIndex);
        let quoteIndex: number = parseInt(req.params.quoteindex);
        req.session.user!.blacklisted![characterIndex].blacklistQuotes.splice(
          quoteIndex,
          1
        );
        req.session.user!.blacklisted![characterIndex].reason.splice(
          quoteIndex,
          1
        );
        if (
          req.session.user!.blacklisted![characterIndex].blacklistQuotes ==
          undefined
        ) {
          req.session.user!.blacklisted?.splice(characterIndex, 1);
        }

        await client.connect();

        //remove from list on database
        await client
          .db("LOTR")
          .collection("users")
          .updateOne(
            { name: req.session.user?.name },
            { $set: { blacklisted: req.session.user?.blacklisted } }
          );
      } catch (exc) {
        console.log(exc);
      } finally {
        await client.close();
        res.redirect("/blacklist");
      }
    }
  );

  //remove from favorites
  app.get(
    "/deleteFavoriteQuote/:characterIndex/:quoteindex",
    checkSession,
    async (req, res) => {
      try {
        let characterIndex: number = parseInt(req.params.characterIndex);
        let quoteIndex: number = parseInt(req.params.quoteindex);
        req.session.user!.favorites![characterIndex].favoriteQuotes.splice(
          quoteIndex,
          1
        );
        if (
          req.session.user!.favorites![characterIndex].favoriteQuotes ==
          undefined
        ) {
          req.session.user!.favorites!.splice(characterIndex, 1);
        }

        await client.connect();

        //remove from list on database
        await client
          .db("LOTR")
          .collection("users")
          .updateOne(
            { name: req.session.user?.name },
            { $set: { favorites: req.session.user?.favorites } }
          );
      } catch (exc) {
        console.log(exc);
      } finally {
        await client.close();
        res.redirect("/favorites");
      }
    }
  );

  //edit reason
  app.post(
    "/editReason/:characterIndex/:quoteIndex",
    checkSession,
    async (req, res) => {
      try {
        let characterIndex = parseInt(req.params.characterIndex);
        let quoteIndex = parseInt(req.params.characterIndex);
        let newReason: string = req.body.editreason;
        console.log(newReason);

        req.session.user!.blacklisted![characterIndex].reason[quoteIndex] =
          newReason;
        console.log(req.session.user?.blacklisted![characterIndex].reason);
        await client.connect();
        await client
          .db("LOTR")
          .collection("users")
          .updateOne(
            { name: req.session.user?.name },
            { $set: { blacklisted: req.session.user!.blacklisted } }
          );
      } catch (exc) {
        console.log(exc);
      } finally {
        await client.close();
        res.redirect("/blacklist");
      }
    }
  );

  app.listen(app.get("port"), () =>
    console.log("[server] http://localhost:" + app.get("port"))
  );
};

getApiData();
export {};
