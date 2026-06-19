import { Router } from "express";
import { accountDetailUpdate,
   changeCurrentPassword, 
   getCurrentUser,
    getUserProfile,
     getUserWatchHistory,
      loginUser, logoutUser,
       refreshAcesstoken, 
       registerUser, userAvatarUpdate,
        userCoverImageUpdate } 
        from "../controllers/user.controllers.js";


import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.midlleware.js";
const router=Router();
router.route(  "/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 }
  ]),
  registerUser
);
router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAcesstoken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
//get req
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/channel/:username").get(verifyJWT,getUserProfile)
router.route("/history").get(verifyJWT,getUserWatchHistory)
//patch req
router.route("/change-fullname").patch(verifyJWT,accountDetailUpdate)
router.route("/change-avatar").patch(verifyJWT,upload.single("avatar"),userAvatarUpdate)
router.route("/change-coverimage").patch(verifyJWT,upload.single("coverimage"),userCoverImageUpdate)
export default router