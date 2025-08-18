import userModel from '../models/usermodel.js';

// Get a single user's data by userId
export const getUserData = async (req, res) => {
  try {
    const user = await userModel.findOne({ userId: req.userId });

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      userData: {
        userId: user.userId,
        name: user.fullName,
        nic: user.nic,
        dob: user.dob,
        role: user.role,
        address: user.address,
        phoneNo: user.phoneNo,
        gender: user.gender,
        email: user.email,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Get all users' data
export const getAllUsersData = async (req, res) => {
  try {
    const users = await userModel.find({});

    if (!users || users.length === 0) {
      return res.json({ success: false, message: 'No users found' });
    }

    const usersData = users.map((user) => ({
      userId: user.userId,
      name: user.fullName,
      nic: user.nic,
      dob: user.dob,
      address: user.address,
      phoneNo: user.phone,
      gender: user.gender,
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
    }));

    res.json({
      success: true,
      usersData: usersData,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Update user data
export const updateUser = async (req, res) => {
  try {
    const { userId, updates } = req.body;

    if (!userId || !updates) {
      return res.json({ success: false, message: "Invalid request parameters" });
    }

    const user = await userModel.findOne({ userId });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    
    if (updates.name) user.fullName = updates.name;
    if (updates.email) user.email = updates.email;
    if (updates.role) user.role = updates.role;
    if (updates.status) user.status = updates.status;

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      updatedUser: {
        name: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findOneAndDelete({ userId });

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        name: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};


// Get a specific parcel by id
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userModel.findOne({ userId: id });
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    res.status(200).json({ message: "User Found", data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error Fetching user" });
  }
};

// Get users by role/category
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({ success: false, message: "User role is required" });
    }

    const users = await userModel.find({ role });

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: `No users found for role: ${role}` });
    }

    const userData = users.map((user) => ({
      userId: user.userId,
      name: user.fullName,
      nic: user.nic,
      dob: user.dob,
      address: user.address,
      phoneNo: user.phoneNo,
      gender: user.gender,
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
    }));

    return res.status(200).json({ success: true, users: userData });
  } catch (error) {
    console.error("Error fetching users by role:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get user data by userId (new controller)
export const getUserByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await userModel.findOne({ userId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userData = {
      userId: user.userId,
      name: user.fullName,
      nic: user.nic,
      dob: user.dob,
      role: user.role,
      address: user.address,
      phoneNo: user.phone,
      gender: user.gender,
      email: user.email,
      status: user.status,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
    };

    return res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.error("Error fetching user by userId:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};