const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name:{
        type : String,
        required : true
    },
    roomType:{
        type : String,
        required : true
    },
    maxPeople:{
        type:Number,
        required:true
    },
    contactNumber:{
        type:Number,
        required:true
    },
    rentPerDay:{
        type:Number,
        required:true
    },
    imgUrls:[],
    currentBookings:[],
    description:{
        type : String,
        required : true
    }
    
},{timestamps : true })


const roomModel = mongoose.model('ROOMS',roomSchema);
module.exports = roomModel;