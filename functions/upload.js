const fetch = require("node-fetch");

exports.handler = async (event) => {
    try {
        console.log("Received Webhook Event:", event.body);

        // Check if the request method is POST
        if (event.httpMethod !== "POST") {
            console.warn("Invalid HTTP method:", event.httpMethod);
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" })
            };
        }

        // Check content type to ensure it's application/json
        const contentType = event.headers['content-type'] || '';
        if (!contentType.includes('application/json')) {
            console.log("Invalid content type:", contentType);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid content type" })
            };
        }

        // Parse the JSON body
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError.message);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid JSON format" })
            };
        }

        console.log("Parsed body:", JSON.stringify(body));

        // Check if the event contains any events
        if (!body.events || body.events.length === 0) {
            console.warn("No events found in the request");
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "No events to process" })
            };
        }

        const eventObj = body.events[0];
        console.log("Processing event:", JSON.stringify(eventObj));

        // Check if the event type is "message"
        if (eventObj.type !== "message" || !eventObj.message) {
            console.warn("Non-message event received. Event type:", eventObj.type);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Non-message event received" })
            };
        }

        // Safely access replyToken and message text
        const replyToken = eventObj.replyToken || null;
        const userMessage = eventObj.message.text || "";

        // Log the extracted message and token
        console.log("Reply Token:", replyToken);
        console.log("User Message:", userMessage);

        // If replyToken is missing, skip processing
        if (!replyToken) {
            console.warn("Missing replyToken. Event ignored.");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "No replyToken found" })
            };
        }

        // Send a reply message to LINE
        await replyMessage(replyToken, [
            {
                "type": "text",
                "text": `You said: ${userMessage}`
            }
        ]);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Webhook received and processed successfully" })
        };
    } catch (error) {
        console.error("Error handling webhook:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

// Function to send reply messages to LINE
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

        const result = await response.json();
        console.log("LINE API Response:", response.status, result);

        if (!response.ok) {
            throw new Error(`LINE API error: ${result.message}`);
        }
    } catch (error) {
        console.error("Error sending reply:", error.message);
    }
}
