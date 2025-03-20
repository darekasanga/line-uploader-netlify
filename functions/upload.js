const axios = require('axios');

// Reply to LINE function
async function replyToLine(replyToken, message) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_ACCESS_TOKEN}`
    };

    const data = {
        replyToken: replyToken,
        messages: [
            {
                type: 'text',
                text: message
            }
        ]
    };

    try {
        const response = await axios.post('https://api.line.me/v2/bot/message/reply', data, { headers });
        console.log('LINE API Response Status:', response.status);
        console.log('LINE API Response Body:', response.data);
    } catch (error) {
        console.error('Error sending reply to LINE:', error.response ? error.response.data : error.message);
    }
}

// Upload handler
exports.handler = async (event) => {
    try {
        // Log the received event
        console.log('Received Webhook Event:', event.body);

        // Parse the JSON body
        const body = JSON.parse(event.body);
        console.log('Parsed body:', body);

        // Check for events
        if (!body.events || body.events.length === 0) {
            console.warn("No events found in the request");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "No events to process" })
            };
        }

        // Process the event
        const eventObj = body.events[0];
        const replyToken = eventObj.replyToken;
        const userMessage = eventObj.message.text;

        console.log('Reply Token:', replyToken);
        console.log('User Message:', userMessage);

        // Reply based on user message
        if (userMessage === "file upload") {
            const uploadUrl = "https://vocal-genie-36c2fb.netlify.app/upload.html";
            await replyToLine(replyToken, `Upload your file here: ${uploadUrl}`);
        } else {
            await replyToLine(replyToken, `You said: ${userMessage}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Success" })
        };
    } catch (error) {
        console.error("Error handling webhook:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Server Error", error: error.message })
        };
    }
};
