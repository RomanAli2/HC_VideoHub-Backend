import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {UploadOnCloudinary} from "../utils/cloudinary.js"
import  {ApiResponse} from "../utils/ApiResponse.js"

const genrateAccessAndrefreshtoken=async (userId)=>{
    try {
        const user=User.findById(userID)
       const accesstoken= user.genrateAccessToken()
       const refreshtoken= user.genrateRefreshToken()
        user.refreshtoken=refreshtoken
       await user.save({validateBeforeSave:false})

       return {refreshtoken,accesstoken}
    } catch (error) {
        throw new ApiError(500,"Somthing went wrong while genrating access and refrech token")
    }
}


const registerUser=asyncHandler(async (req,res)=>{
  
    const {fullname,username,email,password} = req.body

    if(
        [fullname,username,email,password].some((fields)=>
        fields.trim()===""
        )
    ){
        throw new ApiError(400,"All fields are required")
    };
    //console.log("REQ FILES:", req.files);
//console.log("REQ BODY:", req.body);

   const existedUser=await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"Username or Email are already existed")
    }
const avatarLocalPath = req.files?.avatar[0]?.path
console.log(req.files?.avatar?.[0]?.path)
const coverimageLocalPath = req.files?.coverimage?.[0]?.path;

   if(!avatarLocalPath){
    throw new ApiError(500,"avatar image is required")
   };

   const avatar =await UploadOnCloudinary(avatarLocalPath);
   console.log("Avatar Response:", avatar);
   const coverimage =await UploadOnCloudinary(coverimageLocalPath);
 //console.log(avatar)
   if(!avatar){
    throw new ApiError(400,"avatar image is required")
   };
console.log({
    fullname,
    username,
    email,
    password,
    avatar: avatar.url
});
  const user= await User.create({
    fullname,
    avatar:avatar.url,
    coverimage:coverimage?.url||"",
    email,
    password,
    username:username.toLowerCase()
   });

   const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken")
   if(!createdUser){
    throw new ApiError(500,"Somthing went wrong while registering user")
   }

   return await res.status(201).json(
    new ApiResponse(
        201,createdUser,"User registed sucessfully"
    )
   )
});

const loginUser=asyncHandler(async (req,res)=>{
    const {username,email,password}=req.body
    
    if(!username||!email){
        throw new ApiError(400,"Email or Username is required")
    }

    const user = await User.findOne({
        $or :[{username},{email}]
    })

    if(!user){
        throw new ApiError(400,"User does not exist please register")
    }

    const CheckisPasswordCorrect= await user.isPasswordCorrect(password)

    if(!CheckisPasswordCorrect){
        throw new ApiError(401,"Invalid Password")
    }

  const {refreshtoken,accesstoken}= await genrateAccessAndrefreshtoken(user._id)

  const loggedInUser= await User.findById(user._id).select("-password -refreshtoken")


  const option={
    httpOnly:true,
    secure:true
  }
  return res.status(201)
  .cookie("accesstoken",accesstoken,option)
  .cookie("refreshtoken",refreshtoken,option)

  new ApiResponse(
    200,{
    user:accesstoken,refreshtoken,loggedInUser

    },
    "user loggedin successfully"
)
})

const logoutUser = asyncHandler(async (req,res)=>{
await User.findByIdAndUpdate(
req.user._id,
{
    $set:{refreshtoken:undefined}
},
{
    new:true
}
 
)

const option={
    httpOnly:true,
    secure:true
  }

  return res.status(200)
  .clearCookie("accesstoken",option)
  .clearCookie("refreshtoken",option)
  .json(new ApiResponse(200,{},"User logged out sucessfully"))
  
})

export {registerUser,loginUser,logoutUser}