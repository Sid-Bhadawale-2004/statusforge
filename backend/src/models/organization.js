const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
    {
        name: {type: String , required: true, trim:true },
        plan: {type: String , enum:['free', 'pro'], default: "free"},
        slug: { type: String, unique: true, index: true },
    },
    {timestamps : true}
);

module.exports = mongoose.model("Organization", organizationSchema);