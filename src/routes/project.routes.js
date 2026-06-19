import {Router} from "express";
import { createProject,
     deleteProject,
     updateProject, 
     getAllProjects,
     getProjectById 
    } from "../controllers/project.controllers.js";
import { verifyJWT } from "../middlewares/auth.midlleware.js";
import { upload } from "../middlewares/multer.middleware.js";


const router=Router()

router.route("/create-project").post(verifyJWT,
upload.fields([
    {name:"image",maxCount:1},
    {name:"video",maxCount:1},

]),
createProject
)

router.route("/delete-project/:projectId").delete(verifyJWT,deleteProject)
router.route("/update-project/:projectId").patch(verifyJWT,
    upload.fields([
         {name:"image",maxCount:1},
        {name:"video",maxCount:1},
    ])
    ,updateProject)
router.route("/getAll-project").get(getAllProjects)
router.route("/getOne-project/:projectId").get(getProjectById)


export default router