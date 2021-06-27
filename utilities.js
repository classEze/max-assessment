const sortByHeightASC = function (arr){
    arr.sort((a,b)=>a.height - b.height)
}
const sortByHeightDESC = function (arr){
    arr.sort((a,b)=>b.height - a.height)
}
const sortByNameASC = function (arr){
    arr.sort((a,b)=> a.name > b.name ? 1 : a.name == b.name ? 0 : -1)
}
const sortByNameDESC = function (arr){
    arr.sort((a,b)=>a.name > b.name ? -1 : a.name == b.name ? 0 : 1)
}

const filterByGender = function (arr, gender){
    return arr.filter(character=>character.gender.toLowerCase() == gender.toLowerCase())
}
const sumUp= function (arr){
    const numbers = arr.filter(eachValue=> !isNaN(eachValue.height))
    if(numbers.length == 0) return 0
    let sum = numbers.reduce((a,b)=>({height: Number(a.height) + Number(b.height)}))
    return sum.height
}
const convertToFeets = function (arr){
    let sumInCentimeters = sumUp(arr)
    let feets =  parseInt (sumInCentimeters / 30.48) // 1 feet equals 30.48cm
    let remainder = sumInCentimeters % 30.48
     //convert remainder to inches
     inches = (remainder * 0.394).toFixed(2) // 1cm equals 0.394 inch
     return `${feets} ft ${inches} in`
}
module.exports = {sortByHeightASC, sortByHeightDESC, sortByNameASC, sortByNameDESC, filterByGender, sumUp, convertToFeets }
