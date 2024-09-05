import { Router } from "express";
import { registerAdmin,loginAdmin } from "../controllers/admin.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


router.route("/register").post(upload.single("avatar"),registerAdmin)
router.route("/login").post(loginAdmin)

export default router