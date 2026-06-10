import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {UploadOnCloudinary} from "../utils/cloudinary.js"
import  {ApiResponse} from "../utils/ApiResponse.js"

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

export {registerUser}