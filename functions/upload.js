const fetch = require("node-fetch");
const base64 = require("base-64");

exports.handler = async (event) => {
    try {
        console.log("Received upload request");

        // Check if the method is POST
        if (event.httpMethod !== "POST") {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" })
            };
        }

        // Parse the file content from the form data
        const contentType = event.headers['content-type'] || '';
        if (!contentType.includes('multipart/form-data')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid content type" })
            };
        }

        const boundary = contentType.split('boundary=')[1];
        const parts = event.body.split(`--${boundary}`);
        const filePart = parts.find(part => part.includes('filename='));

        if (!filePart) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "No file part found" })
            };
        }

        // Extract file content
        const fileNameMatch = filePart.match(/filename="(.+?)"/);
        const fileName = fileNameMatch ? fileNameMatch[1] : "uploaded_file.txt";

        // Extract file data from the form data part
        const fileContent = filePart.split('\r\n\r\n')[1].split('\r\n--')[0];
        const encodedContent = base64.encode(fileContent);

        console.log(`Uploading file: ${fileName}`);

        // GitHub API URL
        const url = `https://api.github.com/repos/darekasanga/line-uploader-netlify/contents/${fileName}`;

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
        console.log("GitHub response:", result);

        if (!response.ok) {
            throw new Error(`GitHub API error: ${result.message}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "File uploaded successfully",
                url: result.content.html_url
            })
        };
    } catch (error) {
        console.error("Error uploading file:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
