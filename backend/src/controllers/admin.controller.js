import { Admin } from "../models/admin.model.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefereshTokens = async(adminId) =>{
  try {
      const admin = await Admin.findById(adminId)
      const accessToken = admin.generateAccessToken()
      const refreshToken = admin.generateRefreshToken()

      admin.refreshToken = refreshToken
      await admin.save({ validateBeforeSave: false }) 

      return {accessToken, refreshToken}


  } catch (error) {
      throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}


const registerAdmin = asyncHandler(async(req,res) => {
  const { username, email, password } = req.body;
  // console.log(req.body);

  if (
    [email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedAdmin = await Admin.findOne({
    $or: [{ username }, { email }],
  });

  if (existedAdmin) {
    throw new ApiError(409, "User with email or username already exists");
  }  

  const avatarLocalPath = req.file.path

  console.log(`avatarLocaPath :: ${avatarLocalPath}`)
  

  if (!avatarLocalPath) throw new ApiError(400, "avatarLocalPath file is required!");

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  console.log(avatar);
  

  if (!avatar) throw new ApiError(400, "Avatar file is required!");  
  
  const admin = await Admin.create({
    email,
    password,
    username: username.toLowerCase(),
    avatar : avatar.url
  });

  const createdAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );


  if (!createdAdmin) {
    throw new ApiError(500, "Something went wrong while registering the Admin");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdAdmin, "Admin registered Successfully"));
})

const loginAdmin = asyncHandler(async (req, res) =>{
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const {email, password} = req.body
  console.log(email);

  if (!email) {
      throw new ApiError(400, "email is required")
  }

  const admin = await Admin.findOne({
      email
  })

  if (!admin) {
      throw new ApiError(404, "User does not exist")
  }

 const isPasswordValid = await admin.isPasswordCorrect(password)

 if (!isPasswordValid) {
  throw new ApiError(401, "Invalid user credentials")
  }

//   console.log(user);
  

  const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(admin?._id)  

    const loggedInAdmin = await Admin.findById(admin._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                admin: loggedInAdmin, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
});

export {registerAdmin,loginAdmin}

