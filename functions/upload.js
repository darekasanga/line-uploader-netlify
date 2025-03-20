const fetch = require("node-fetch");
const base64 = require("base-64");

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);

        // Check if the event is a message from the user
        if (body.events && body.events.length > 0) {
            const eventObj = body.events[0];
            const replyToken = eventObj.replyToken;
            const userMessage = eventObj.message.text;

            // If the user types "file upload", send the Flex Message with upload link
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
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: "Flex message sent" })
                };
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Webhook received" })
        };
    } catch (error) {
        console.error("Error in webhook:", error.message);
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
    await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    });
}

// Notify the user after successful upload
async function notifyUploadSuccess(userId, fileName, fileUrl) {
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    };
    const body = {
        to: userId,
        messages: [
            {
                "type": "flex",
                "altText": "File Upload Complete",
                "contents": {
                    "type": "bubble",
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "Upload Complete!",
                                "weight": "bold",
                                "size": "xl"
                            },
                            {
                                "type": "text",
                                "text": `File: ${fileName}`,
                                "margin": "md"
                            },
                            {
                                "type": "button",
                                "style": "primary",
                                "color": "#1DB446",
                                "action": {
                                    "type": "uri",
                                    "label": "View File",
                                    "uri": fileUrl
                                }
                            }
                        ]
                    }
                }
            }
        ]
    };
    await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    });
}

// Upload function
exports.uploadHandler = async (event) => {
    try {
        const fileName = "uploaded_file.txt";
        const fileContent = "Sample file content";

        // GitHub API URL
        const url = `https://api.github.com/repos/darekasanga/line-uploader-netlify/contents/${fileName}`;
        const encodedContent = base64.encode(fileContent);

        // Upload file to GitHub
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${process.env.GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Upload ${fileName}`,
                content: encodedContent
            })
        });

        const result = await response.json();
        const fileUrl = result.content.html_url;

        // Notify the user after successful upload
        await notifyUploadSuccess("YOUR_USER_ID", fileName, fileUrl);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "File uploaded successfully", url: fileUrl })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
