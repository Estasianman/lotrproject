import { RandomFunction } from "../types";

//random number generator
const getRandomNumber: RandomFunction = (min, max) =>
    Math.floor(Math.random() * (max - min) + min);

export { getRandomNumber };
