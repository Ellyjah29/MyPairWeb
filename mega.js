const fs = require('fs');
const path = require('path');
const { Dropbox } = require('dropbox');
const fetch = require('isomorphic-fetch');

// Keep the session directory (for consistency, optional here)
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

// Replace this with your Dropbox access token
const DROPBOX_ACCESS_TOKEN = 'sl.u.AFtLfDv7a2ex-nWytOLlp2BHvRE7lkjC1jTKPONWdLwpf6_lE5ka7ZY4omRtlXDv6sER1Kl9PNa5YNEFWhK_gChiPxRftRHER5tfyKNH0yltQWFCEuNob13Jdh7Q2p-FHZpCMarN1wtQVU7zPvkvU5dlNQSwr9cszWwcQwWf-4Vn6quCkpS-fmQQTzYDeWNtGhiyhzHUqxnZ1ltWtP2Oz0T42eBwnB8yquLX41mvEqwWAUdn_Y7HSnDD2gAwrKi2GZFej2DVi_oZ63nOOnn3QOi69RYZJimnquBi9nKO0ObQOsZYl8OtgCXZS7mDnVcNXoJpKEC2nJOU0laGTsG3h92zUHbWzkNsujkxWVDU4NJ8LpcrOJJN-YZvGlzK7NAxyqxhrAXijminw48M9eV_ya_tnIiKRJ39Zec7-93R5mDPjbu_nFOhP-dLgcK6HLgOMn2Tyv4v5mE9aMJWzFudpBMv27IVrhuSv-F5X94rRWl-pcipmHmK4P_VAsABndfkl5ZqQyKAj17F3cPXqK3xVdJwQ5BbS7lB37gUS4lsKZ4rJOD8FDNdulvLB_D6nswPRDyDiUhpR1sqPF4z8PoC5UspjzYj_eGNg_B56moXbFYUupuU-eINUfoP3vM69SqiS4eYlfnH93U9OYgU2ZQvwV6Mu9ksSoW3C6AyVWdwv3C_k-UAfUCGDgTwCJxGId8vP4M9--kJp_ocGCOUaCufIzKxLGNIwXb9TiAGJXa6Vki5sAMAcuQ-l4D9GyOZ2SY1vwfd48QAqVwTnJuj0i9bBDfYs8I9Nuvkup1HTlMkUARjY7dtQ8__h68-VbS0NRpONbc1ieDyFfUz5-wbnCedfJtgPr_Scqdgb4F3wqfXt5XdKPKV294VX4yTGDYKuyuBVIg8DwoVUgOSs38NzQ6YB32tNjrTdCqgO_TYIRoQWg5BhLS2hGo_eoogqjbtFRkIEeJey9hUrAaZbysdClwTut1ChX47VOaJzcwvR36tCfXPfWMMBNnGgezSNO9acGF6-6InALRAY_khaJU-e0cVGAQvKjmSREZvoa1p4qrD3-o_EQCuXVbA_TSev4bCpcXUKJjB6aqFx125ks7kLhStlREyKqk59I3CMPfva0qFI2Yc4xjaydHbXFi-z_71zHXIPKauyhdCEl6OG6jUijNDknfKx2__aC-Cvxb52f2WwxzTIHWFFobDzU7Lukzey731rGnsa_zfwg9CYHkLGwEHSmkZVHUQMtzxkZQu37Vbr6X6WgCF038ds97YAaojfobR9LbvdaS5UyofaZ-avgW-HetLz-Bn4mV0S_4a1sJ4wxYnr9_H_cegrv6dYhLok8WVdWBI3KN8CIYR0TtFb4gbC-YTbdV51tuhTxQ9EKuEeyG0eQnL_HO4CeqSH_qmQIgokoZqh_tXPAv2CeoeTd52hM0ds';

const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch });

const upload = (data, name) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Preparing to upload to Dropbox...");

            const chunks = [];
            for await (const chunk of data) {
                chunks.push(chunk);
            }
            const fileBuffer = Buffer.concat(chunks);

            // Upload the file
            const uploadResponse = await dbx.filesUpload({
                path: '/' + name,
                contents: fileBuffer,
                mode: 'add',
                autorename: true,
            });

            console.log("File uploaded. Creating shareable link...");

            // Create shareable link
            const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
                path: uploadResponse.result.path_lower,
            });

            const url = linkResponse.result.url.replace('?dl=0', '?dl=1');
            console.log("File uploaded successfully. URL:", url);
            resolve(url);
        } catch (err) {
            if (err.error && err.error.error_summary && err.error.error_summary.includes('shared_link_already_exists')) {
                // Handle case where a shared link already exists
                try {
                    const existingLink = await dbx.sharingListSharedLinks({
                        path: '/' + name,
                        direct_only: true,
                    });
                    const url = existingLink.result.links[0].url.replace('?dl=0', '?dl=1');
                    console.log("Using existing shared link. URL:", url);
                    resolve(url);
                } catch (linkErr) {
                    console.error("Error retrieving existing shared link:", linkErr);
                    reject(linkErr);
                }
            } else {
                console.error("Dropbox upload error:", err);
                reject(err);
            }
        }
    });
};

module.exports = { upload };
