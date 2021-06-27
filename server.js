const  axios  = require("axios");
const express=require("express");
const app = express();
const {Sequelize} = require('sequelize');
const dotenv = require('dotenv').config()
const RequestIp = require('@supercharge/request-ip')

const {sortByHeightASC,
    sortByHeightDESC,
    filterByGender,
    sortByNameASC,
    sortByNameDESC,
    sumUp,
    convertToFeets,
    sortByDateASC} = require('./utilities.js')




//Database Connection
const sequelize = new Sequelize(process.env.DATABASE_URL)
async function test_Connection() {
   try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}
test_Connection()


//Middlewares
app.use(express.json())
app.use(express.urlencoded({extended:false}))

// BASE_URL
app.get('/', (req,res)=>{
    res.status(200).json({message:'HEY, WELCOME to MAX-ASSESSMENT. PLEASE READ UP THE DOCUMENTATION TO KNOW HOW TO USE THE ENDPOINTS'})
})

// GET ALL MOVIES 
app.get('/movies', async (req,res)=>{
    try{
       const fetchedData = await axios.get('https://swapi.dev/api/films');
       const [results] = await sequelize.query(`SELECT movie_id, COUNT(*) AS comment_count FROM Comments GROUP BY movie_id`)
       const swapiResults = fetchedData.data.results
       sortByDateASC(swapiResults)
       const movies = swapiResults.map( (eachMovie, index) =>({
         id:index+1,
         title:eachMovie.title,
          opening_crawl:eachMovie.opening_crawl, 
         comment_count:results[index]?.comment_count || 0 ,
         release_date:eachMovie.release_date
        }))
       res.status(200).json({totalMoviesCount:swapiResults.length, movies})
    }
    catch(err){
        res.status(500).json({error:err.message})
    }
})


//POST A COMMENT TO A MOVIE
app.post('/movie/:id/addComment', async (req,res)=>{
    if(!req.body.text || req.params.id > 6 || req.params.id < 1 )
    return res.status(400).json({message:"Bad Request, Please Enter Correct parameters and Request body", status:"request failed"})

    if(req.body.text.length > 500)
      return res.status(400).json({message:"Bad Request, Comment must not exceed 500 characters", status:"request failed"})
    try{
    if(isNaN(req.params.id)) throw Error("Invalid id, No such Movie exists.")
    const public_ip = RequestIp.getClientIp(req)
    const [results] = await sequelize.query(`INSERT INTO Comments (movie_id, comment_text, public_ip)
     VALUES(${req.params.id} , '${req.body.text}' , '${public_ip.toString()}')`)
    res.status(201).json({message:"Comment Successfully Added", comment_id:results})
    }
    catch(err){
        res.status(500).json({error:err.message, status:"request failed"})
    }
})


//GET ALL COMMENTS FOR A MOVIE
app.get('/movie/:id/getComments', async (req,res)=>{
    try{
    if(isNaN(req.params.id)) throw Error("Invalid id, No such Movie exists.")
    const [results] = await sequelize.query(`SELECT * FROM Comments WHERE movie_id = ${req.params.id}
    ORDER BY created_at DESC`)
    res.status(200).json({comment_count:results.length, comments:results})
    }
    catch(err){
        res.status(500).json({error:err.message, status:"request failed"})
    }
})


//GET ALL CHARACTERS FOR A MOVIE
app.get('/movie/:id/getCharacters', async (req,res)=>{
    try{
        if(isNaN(req.params.id)) throw Error("Invalid id, No such Movie  exists.")
        const fetchedData = await axios.get(`https://swapi.dev/api/films/${req.params.id}`)
        const fetchedMovie = fetchedData.data

        var movieCharacters = await Promise.all(
            fetchedMovie.characters.map( singleCharacter => {
                return  axios.get(singleCharacter)
                .then(eachCharacter=>eachCharacter.data)
                .catch(err=>err)
            })
        ) 
        movieCharacters = movieCharacters.map(character=>({name:character.name, gender:character.gender, height:character.height}))
        if(req.query?.sortBy?.toLowerCase() == 'height'){
            if(req.query?.order?.toLowerCase() == "asc"){
                sortByHeightASC(movieCharacters)
            }

           else if(req.query?.order?.toLowerCase() == "desc"){
                sortByHeightDESC(movieCharacters)
            }
        }
        if(req.query?.sortBy?.toLowerCase() == 'name'){
            if(req.query?.order?.toLowerCase() == "asc"){
                sortByNameASC(movieCharacters)
            }
           else if(req.query?.order?.toLowerCase() == "desc"){
            sortByNameDESC(movieCharacters)
            }
        }
        if(req.query.filter){
            movieCharacters = filterByGender(movieCharacters, req.query.filter.toLowerCase())
        }
        res.status(200).
        json({
        message:"Request Successful", 
        total_count:movieCharacters.length,
        total_height: sumUp(movieCharacters) + "cm",
       total_height_in_feets: convertToFeets(movieCharacters),
        characters:movieCharacters
    })
    }
    catch(err){
        res.status(500).json({error:err.message, status:"request failed"})
    }
})

//404 ROUTE HANDLER
app.use((req,res,next)=>{
    res.status(404).json({message:" Oops!! Not found. This route is not available please"})
})

//500 ROUTE HANDLER
app.use((err,req,res,next)=>{
    res.status(500).json({message:" Ouch, Something a'int right. Internal Server Error"})
})

app.listen(process.env.PORT || 5000, ()=>console.log("Server Started"))