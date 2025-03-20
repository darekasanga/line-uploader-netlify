const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    try {
        console.log("Received upload request");

        // Extract the file from the request
        const body = JSON.parse(event.body);
        const fileName = body.fileName;
        const fileContent = body.fileContent;

        if (!fileName || !fileContent) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    status: "error",
                    message: "Invalid file data"
                })
            };
        }

        // Decode the base64 file content
        const fileBuffer = Buffer.from(fileContent, 'base64');
        const filePath = path.join('/tmp', fileName);

        // Save the file to the temporary directory
        fs.writeFileSync(filePath, fileBuffer);

        console.log("File uploaded to:", filePath);

        // Construct the file URL
        const fileUrl = `https://your-website.com/uploads/${fileName}`;

        return {
            statusCode: 200,
            body: JSON.stringify({
                status: "success",
                message: "File uploaded successfully",
                original_url: fileUrl
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
