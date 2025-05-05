const fs = require('fs');
const path = require('path');
const { Dropbox } = require('dropbox');
const fetch = require('isomorphic-fetch');

// Ensure the session directory and file exist
const sessionDir = path.join(__dirname, 'session');
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir);
    console.log("Created session directory:", sessionDir);
}

const sessionFilePath = path.join(sessionDir, 'creds.json');
if (!fs.existsSync(sessionFilePath)) {
    fs.writeFileSync(sessionFilePath, '{}');
    console.log("Created session file:", sessionFilePath);
}

// Dropbox Access Token
const DROPBOX_ACCESS_TOKEN = 'sl.u.AFuiKkkrDg9ETqT9M029c0XQ30J4zgUSMOISk2VVhDUwYiMEHvuk5hELIhgo6lSdR5LF-qkOx6tl46jTt0kraW8IhXrJPzC-RWDpXY1UHMyvQjrzYoALl0gKTfMIe_sGO56qfql9Ltr5uvjzDYKAQPMakpC6aMFUFENJraeacZDbhc446DNVrM06pPcnEjHJX2P7EkMIA3kg9sofR0kGl7Yf3LY9PCW9qwzpkk_llHbXlUuXmm9vXgXc_OAHe4SvFsbRToam_jM0boip_kyT2nJbvgFQMqgE6QfTKlZhCNNGAAlJONXJlSsGh3B0Ce0p6EjGtDF5iWkLMd_HH6LBFSYib-hTDIO8mm6wITzVy02NpWG1rJsIBGXUbTpGAeJwX2aU2wF9gwRu7FXouD7cWKIJxKgvkdCkmUCzyZFSE4AfBQ63q3y74NmQZwiVzz7-7Jl2TU1StRSb0kDpcaYQovAY1XD5G--aAiAVvRBM-nE7g5OBMY9dQRZma2VBGKUITJooXfb-owHZrZqB1tQxkuONdn0ujE5RIWinliTJvpX1yC2BYO-WzfQQj004mzH2Rx23N3d8R6EcLZwx-b-jRuNv6rRVW29m5_a7gFqV0rMPJHDakVMY7DUbmB39RUScfNBl7ZyvW54_qTu8RfibU79w4bvx0B8k3WdJr0742gQcbuVRH15aFdqFBVqyBgYGFuxlmdf8UX3OsorcWllNUXjQN7ZVV3NiD0PjlOwVxFtKJfisslIOgDF4aMnNZanRKtXZfaemBwuxtN75r-qnu5hND0hf2UxVf4mNseDtyGnXgT5jn1FvbODMFBUvWa6MQ_s0o9DsZhYTs91hXY5ikiyOYXWpFXb-3IPx20OJU-KWeWF3YpO7_JqOn-u6dcRfBOc0XKqseFhQdByCezMsiKVd09nPREPRnhn9RfRNujWlf4lfNCq_MaQ1DVOL4eUBL5PgXt1KKnQr-POFBWfYbdRj-X65DKkOuKt6kkDY1y4pRzekc6TPU2Z-sJY5iWd1q9Jxxi2IIWMI-fjo3Ie6ALTW2z1ybEx0ftd8Be8htUGyRvzLpTaO-UCar7siib2qgOJm-NxPIlVYDJIMeZoAk3prNTIdOEur7sNNCIQBna0ZC-nhItJKtxFpV83qTLbrntEBU0OD_HzbHxdJxmmrKQkTplZFwE54FV36PmqhvWMAZqexVkF7XGdcCLkh4InOKbbkkxDOoBSc2STv6VAMKkaTgBEyV2fg6btEpV2QYGJo7BvllfrPHJ-fhT_JmXcDfxHOish_aVQ7A66-lxlwYsg9NeiCP9beLeP7zSHAx95U6wskmK5rwmXpRD5gAYbh0ahAeeYqFvwO89Za2jY1JV2frW89O-Z2_0afkAzufDFN-2sKdxc7iZR_2GBzRxwCwpHQDMDcZdvqN9mr9pRj02So';

const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch });

// Upload function
const upload = (data, name) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Preparing to upload to Dropbox...");

            const chunks = [];
            for await (const chunk of data) {
                chunks.push(chunk);
            }
            const fileBuffer = Buffer.concat(chunks);

            const uploadResponse = await dbx.filesUpload({
                path: '/' + name,
                contents: fileBuffer,
                mode: 'add',
                autorename: true,
            });

            console.log("File uploaded. Creating shareable link...");

            const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
                path: uploadResponse.result.path_lower,
            });

            const fullUrl = linkResponse.result.url;
            const pathOnly = fullUrl.split('/scl/fi/')[1]; // Extract the path-like portion

            console.log("Formatted Dropbox link:", pathOnly);
            resolve(pathOnly);
        } catch (err) {
            console.error("Dropbox upload error:", err);
            reject(err);
        }
    });
};

module.exports = { upload };
