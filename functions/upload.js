const fetch = require("node-fetch");
const base64 = require("base-64");

exports.handler = async (event) => {
    try {
        console.log("Received upload request");
        console.log("Event Data:", JSON.stringify(event));  // Log the entire event object

        // Check if the method is POST
        if (event.httpMethod !== "POST") {
            console.log("Method Not Allowed");
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method Not Allowed" })
            };
        }

        // Log headers and body separately
        console.log("Request headers:", JSON.stringify(event.headers));
        console.log("Request body:", event.body);

        // Check content type to see if it's multipart/form-data
        const contentType = event.headers['content-type'] || '';
        if (!contentType.includes('multipart/form-data')) {
            console.log("Invalid content type:", contentType);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid content type" })
            };
        }

        // Extract boundary from content type
        const boundary = contentType.split('boundary=')[1];
        if (!boundary) {
            console.log("Boundary not found in content-type");
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Boundary not found" })
            };
        }
        console.log("Boundary:", boundary);

        // Split the body using the boundary
        const parts = event.body.split(`--${boundary}`);
        const filePart = parts.find(part => part.includes('filename='));

        if (!filePart) {
            console.log("No file part found in the request");
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "No file part found" })
            };
        }

        // Extract file name and content
        const fileNameMatch = filePart.match(/filename="(.+?)"/);
        const fileName = fileNameMatch ? fileNameMatch[1] : "uploaded_file.txt";
        console.log("Extracted file name:", fileName);

        // Extract file data from the form data part
        const fileContent = filePart.split('\r\n\r\n')[1].split('\r\n--')[0];
        console.log("File content length:", fileContent.length);

        // Encode file content to Base64
        const encodedContent = base64.encode(fileContent);

        console.log(`Uploading file: ${fileName} to GitHub`);

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
        console.log("GitHub API response status:", response.status);
        console.log("GitHub API response:", JSON.stringify(result));

        if (!response.ok) {
            throw new Error(`GitHub API error: ${result.message}`);
        }

        console.log("File uploaded successfully to GitHub");

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
