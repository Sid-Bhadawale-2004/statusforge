const jwt = require("jsonwebtoken");

function generateAccessToken(user){
    return jwt.sign(
        { userId: user._id, organizationId: user.organizationId, role:user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
}

function generateRefreshToken(user) { 
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
}

module.exports = { generateAccessToken , generateRefreshToken };