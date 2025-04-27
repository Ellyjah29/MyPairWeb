const fs = require('fs');
const path = require('path');
const mega = require("megajs");

// Ensure the session directory and file exist
const sessionDir = path.join(__dirname, 'session');
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir);
    console.log("Created session directory:", sessionDir);
}

const sessionFilePath = path.join(__dirname, 'session', 'creds.json');
if (!fs.existsSync(sessionFilePath)) {
    fs.writeFileSync(sessionFilePath, '{}'); // Create an empty JSON file
    console.log("Created session file:", sessionFilePath);
}

// Load session data
let sessionData = {};
try {
    const rawData = fs.readFileSync(sessionFilePath, 'utf8');
    sessionData = JSON.parse(rawData);
    if (!sessionData || Object.keys(sessionData).length === 0) {
        console.warn("Session file is empty or invalid. A new session will be created.");
    }
} catch (err) {
    console.error("Error reading session file:", err.message);
    process.exit(1);
}

const auth = {
    email: 'jakejasons580@gmail.com',
    password: 'Septorch11',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
    sessionFile: sessionFilePath, // Use absolute path for the session file
    ...sessionData // Merge existing session data
};

// Retry mechanism with exponential backoff
const retryOperation = (operation, retries = 3, delay = 1000) => {
    return new Promise((resolve, reject) => {
        const attempt = (attemptCount) => {
            operation()
                .then(resolve)
                .catch((err) => {
                    if (attemptCount < retries) {
                        console.log(`Retrying... Attempt ${attemptCount + 1}`);
                        setTimeout(() => attempt(attemptCount + 1), delay * Math.pow(2, attemptCount));
                    } else {
                        reject(err);
                    }
                });
        };
        attempt(0);
    });
};

const upload = (data, name) => {
    return new Promise((resolve, reject) => {
        try {
            // Create a new storage instance
            const storage = new mega.Storage(auth);

            // Wait for the storage to be ready
            storage.on('ready', () => {
                console.log("Storage is ready. Proceeding with upload...");

                // Save session data to prevent repeated logins
                fs.writeFileSync(sessionFilePath, JSON.stringify(storage.serialize(), null, 2));
                console.log("Session data saved successfully.");

                // Start uploading the file
                const uploadStream = storage.upload({ name: name, allowUploadBuffering: true });
                data.pipe(uploadStream);

                // Listen for the "add" event to get the uploaded file
                storage.on("add", (file) => {
                    file.link((err, url) => {
                        if (err) {
                            console.error("Error generating file link:", err);
                            storage.close(); // Close the storage connection
                            reject(err);
                        } else {
                            console.log("File uploaded successfully. URL:", url);
                            storage.close(); // Close the storage connection
                            resolve(url);
                        }
                    });
                });
            });

            // Handle errors during storage initialization
            storage.on('error', (err) => {
                if (err.message.includes("ENOENT")) {
                    console.error("Session file error: Ensure the 'session' directory exists and is writable.");
                } else if (err.message.includes("Payment Required")) {
                    console.error("Error: Insufficient account quota or Pro account required.");
                } else if (err.message.includes("Timed Out")) {
                    console.error("Error: Connection timed out. Please check your network.");
                } else {
                    console.error("Storage initialization error:", err);
                }
                storage.close(); // Close the storage connection
                reject(err);
            });
        } catch (err) {
            console.error("Unexpected error:", err);
            reject(err);
        }
    });
};

module.exports = { upload };

// Example usage:
// const fileStream = fs.createReadStream('example.txt');
// upload(fileStream, 'example.txt')
//     .then(url => console.log("Uploaded file URL:", url))
//     .catch(err => console.error("Upload failed:", err));
