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

const sessionFilePath = path.join(__dirname, 'session', 'creds.json');
if (!fs.existsSync(sessionFilePath)) {
    fs.writeFileSync(sessionFilePath, '{}'); // Create an empty JSON file
    console.log("Created session file:", sessionFilePath);
}

// Dropbox Access Token (replace with your actual token)
const DROPBOX_ACCESS_TOKEN = 'sl.u.AFuveecHbeIRE1BTzOo7AxJ2y8Xf-_vaCWuspvxziJdNXHB5Yer4IFiQaOY0vixKK4-Sh9NjPoFIIvsdimzR_RgrHJS1UTZwlUx3ZLO6TnjCHbOGqeh85_4E9J4Vd6Bg7vZRNepew_4VMrw1shlqictOiwrpBTiKZ2I91C0r_mSBqbIcOmV7cWxjbuwEXDHFaM6zQ2on0TDcgMyHQs8YyGRqlZEJsbDHBVlLEkuytC_uRhc6KjSOLAgfQa1B9DOB0OQT5DG7UD0A_Sblcd7xGIhsFZBZiEnZHIzedV-2VAMXWUSYY2HmJf1k98Li8BVuSG_WRc5Fc0O2mgom01O0pfLGQE22vpKfHqwY2VBReTKJSFQ94RkGIWL5_WkR_fMiM7EkuebwrbGbjTJ2u1C1C_GIlSAIIVHQ9Owqs-qQRYpmFaLZC1oryT_GgDaf-irenNeSxxoP4Y2EAnodItRpGCn1vNIY-Q_Qft44hzvD0ag6kCRG9Cm6aVLH4v9TLShoVuA90Tzt1uF4wJzDwcGPpQ8u_EsJhPqvE7bcUZEtTRBBQW_T0ls2Ohz96msfz58sKhrqThsj6bPPFPpvsehYttsKAqRuenuxSiTWHqzGUbYQFNNkGgLA6JJDfBb6gxrLG9TlgPiWQv0kO7XAEXT3vaQtcg-r6wMyQfyf3CTb-Stdph6etOmV_IkPhDw8xmuPYUS-8GnHGfCn5esjwuEP0NB_beIvWna9n4eLqpMdNt-NlVifYXD1FKD5fCqbQ31h-jHHn0LmqECx7RvOgWmUBm_fe7e6No2UCNXpZpZu9aaCbvEu3PZKr-siIr9ouGUKKt9xgAvv4QJuBoNleasGvUIGBcNl7qZK74Xl8pDtpDORMDzAY0vEimY04-qj6kBlfEplXCYrYlnAnOjj0CEk34juUdAlCrFrdhz6JEhj-c5GgbWsgZdlN6kmk2QsbV0V4KyJRFK8zdUr9eWZhv4HSByEJQKVSFICPaXMEAxBvYeH89zMZfMJy1_wOOd-Gp60qb15_lPc9MYLJlWFueiAH5MXW7jTLWw909ndsK4qYiA5gTGAGJDfp-UAehyTcMlH05CKckf6NshkVjLYsc8nyYdTUw9U0EMWMxiXMEEnInjceMJQATnZp0hzx0a98q9Q-41IiajdGAj_RRz7MUpMhFg0fGZfRLJkvveOkdYGPbMdGecnT9VkX_6bElVrg3ilOQyslh8kjQ4QJDPnUPIR70xe5_BuQZHYGP9jDCrQmTOiYuMckgg8s-2oltRo46qv79rNjMrw4-dqLgQ9PJo3jZV2LwF91NLw7yV3rYLfpu0iyLrNt2hbaegYlOSgjTTaYseawXsIunuVbU8pSU9F3Nar0tP5C9E7BRxQy-9_OeV6alNNGGDO8MNfN6Nk5MWSZmE7vYGIEfNr48cSepCUBjql';

const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch });

// Function to upload file to Dropbox
const upload = (data, name) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Preparing to upload to Dropbox...");

            // Collect chunks of data from the stream
            const chunks = [];
            for await (const chunk of data) {
                chunks.push(chunk);
            }
            const fileBuffer = Buffer.concat(chunks);

            // Upload the file to Dropbox
            const uploadResponse = await dbx.filesUpload({
                path: '/' + name,  // Upload path (file name in root directory)
                contents: fileBuffer,
                mode: 'add',        // This ensures the file is added if it doesn't already exist
                autorename: true,   // Automatically renames file if one already exists with the same name
            });

            console.log("File uploaded. Creating shareable link...");

            // Create a shareable link for the uploaded file
            const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
                path: uploadResponse.result.path_lower,
            });

            // Generate a download link
            const url = linkResponse.result.url.replace('?dl=0', '?dl=1');
            console.log("File uploaded successfully. URL:", url);
            resolve(url); // Resolve with the file URL
        } catch (err) {
            console.error("Dropbox upload error:", err);
            reject(err); // Reject on any other error
        }
    });
};

module.exports = { upload };
