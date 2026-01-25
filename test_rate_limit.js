const http = require('http');

const TOTAL_REQUESTS = 10;
const API_URL = 'http://localhost:3000/purchase';
const USER_ID = 999;
const PRODUCT_ID = 1;

async function makeRequest(i) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ userId: USER_ID, productId: PRODUCT_ID, quantity: 1 });

        const req = http.request(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
        }, (res) => {
            console.log(`Request ${i + 1}: Status ${res.statusCode}`);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

(async () => {
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        await makeRequest(i);
    }
})();
