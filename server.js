const { default: axios } = require("axios");
const express=require("express");
const app = express();
const {Sequelize} = require('sequelize');
const dotenv = require('dotenv').config()
const RequestIp = require('@supercharge/request-ip')

async function make_Request(url){
    try{
        return await axios.get(url)
    }
    catch(err){
        return err.message
    }
}


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



app.get('/movies', async (req,res)=>{
    try{
       const fetchedData = await axios.get('https://swapi.dev/api/films');
       const [results] = await sequelize.query(`SELECT movie_id, COUNT(*) AS comment_count FROM Comments GROUP BY movie_id`)
       const swapiResults = fetchedData.data.results
       const movies = swapiResults.map( (result, index) =>({id:index+1,
         title:result.title, opening_crawl:result.opening_crawl, 
         comment_count:results[index]?.comment_count || 0 }))
       res.status(200).json({totalMoviesCount:swapiResults.length, movies})
    }
    catch(err){
        res.status(500).json({error:err.message})
    }
})



app.get('/movie/:id/comments', async (req,res)=>{
    try{
        const [results] = await sequelize.query(`SELECT comment_text, public_ip, created_at FROM Comments WHERE movie_id=${req.params.id}`)
        res.status(200).json({comments_count:results.length, comments:results})    
    }
    catch(err){
        res.status(500).json({error:err.message})
    }
})

app.post('/movie/:id/addComment', async (req,res)=>{
    if(!req.body.text || req.params.id > 6 || req.params.id < 1 )
    return res.status(400).json({message:"Bad Request, Please Enter Correct parameters", status:"request failed"})

    if(req.body.text.length > 500)
      return res.status(400).json({message:"Bad Request, Comment must not exceed 500 characters", status:"request failed"})
    try{
          //getClient _public_ip
    const public_ip = RequestIp.getClientIp(req)
    const [results] = await sequelize.query(`INSERT INTO Comments (movie_id, comment_text, public_ip)
     VALUES(${req.params.id} , '${req.body.text}' , '${public_ip.toString()}')`)
    res.status(201).json({message:"Comment Successfully Added", comment_id:results})
    }
    catch(err){
        res.status(500).json({error:err.message, status:"request failed"})
    }
})



app.get('/movie/:id/getComments', async (req,res)=>{
    try{
    const [results] = await sequelize.query(`SELECT * FROM Comments WHERE movie_id = ${req.params.id}`)
    res.status(200).json({comment_count:results.length, comments:results})
    }
    catch(err){
        res.status(500).json({error:err.message, status:"request failed"})
    }
})



app.get('/movie/:id/getCharacters', async (req,res)=>{
    try{
        const fetchedData = await axios.get(`https://swapi.dev/api/films/${req.params.id}`)
        const fetchedMovie = fetchedData.data
        fetchedMovie.characters.forEach(async (character) =>{
            req.answer.push(await make_Request(character))
        })
        console.log(req.answer)

        // const strippedCharacters = characters.map(character=>({name:character.name, height:character.height, gender:character.gender}))
        res.status(200).json({message:"Request Successful", characters:req.answer})

        // res.status(200).send(fetchedMovie.characters)
    }
    catch(err){
        res.status(500).send(err.message)     
  
    }
})


app.use((req,res,next)=>{
    res.status(404).json({message:"This route is not available"})
})
app.use((err,req,res,next)=>{
    res.status(500).json({message:"Internal Server Error"})
})




app.listen(process.env.PORT || 5000, ()=>console.log("Server Started"))