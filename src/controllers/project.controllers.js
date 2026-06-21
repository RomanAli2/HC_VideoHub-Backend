import { Project } from "../models/project.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { UploadOnCloudinary } from "../utils/cloudinary.js";

//hi



const createProject=asyncHandler(async (req,res)=>{
    const {title,skills,description,githublink,livelink,technologies}=req.body;

    if(!title.trim()){
    throw new ApiError(400,"Title is required")
    }

    if(!skills){
        throw new ApiError(400,"Skills are required")
    }
    const imagelocalPath= req.files?.image?.[0]?.path
    const videolocalPath= req.files?.video?.[0]?.path

    if(!imagelocalPath && !videolocalPath){
        throw new ApiError(400,"Either image or video is required")
    }

    const image= imagelocalPath? await UploadOnCloudinary(imagelocalPath) : null
    const video= videolocalPath? await UploadOnCloudinary(videolocalPath) : null

    if(!image && !video){
        throw new ApiError(400,"Image or video ,one file is required")
    }


    const project=await Project.create({

        title,
        description,
        githublink,
        livelink,
        technologies,
        video:video?.url || "",
        image:image?.url || "",
        skills,
        owner:req.user._id

    });

    if(!project){
        throw new ApiError(500,"Somthing went wrong while uploading project")
    }

    return res.status(201)
    .json(new ApiResponse(201,project,"Project created successfulyy"))

})


const deleteProject= asyncHandler(async(req,res)=>{
    const {projectId} = req.params

    if(!projectId){
        throw new ApiError(400,"Projetct id is required")
    }

    const projectIdFind= await Project.findById(projectId)

    if(!projectIdFind){
    throw new ApiError(404,"Project not found")
}

    if(projectIdFind.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401,"Unauthrized user")
    }
    await Project.findByIdAndDelete(projectId)


    return res.status(200)
    .json(
        new ApiResponse(200,{},"Project deleted successfully")
    )

})

const updateProject = asyncHandler(async (req,res)=>{
    
    const {projectId} = req.params
    const {title,skills,description,githublink,livelink,technologies}=eq.body;
    const imagelocalPath= req.files?.image?.[0]?.path
    const videolocalPath=req.files?.video?.[0]?.path
    const findedProject= await Project.findById(projectId)
    if(!findedProject){
        throw new ApiError(400,"project not exist")
    }

    if( !title &&
 !skills &&
 !description &&
 !githublink &&
 !livelink &&
 !technologies &&
 !imagelocalPath &&
 !videolocalPath){

        throw new ApiError(400,"At least one field must be provided for update")
    }

     if(findedProject.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401,"Unauthrized user")
    }

    const image = imagelocalPath ? await UploadOnCloudinary(imagelocalPath) : null
    const video = videolocalPath ? await UploadOnCloudinary(videolocalPath) : null
     if(skills?.trim()){
        findedProject.skills=skills
     }
     if(title?.trim()){
        findedProject.title=title
     }
     if(description?.trim()){
        findedProject.description=description
     }
     if(githublink?.trim()){
        findedProject.githublink=githublink
     }  
     if(livelink?.trim()){ 
        findedProject.livelink=livelink
     }

    if(technologies?.trim()){   
    findedProject.technologies=technologies
     }

if(image){
   findedProject.image = image.url
}

if(video){
   findedProject.video = video.url
}
        await findedProject.save()


        res.status(200)
        .json(new ApiResponse(200,findedProject,"Project updated successfully"))
});
const getAllProjects = asyncHandler(async (req,res) => {

    const projects = await Project.find()

    return res.status(200).json(
        new ApiResponse(200, projects, "All projects fetched")
    )
});
const getProjectById = asyncHandler(async (req,res) => {

    const { projectId } = req.params

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(404,"Project not found")
    }

    return res.status(200).json(
        new ApiResponse(200, project, "Project fetched")
    )
})
export {
    createProject,
    deleteProject,
    updateProject,
    getAllProjects,
    getProjectById
}