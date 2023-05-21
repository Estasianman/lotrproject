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

export { getMoviePhotos };