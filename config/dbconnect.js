const mongoose=require('mongoose')

mongoose.connect('mongodb://127.0.0.1:27017/Shoe-Sea')

//check
const dbConnect=mongoose.connection
dbConnect.on('error',console.error.bind(console,'Database connection error'))
dbConnect.once('open',function(){
    console.log('Database conection success')

})

// const dbConnect=mongoose.connect(process.env.MONGODB_URI)
// .then(()=>{
//     console.log("mongodb connected")
//     console.log(process.env.MONGODB_URI)
 
// }).catch((err)=>{
//     console.log("Error in connecting mongodb",err)
//     console.log(process.env.MONGODB_URI)

// })

module.exports=dbConnect