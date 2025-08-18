import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/usermodel.js';
import transporter from '../config/nodemailer.js';
import {nanoid} from 'nanoid';     // your pre-configured nodemailer transport

export const register = async (req, res) => {
  const { fullName, nic, email, phoneNo, address, password, gender, dob, role } = req.body;

  
  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: "Full name, email, and password are required." });
  }
  if (!phoneNo || !address || !gender || !dob) {
    return res.status(400).json({ success: false, message: "Please complete all profile fields." });
  }
  if (!nic) {
    return res.status(400).json({ success: false, message: "NIC is required for registration." });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
  }

  try {

    const existingByEmail = await userModel.findOne({ email: email.toLowerCase() });
    if (existingByEmail) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }
    const existingByNic = await userModel.findOne({ nic });
    if (existingByNic) {
      return res.status(409).json({ success: false, message: "An account with this NIC already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = nanoid(12);

    const newUser = await userModel.create({
      userId,
      fullName,
      nic,
      email: email.toLowerCase(),
      phoneNo,
      address,
      gender,
      dob,
      password: hashedPassword,
      role: "patient",
      status: "Active",
      isVerified: true, 
    });

    const token = jwt.sign(
      { sub: newUser.userId, role: newUser.role },  // use 'sub' for subject
      process.env.JWT_SECRET,
      { expiresIn: "15m" }                       // short access token; add refresh endpoint later
    );

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: newUser.email,
      subject: "Welcome to MedReport Assist 👋",
      text:
`Hello ${fullName},

Welcome to MedReport Assist!

You can securely upload medical reports, get plain-language translations of medical terms, generate accurate summaries with citations, and chat with our agent for educational guidance. 

What you can do next:
• Upload your first report and track processing status.
• Try the Medical Term Translator to simplify jargon.
• View summaries with sources and discuss with your clinician.

If you didn’t create this account, contact support immediately.

— The MedReport Assist Team`
    };

    transporter.sendMail(mailOptions).catch((err) => {
      console.error("Welcome email failed:", err.message);
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: newUser.userId,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
     
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
};


export const login = async(req , res)=>{
    const {email, password} = req.body;

    if(!email || !password) {
        return res.json({success: false, message: 'Please fill all the fields'});
    }

    try{
        const user = await userModel.findOne({email});
        if(!user) {
            return res.json({success: false, message: 'Invalid Email'});
        } 

        if (user.status !== 'Active') {
            return res.json({success: false, message: 'Your account is not active. Please contact support.'});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.json({success: false, message: 'Invalid Password'});
        }

        const token = jwt.sign({id:user.userId}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge : 7 * 24 * 60 * 60 * 1000
        });

        return res.json({success: true, message: 'User logged in successfully'});

    }catch(error) {
        console.error('Error:', error);
        return res.json({success: false, message: error.message});
    }
};