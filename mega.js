const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const open = require('open');

// === Session Setup ===
const sessionDir = path.join(__dirname, 'session');
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir);
    console.log("Created session directory:", sessionDir);
}

const credentialsPath = path.join(sessionDir, 'credentials.json');
const tokenPath = path.join(sessionDir, 'token.json');

if (!fs.existsSync(credentialsPath)) {
    throw new Error("Missing Google API credentials file (credentials.json) in session directory.");
}

// === Load credentials and authorize ===
async function authorize() {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(tokenPath)) {
        oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(tokenPath)));
        return oAuth2Client;
    }

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file'],
    });

    console.log('Authorize this app by visiting this URL:', authUrl);
    await open(authUrl);

    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const code = await new Promise(resolve => rl.question('Enter the code from the page: ', resolve));
    rl.close();

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(tokenPath, JSON.stringify(tokens));
    return oAuth2Client;
}

// === Upload Function ===
const upload = async (data, name) => {
    try {
        console.log("Preparing to upload to Google Drive...");

        const auth = await authorize();
        const drive = google.drive({ version: 'v3', auth });

        const chunks = [];
        for await (const chunk of data) {
            chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);

        const filePath = path.join(sessionDir, name);
        fs.writeFileSync(filePath, fileBuffer); // temporarily save the file

        const fileMetadata = { name: name };
        const media = {
            mimeType: 'application/octet-stream',
            body: fs.createReadStream(filePath),
        };

        const uploadRes = await drive.files.create({
            resource: fileMetadata,
            media,
            fields: 'id, webViewLink',
        });

        const fileId = uploadRes.data.id;

        // Make the file readable by anyone with the link
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        const fileUrl = uploadRes.data.webViewLink;
        console.log("File uploaded successfully. URL:", fileUrl);

        fs.unlinkSync(filePath); // clean up local file
        return fileUrl;
    } catch (err) {
        console.error("Google Drive upload error:", err.message || err);
        throw err;
    }
};

module.exports = { upload };
