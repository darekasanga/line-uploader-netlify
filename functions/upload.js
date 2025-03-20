const fetch = require("node-fetch");
const base64 = require("base-64");

exports.handler = async (event) => {
    try {
        console.log("Received upload request");

        const body = JSON.parse(event.body);

        // Validate the file data
        if (!body.fileName || !body.fileContent) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    status: "error",
                    message: "Invalid file data"
                })
            };
        }

        const fileName = body.fileName;
        const fileContent = body.fileContent;
        const downsizedFileName = `downsized_${fileName}`;

        // Upload original file to GitHub
        const originalUrl = await uploadToGitHub(fileName, fileContent);
        console.log("Original file uploaded to:", originalUrl);

        // Downsize the image (if necessary) and upload
        const downsizedContent = downsizeImage(fileContent);  // Your downsizing logic here
        const downsizedUrl = await uploadToGitHub(downsizedFileName, downsizedContent);
        console.log("Downsized file uploaded to:", downsizedUrl);

        return {
            statusCode: 200,
            body: JSON.stringify({
                status: "success",
                message: "File uploaded successfully",
                original_url: originalUrl,
                downsized_url: downsizedUrl
            })
        };
    } catch (error) {
        console.error("Error during file upload:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                status: "error",
                message: error.message
            })
        };
    }
};

// Function to upload a file to GitHub
async function uploadToGitHub(fileName, fileContent) {
    const url = `https://api.github.com/repos/darekasanga/line-ai-chatbot/contents/${fileName}`;
    const headers = {
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json"
    };
    const data = {
        message: `Upload ${fileName}`,
        content: base64.encode(fileContent),
        branch: "file"
    };

    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: headers,
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log("GitHub API Response:", result);

        if (!response.ok) {
            throw new Error(result.message || "GitHub upload failed");
        }

        return `https://raw.githubusercontent.com/darekasanga/line-ai-chatbot/file/${fileName}`;
    } catch (error) {
        console.error("Error uploading to GitHub:", error.message);
        throw error;
    }
}
