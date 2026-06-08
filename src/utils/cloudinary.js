import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

const UploadOnCloudinary = async (LocalFilePath)=>{
   try {
     if(!LocalFilePath) return null
    //upload file
    
    const response=await cloudinary.uploader.upload(LocalFilePath,{
        resource_type:"auto",
    })
    //upload successfully
    console.log("Uploaded",response.url);
    return response;
    
   } catch (error) {
    fs.unlinkSync(LocalFilePath) // remove file local server
   }
}

export {UploadOnCloudinary}