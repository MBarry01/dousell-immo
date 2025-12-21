const https = require('https');
const fs = require('fs');
const path = require('path');

const urls = [
    'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoEmoji/NotoEmoji-Regular.ttf',
    'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoEmoji/NotoEmoji-Regular.ttf',
    'https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoEmoji-Regular.ttf'
];

const dest = path.join(process.cwd(), 'public', 'fonts', 'NotoEmoji-Regular.ttf');
const file = fs.createWriteStream(dest);

function download(index) {
    if (index >= urls.length) {
        console.error('All URLs failed.');
        fs.unlink(dest, () => { });
        return;
    }

    const url = urls[index];
    console.log(`Trying ${url}...`);

    https.get(url, (response) => {
        if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    console.log('Download completed successfully.');
                });
            });
        } else if (response.statusCode === 302 || response.statusCode === 301) {
            const newUrl = response.headers.location;
            console.log(`Redirecting to ${newUrl}...`);
            https.get(newUrl, (res2) => {
                if (res2.statusCode === 200) {
                    res2.pipe(file);
                    file.on('finish', () => {
                        file.close(() => {
                            console.log('Download completed successfully (redirect).');
                        });
                    });
                } else {
                    console.log(`Failed with ${res2.statusCode}, trying next...`);
                    download(index + 1);
                }
            }).on('error', (err) => {
                console.error(`Error redirect: ${err.message}, trying next...`);
                download(index + 1);
            });
        } else {
            console.log(`Failed with ${response.statusCode}, trying next...`);
            download(index + 1);
        }
    }).on('error', (err) => {
        console.error(`Error: ${err.message}, trying next...`);
        download(index + 1);
    });
}

download(0);
