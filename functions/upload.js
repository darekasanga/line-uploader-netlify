const fetch = require("node-fetch");

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        console.log("Received Event:", body);

        // Check if it's a LINE webhook event
        if (body.events) {
            const replyToken = body.events[0].replyToken;
            const userMessage = body.events[0].message.text;

            // Reply to the user
            await replyMessage(replyToken, `You said: ${userMessage}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Webhook received" }),
        };
    } catch (error) {
        console.error("Error handling webhook:", error.message);
        return {
            statusCode: 200, // Important: Return 200 to LINE to avoid 202 errors
            body: JSON.stringify({ error: error.message }),
        };
    }
};

async function replyMessage(replyToken, text) {
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    };
    const body = {
        replyToken: replyToken,
        messages: [{ type: "text", text: text }],
    };

    try {
        const response = await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
        });

        console.log("Reply Response:", response.status, await response.text());
    } catch (error) {
        console.error("Error sending reply:", error.message);
    }
}
