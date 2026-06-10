import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config({
    path:"./.env"
})
 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log("API Secret exists:", !!process.env.CLOUDINARY_API_SECRET);
const UploadOnCloudinary = async (LocalFilePath)=>{
   try {
     if(!LocalFilePath) return null
    //upload file
    
    const response=await cloudinary.uploader.upload(LocalFilePath,{
        resource_type:"auto",
    }
)
    //upload successfully
    //console.log("Uploaded",response.url);
    fs.unlinkSync(LocalFilePath)
    
    return response;
   // console.log(response)
   }  catch (error) {
    console.log("Cloudinary Error:", error);
    
    if(fs.existsSync(LocalFilePath)){
        fs.unlinkSync(LocalFilePath);
    }

    return null;
   }
}

export {UploadOnCloudinary}