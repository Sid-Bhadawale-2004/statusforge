const crypto = require("crypto");
const axios = require("axios");

const SERVICE_ID = "6a6593b71113868ebcf683d0";
const WEBHOOK_SECRET = "1fbb5e684c8f1a621489cdd9fc488c0e8f0eede2a28944b2";
const payload = { title: "Payments API is down", severity: "P1" };
const body = JSON.stringify(payload);

const signature = crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(body)
  .digest("hex");

async function sendTestWebhook() {
  try {
    const res = await axios.post(
    `http://localhost:5000/api/webhooks/${SERVICE_ID}`, // changed path
    body,
    { headers: { "Content-Type": "application/json", "X-Signature": signature } }
  );
    console.log("Success:", res.status, res.data);
  } catch (err) {
    console.log("Failed:", err.response?.status, err.response?.data);
  }
}

sendTestWebhook();