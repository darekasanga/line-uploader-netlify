const fetch = require("node-fetch");

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const filename = body.filename || "uploaded_file.txt";
        const content = body.content || "Hello from Netlify!";
        
        const response = await fetch(`https://api.github.com/repos/darekasanga/line-uploader-netlify/contents/${filename}`, {
            method: "PUT",
            headers: {
                "Authorization": `token ${process.env.GITHUB_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `Add ${filename}`,
                content: Buffer.from(content).toString("base64"),
            }),
        });

        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
