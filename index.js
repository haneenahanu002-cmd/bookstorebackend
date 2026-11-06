//import all packages
// loads .env file contents into process 
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/routes');
require('./config/db');

//create server using express
const server = express();
// anable cors in server
server.use(cors());
//use routes in server
server.use(express.json());

server.use(routes);

server.use('/uploads',express.static('./uploads'))

//set up port number to run server in internet      
const PORT = process.env.PORT || 3000;
//start server to listen client request to this port
server.listen(PORT, () => {
    console.log(`Server is running and waiting for client request`);
});

//creating a middleware to handling global errors in server using application middleware
server.use((err,req,res,next)=>{
    res.status(500).json(err.message)
})


//resolve client request to server (http://localhost:3000/) using express
server.get('/',(req,res)=>{
    res.status(200).send('<h1>Server is running and waiting for client request</h1>')
})

server.post('/',(req,res)=>{
    res.status(200).send("POST REQUEST")

})