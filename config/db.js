const mongoose = require('mongoose');
const coonection_string = process.env.DBConnectionString;

mongoose.connect(coonection_string).then((res)=>{
    console.log("DB connected successfully");
}).catch(err=>{
    console.log("connection failed");
    console.log(err);
})