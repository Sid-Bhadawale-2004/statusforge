const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
    {
        name: {type: String , required: true, trim:true },
        plan: {type: String , enum:['free', 'pro'], default: "free"},
    },
    {timestamps : true}
);

module.exports = mongoose.model("Organization", organizationSchema);