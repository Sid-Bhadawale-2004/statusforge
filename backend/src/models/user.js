const mongoose = require('mongoose');
const organization = require('./organization');

const userSchema = new mongoose.Schema(
    {
        organizationId: { type: mongoose.Schema.Types.ObjectId , ref: "Organization" ,required:true },
        name: { type: String, required: true, trim: true },
        email: { type: String , required: true, unique:true , lowercase: true, trim: true },
        passwordHash: { type: String }, // no longer "required" — Google-only users won't have one
        resetPasswordTokenHash: { type: String },
        googleId: { type: String, unique: true, sparse: true }, // sparse = allows many nulls, but no duplicate real values
        resetPasswordExpires: { type: Date },
        role: { type: String, enum: ["admin", "responder", "viewer"], default: "admin" },
        phone: { type: String },
    },
    {timestamps: true}
);

module.exports = mongoose.model("User", userSchema);
