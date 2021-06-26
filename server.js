const { default: axios } = require("axios");
const express=require("express");
const app = express();
const mysql = require('mysql');
const dotenv = require('dotenv').config()


//Database Connection
const con = mysql.createConnection(
    {
        host:process.env.DATABASE_HOST,
        user:process.env.DATABASE_USER,
        password:process.env.DATABASE_PASS,
        database:process.env.DATABASE_NAME,
        }
)
// console.log(process.env.DATABASE_HOST,process.env.DATABASE_USER,process.env.DATABASE_PASS, process.env.DATABASE_NAME)

//Middlewares
app.use(express.json())
app.use(express.urlencoded({extended:false}))



app.get('/movies', async (req,res)=>{
    try{
       con.connect(err=> console.log(err? err.message : "Database Connection Established"))
       const fetchedData = await axios.get('https://swapi.dev/api/films');
       const results = fetchedData.data.results
       const sqlQuery = `SELECT COUNT(*) AS comment_count GROUP BY movie_id `

       con.query(sqlQuery, function (err,data) {
       if(err) {
           con.close()
            return res.status(500).json({message:"Internal Server Error"})
        }

        con.close()
        let returnedCount = data;

        }//endquerycallback
        )//endquery


       const movies = results.map( (result, index) =>({id:index+1, title:result.title, opening_crawl:result.opening_crawl, comment_count:returnedCount[index+1] }))
       res.status(200).json({count:results.length, movies})
    }
    catch(err){
        res.status(500).json({error:err.message})
    }
})
app.get('/movies/:id/comments', (req,res)=>{
    const sqlQuery = `SELECT comment_text, public_ip, created_at FROM Comments WHERE movie_id=${req.params.id} `
    con.query(sqlQuery, function (err,result) {
        if(err) return res.status(500).json({error:err.message})
        res.status(200).json({count:result.length, comments:result})
    })
})
app.get('/comments/:id', (req,res)=>{
    axios.get('https://swapi.dev/api/films')
    .then(result=>res.json(result.data))
    .catch(err=>res.send(err.message))
})
app.get('/characters/:id', (req,res)=>{
    axios.get('https://swapi.dev/api/films')
    .then(result=>res.json(result.data))
    .catch(err=>res.send(err.message))
})
app.post('/movies', (req,res)=>{
    axios.get('https://swapi.dev/api/films')
    .then(result=>res.json(result.data))
    .catch(err=>res.send(err.message))
})
app.use((req,res,next)=>{
    res.status(404).json({message:"This route is not available"})
})
app.use((err,req,res,next)=>{
    res.status(500).json({message:"Internal Server Error"})
})




app.listen(process.env.PORT || 5000, ()=>console.log("Server Started"))