import mongoose ,{Schema} from "mongoose";

const projectSchema=new Schema({
    title:{
        type:String,
        required:true,
        index:true,
    },
    description:{
        type:String,
    },
    image:{
        type:String,
    },
    video:{
        type:String,
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    githublink:{
        type:String,
    },
    livelink:{
        type:String,
    },
    technologies:[
        {
            type:String,
            required:true
        }
    ],
    skills:[{
        type:String,
    }]
},{timestamps:true})


export const Project=mongoose.model("Project",projectSchema)