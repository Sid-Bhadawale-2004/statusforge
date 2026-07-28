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

async function sendNewLoginEmail(user, { ip, userAgent, time }) {
  await sendEmail({
    to: user.email,
    subject: "New sign-in to your account",
    html: `
      <p>Hi ${user.name},</p>
      <p>Your account (<strong>${user.email}</strong>) was just signed in to.</p>
      <ul>
        <li><strong>Time:</strong> ${time}</li>
        <li><strong>IP Address:</strong> ${ip}</li>
        <li><strong>Device/Browser:</strong> ${userAgent}</li>
      </ul>
      <p>If this was you, no action is needed.</p>
      <p><strong>If this wasn't you</strong>, please reset your password immediately and contact support.</p>
    `,
  });
}

async function sendInviteEmail(user, { orgName, inviterName, setupLink }) {
  await sendEmail({
    to: user.email,
    subject: `You've been invited to join ${orgName} on StatusForge`,
    html: `
      <p>Hi ${user.name},</p>
      <p>${inviterName} has invited you to join <strong>${orgName}</strong> on StatusForge as a <strong>${user.role}</strong>.</p>
      <p>Click below to set your password and get started. This link expires in 24 hours.</p>
      <a href="${setupLink}">${setupLink}</a>
    `,
  });
}

module.exports = { sendPasswordChangedEmail, sendNewLoginEmail, sendInviteEmail };