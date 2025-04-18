const mega = require("megajs");

const auth = {
    email: 'Jakejasons580@gmail.com',
    password: 'elijah2909',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246'
};

const upload = (data, name) => {
    return new Promise((resolve, reject) => {
        try {
            // Create a new storage instance
            const storage = new mega.Storage(auth);

            // Wait for the storage to be ready
            storage.on('ready', () => {
                console.log("Storage is ready. Proceeding with upload...");

                // Upload the file
                const uploadStream = storage.upload({ name: name, allowUploadBuffering: true });
                data.pipe(uploadStream);

                // Listen for the "add" event to get the uploaded file
                storage.on("add", (file) => {
                    file.link((err, url) => {
                        if (err) {
                            if (err.message.includes("Payment Required")) {
                                console.error("Error: Insufficient account quota or Pro account required.");
                                reject(new Error("Insufficient account quota or Pro account required."));
                            } else {
                                console.error("Error generating file link:", err);
                                reject(err);
                            }
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
                if (err.message.includes("Payment Required")) {
                    console.error("Error: Insufficient account quota or Pro account required.");
                    reject(new Error("Insufficient account quota or Pro account required."));
                } else {
                    console.error("Storage initialization error:", err);
                    reject(err);
                }
            });
        } catch (err) {
            console.error("Unexpected error:", err);
            reject(err);
        }
    });
};

module.exports = { upload };
