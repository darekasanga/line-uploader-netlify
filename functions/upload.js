const fetch = require("node-fetch");

exports.handler = async (event) => {
    try {
        console.log("Received Webhook Event:", event.body);

        const body = JSON.parse(event.body);

        // Check if the event contains any events
        if (!body.events || body.events.length === 0) {
            console.warn("No events found in the webhook request");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "No events to process" })
            };
        }

        const eventObj = body.events[0];
        console.log("Processing event:", JSON.stringify(eventObj));

        // Check if the event type is a message event
        if (eventObj.type !== "message" || !eventObj.message) {
            console.warn("Non-message event received. Event type:", eventObj.type);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Non-message event received" })
            };
        }

        // Safely access replyToken and message text
        const replyToken = eventObj.replyToken;
        const userMessage = eventObj.message.text || "";
        
        if (!replyToken) {
            console.warn("Missing replyToken. Event ignored.");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "No replyToken found" })
            };
        }

        console.log("User Message:", userMessage);

        if (userMessage.toLowerCase() === "file upload") {
            const flexMessage = {
                "type": "flex",
                "altText": "Upload a file",
                "contents": {
                    "type": "bubble",
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "Upload a File",
                                "weight": "bold",
                                "size": "xl"
                            },
                            {
                                "type": "button",
                                "style": "primary",
                                "color": "#1DB446",
                                "action": {
                                    "type": "uri",
                                    "label": "Go to Upload Page",
                                    "uri": "https://vocal-genie-36c2fb.netlify.app/"
                                }
                            }
                        ]
                    }
                }
            };

            await replyMessage(replyToken, [flexMessage]);
            console.log("Sent Flex Message Successfully");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Flex message sent" })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Webhook received" })
        };
    } catch (error) {
        console.error("Error handling webhook:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

// Function to send reply messages
async function replyMessage(replyToken, messages) {
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    };
    const body = {
        replyToken: replyToken,
        messages: messages
    };

    try {
        const response = await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });
        console.log("Reply Response:", response.status, await response.text());
    } catch (error) {
        console.error("Error sending reply:", error.message);
    }
}
// Function to send reply messages with retry mechanism
async function replyMessage(replyToken, messages, retries = 3) {
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    };
    const body = {
        replyToken: replyToken,
        messages: messages
    };

    try {
        const response = await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });

        // Handle rate limit error (429)
        if (response.status === 429) {
            console.warn("Rate limit exceeded. Retrying...");
            const retryAfter = response.headers.get("Retry-After") || 1;
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                return replyMessage(replyToken, messages, retries - 1);
            } else {
                console.error("Max retries reached. Giving up.");
                return;
            }
        }

        // Check for success
        const result = await response.json();
        console.log("Reply Response:", response.status, result);

        if (!response.ok) {
            throw new Error(`LINE API Error: ${result.message}`);
        }
    } catch (error) {
        console.error("Error sending reply:", error.message);
    }
}
