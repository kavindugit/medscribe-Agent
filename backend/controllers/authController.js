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

export const logout = async(req, res) => {
    try {
        res.clearCookie('token' ,{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        
        return res.json({success: true, message: 'User logged out successfully'});
        
    }catch(error) {
        console.error('Error:', error);
        return res.json({success: false, message: error.message});
    }  

}

export const sendResetOtp = async(req , res) =>{
    const{email} = req.body

    if(!email){
        return res.json({success : false , message : 'Email is required'})

    }

    try{
        const user = await userModel.findOne({email})

        if(!user){
            return res.json({success : false , message:'user not found'})
        }

        const otp = String(Math.floor(100000 + Math.random() * 9000000));
        user.resetOtp = otp;   // save otp in user document

        user.resetOtpExpireAt = Date.now() + 5 * 60 * 1000;

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password reset OTP',
            text: `Hello ${user.name}, Your otp for resetting password is ${otp} .
            Use this OTP to procced with resetting your password.`
        } 
        await transporter.sendMail(mailOptions);

        return res.json({success : true , message : 'OTP sent to your email'})


    }catch{
        return res.json({success : false , message : error.message})
    }
}


export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
  
    console.log('Request Body:', req.body); // Log the request payload
  
    if (!email || !otp || !newPassword) {
      return res.json({ success: false, message: 'Please fill all the fields' });
    }
  
    try {
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.json({ success: false, message: 'User not found' });
      }
  
      console.log('User:', user); // Log the user document
  
      if (user.resetOtp !== otp || user.resetOtp === '') {
        return res.json({ success: false, message: 'Invalid OTP' });
      }
  
      if (user.resetOtpExpireAt < Date.now()) {
        return res.json({ success: false, message: 'OTP expired' });
      }
  
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetOtp = '';
      user.resetOtpExpireAt = 0;
      await user.save();
  
      return res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Error:', error); // Log the error
      return res.json({ success: false, message: error.message });
    }
  };
  