import { ObjectId } from "mongodb";

// Player interface which is saved in databank
export interface Player {
    _id?: any;
    name: string;
    ww: string;
    qscore?: number;
    sdscore?: number;
    favorites?: FavoriteList[];
    blacklisted?: Blacklist[];
}

// Blacklist interface
export interface Blacklist {
    characterName: string;
    blacklistQuotes: string[];
    reason: string[];
}

// FavoriteList interface
export interface FavoriteList {
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
export interface RandomFunction {
    (min: number, max: number): number;
}

export interface CombineArrayElements {
    (arrayEmpty: any[], arrayToTransfer: any[]): void;
}

// interface to save data from the API
export interface ApiData {
    quote: qDoc;
    charactersArray: Doc[];
    moviesArray: MovieDoc[];
    correctCharacterName: string;
    correctMovieName: string;
}

// main game variables used in the quiz
export interface Highscores {
    name: string;
    score: number;
}

export interface GameVariables {
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
