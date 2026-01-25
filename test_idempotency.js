const http = require('http');

const API_URL = 'http://localhost:3000/purchase';
const USER_ID = 888;
const PRODUCT_ID = 1;
const IDEMPOTENCY_KEY = 'test-key-12345';

async function makeRequest(i) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ userId: USER_ID, productId: PRODUCT_ID, quantity: 1 });

        const req = http.request(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'Idempotency-Key': IDEMPOTENCY_KEY
            }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log(`Request ${i}: Status ${res.statusCode} | Body: ${body}`);
                resolve();
            });
        });

        req.write(data);
        req.end();
    });
}

(async () => {
    await makeRequest(1);
    await makeRequest(2);
})();
