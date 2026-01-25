const http = require('http');

const TOTAL_REQUESTS = 200;
const CONCURRENCY = 50;
const API_URL = 'http://localhost:3000/purchase';
const PRODUCT_ID = 1;
const USER_ID = 1;

let completed = 0;
let successCount = 0;
let failCount = 0;
let errorCount = 0;

const start = Date.now();

async function makeRequest(id) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            userId: USER_ID,
            productId: PRODUCT_ID,
            quantity: 1
        });

        const req = http.request(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    successCount++;
                } else if (res.statusCode === 409) {
                    failCount++;
                } else {
                    errorCount++;
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            errorCount++;
            resolve();
        });

        req.write(data);
        req.end();
    });
}

async function stressTest() {
    const promises = [];
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        promises.push(makeRequest(i));

        if (promises.length >= CONCURRENCY) {
            await Promise.race(promises);
        }
    }

    await Promise.all(promises);

    const duration = (Date.now() - start) / 1000;

    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`Successful Orders: ${successCount}`);
    console.log(`Out of Stock: ${failCount}`);
    console.log(`Errors: ${errorCount}`);
}

const req = http.get('http://localhost:3000/health', (res) => {
    stressTest();
}).on('error', () => {
    console.error('Server is not running');
});
