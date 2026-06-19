import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {UploadOnCloudinary} from "../utils/cloudinary.js"
import  {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
const genrateAccessAndrefreshtoken=async (userId)=>{
    try {
        const user= await User.findById(userId)
       const accesstoken= user.genrateAccessToken()
       const refreshtoken= user.genrateRefreshToken()
        user.refreshtoken=refreshtoken
       await user.save({validateBeforeSave:false})
  console.log("ACCESS TOKEN:", accesstoken)

       return {refreshtoken,accesstoken}
    } catch (error) {
          console.log(error)
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
    console.log(username,email,password)
    
    if(!(username||email)){
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
 return res
  .status(200)
  .cookie("accesstoken", accesstoken, option)
  .cookie("refreshtoken", refreshtoken, option)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        accesstoken,
        refreshtoken
      },
      "User logged in successfully"
    )
    
  );
  console.log("LOGIN SUCCESS REACHED");
})

const logoutUser = asyncHandler(async (req,res)=>{
await User.findByIdAndUpdate(
req.user._id,
{
    $unset:{refreshtoken:1}
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

const refreshAcesstoken=asyncHandler(async (req,res)=>{

    const incomingRefreshtoken= req.cookies.refreshtoken || req.body.refreshtoken
    if(!incomingRefreshtoken){
        throw new ApiError(401,"unauthrized request")
    }
  try {
     const decodedToken= jwt.verify(incomingRefreshtoken,process.env.REFRESH_TOKEN_SECRET)
  
     const user= await User.findById(decodedToken?._id)
  
  
     if(!user){
      throw new ApiError(400,'invalid refresh token')
     }
  
  
      if(incomingRefreshtoken!==user?.refreshtoken){
      throw new ApiError(400,'refresh token is invalid or expired')
      }
  
  
  
      const option={
      httpOnly:true,
      secure:true
    }
  
   
   const {accesstoken, newRefreshtoken} = await genrateAccessAndrefreshtoken(user._id)
  
    return res.status(200)
    .cookie("accesstoken",accesstoken,option)
    .cookie("refreshtoken",newRefreshtoken,option)
    .json(
      new ApiResponse(
          201,{acesstoken ,refreshtoken:newRefreshtoken}
      )
    )
  } catch (error) {
    console.log(error)
    throw new ApiError(401,error?.message||"invalid token")
  }

});

const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword} = req.body
  const user = await User.findById(req.user?._id)
  const passwordCheckCorrect= await user.isPasswordCorrect(oldPassword)

  if(!passwordCheckCorrect){
    throw new ApiError(401,"invalid password")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave:false })

  return res.status(200)
  .json(
    new ApiResponse(200,{},"password changed successfully")
  )
});

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res.status(200)
  .json(new ApiResponse(200,req.user,'current user fetched successfully'))
});

const accountDetailUpdate = asyncHandler(async (req,res)=>{

  const {fullname}= req.body

  if(!fullname){
    throw new ApiError(400,"Fullname is required")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{fullname:fullname}
    }
    ,{new:true})
    .select("-password")

    return res.status(201)
    .json(
      new ApiResponse(201,user,"Account detail updated successfully")
    )
});



const userAvatarUpdate = asyncHandler(async (req,res)=>{

  const avatarLocalPath= req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await UploadOnCloudinary(avatarLocalPath)

  if(!avatar){
    throw new ApiError(400,"Error while uploading avatar file")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{avatar:avatar.url}
    },
    {new:true}
  ).select('-password')

  return res.status(201)
  .json( new ApiResponse(201,user,"Avatar image is updated successfully"))
});




const userCoverImageUpdate = asyncHandler(async (req,res)=>{

  const coverImageLocalPath= req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400,"coverImage file is missing")
  }

  const coverimage = await UploadOnCloudinary(coverImageLocalPath)

  if(!coverimage){
    throw new ApiError(400,"Error while uploading cover image file")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{coverimage:coverimage.url}
    },
    {new:true}
  ).select('-password')

  return res.status(201)
  .json( new ApiResponse(201,user,"cover image is updated successfully"))

});

const getUserProfile=asyncHandler(async(req,res)=>{
  const {username}= req.params

  if(!username?.trim()){
    throw new ApiError(400,"Username is required")
  }

  const channel= await User.aggregate([
    {
      $match:{username:username?.toLowerCase()}
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
     {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subcribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{$size:"$subscribers"},
        channelsSubcribedtoCount:{$size:"$subcribedTo"},
        isSubcribed:{
          $cond:{
          if:{$in:[req.user?._id,"$subscribers.subscriber"]},
          then:true,
          else:false
        
          }

        }
      }
    },
    {
      $project:{
        fullname:1,
        username:1,
        subscribersCount:1,
        channelsSubcribedtoCount:1,
        isSubcribed:1,
        avatar:1,
        email:1,
        coverimage:1
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404,"Channel does not exist")
  }

  return res.status(200)
  .json(
    new ApiResponse(200,channel[0],"User channel fetched successfully")
  )
});

const getUserWatchHistory= asyncHandler(async (req,res)=>{

  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
    $lookup:{
    from:"videos",
    localField:"watchHistory",
    foreignField:"_id",
    as:"watchHistory",
    pipeline:[
      {
    $lookup:{
         from:"users",
         localField:"owner",
        foreignField:"_id",
          as:"owner",
          pipeline:[
                       {
             $project:{

             fullname:1,
              username:1,
                avatar:1

      }
        },
           
        
      ]
    }
    },
    {
          $addFields:{
            owner:{
              $first:"$owner"
            }
          }
        }
  ]
    }
    }
  ]);

  res.status(200)
  .json(
    new ApiResponse(200,user[0].watchHistory,"watch history fetch sucessfully")
  )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAcesstoken,
  getCurrentUser,
  changeCurrentPassword,
  accountDetailUpdate,
  userAvatarUpdate,
  userCoverImageUpdate,
  getUserProfile,
  getUserWatchHistory

}