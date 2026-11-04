const word ="Appld";


const lastLetter = word[word.length - 1];

console.log(lastLetter);

const vowels = ["a", "e", "i", "o", "u"];

if(lastLetter.toLowerCase() === vowels.find(vowel => vowel === lastLetter.toLowerCase())){
    finalLetter = "Yay";
}else{
    finalLetter = "Yow";
}

finalWord = word.replace(lastLetter, finalLetter);

console.log(finalWord);