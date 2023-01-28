const jwt = require ('jsonwebtoken');
const User = require("../models/Schema");




const authenticate=async(req,res,next)=>{
     try{
        const token = req.cookies.jwtoken;
        const verifyToken = jwt.verify(token,process.env.SECRET_KEY);

        const rootUser = await User.findOne({_id:verifyToken._id,"tokens.token":token})
        if(!rootUser){ throw new Error("user not found")}
        else{
         req.token = token ;
         req.rootUser = rootUser;
         req.userID = rootUser._id;
         next();
        }

     } catch(err){
        res.status(401).send("Unauthorized : no token provided");
        console.log(err);
     }
     
}

module.exports = authenticate;