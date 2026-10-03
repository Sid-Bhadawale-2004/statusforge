const crypto = require("crypto");

function generateSlug(orgName) {
  const base = orgName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
  const suffix = crypto.randomBytes(2).toString("hex");
  return `${base}-${suffix}`;
}

module.exports = generateSlug;