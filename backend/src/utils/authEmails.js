const sendEmail = require("./sendEmail");

async function sendPasswordChangedEmail(user) {
  await sendEmail({
    to: user.email,
    subject: "Your password was changed",
    html: `
      <p>Hi ${user.name},</p>
      <p>This is a confirmation that the password for your account (<strong>${user.email}</strong>) was just changed.</p>
      <p>If you made this change, you can safely ignore this email.</p>
      <p><strong>If you did not make this change</strong>, your account may be compromised — please reset your password immediately and contact support.</p>
    `,
  });
}

module.exports = { sendPasswordChangedEmail };