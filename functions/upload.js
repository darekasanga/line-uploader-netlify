const fetch = require("node-fetch");
const base64 = require("base-64");

exports.handler = async (event) => {
    try {
        // Check if the request method is POST
        if (event.httpMethod !== "POST") {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" })
            };
        }

        // Get file data from the request body
        const formData = JSON.parse(event.body);
        const fileName = formData.fileName || "uploaded_file.txt";
        const fileContent = formData.fileContent || "Hello from Netlify!";

        // GitHub API URL
        const url = `https://api.github.com/repos/darekasanga/line-uploader-netlify/contents/${fileName}`;
        const encodedContent = base64.encode(fileContent);

        // Upload the file to GitHub
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

        // Return success message with file URL
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
