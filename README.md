# Flash Sale System

A high-performance backend designed to handle extreme traffic spikes (like a Ticketmaster drop or Amazon Prime Day) without overselling inventory or crashing the database.

## The Problem
In a standard web app, if 1,000 users buy the last item at the exact same second, the database can't lock fast enough, leading to negative stock. Also, thousands of direct DB writes will crash the server.

## The Solution
This project uses **Event-Driven Architecture**:
1.  **Redis** handles the "live" inventory in memory (Atomic & Fast).
2.  **BullMQ** queues the orders.
3.  **Workers** save the data to Postgres lazily in the background.

## Key Features
-   **Atomic Inventory**: Uses Redis Lua scripts to guarantee `stock` never goes below 0.
-   **Anti-Bot Protection**: Rate limits users by IP/ID (Max 5 requests/min).
-   **Idempotency**: Prevents double-charging if a user clicks "Buy" twice.
-   **Asynchronous Processing**: The API responds "Success" instantly (~10ms), while the DB updates later.

## How It Works (The Flow)
1.  **Request**: User hits `POST /purchase`.
2.  **Gatekeeper**: Server checks **Rate Limit** (Redis) and **Idempotency Key**.
3.  **Claim**: Server atomically decrements stock in **Redis**.
    *   *If stock is 0*: Request is rejected immediately (409).
4.  **Queue**: If stock is claimed, the job is pushed to **BullMQ**.
5.  **Response**: User gets a `200 OK` ("You got it!").
6.  **Persist**: A background Worker pulls the job and saves the Order to **PostgreSQL**.

## Tech Stack
-   **Runtime**: Node.js & Express
-   **Database**: PostgreSQL (Prisma ORM)
-   **Cache/Engine**: Redis (ioredis)
-   **Queue**: BullMQ

## Setup & Run

**1. Install**
```bash
npm install
```

**2. Configure**
Rename `.env.template` to `.env` and add your Redis/Postgres URLs.

**3. Initialize DB**
```bash
npx prisma migrate dev --name init
```

**4. Start Server**
```bash
npm run dev
```

**5. Seed Data** (Resets DB to 100 items)
```bash
npm run seed
```

## Testing

**Stress Test (Concurrency)**
Simulates 200 users rushing to buy 100 items. Logic dictates exactly 100 should succeed and 100 fail.
```bash
node stress_test.js
```

**Anti-Bot Test**
Spams the server to trigger the 429 Rate Limit.
```bash
node test_rate_limit.js
```

**Idempotency Test**
Sends the same request key twice to verify the second is cached.
```bash
node test_idempotency.js
```

## API Docs

### POST /purchase
Buys an item.

**Headers**
-   `Idempotency-Key` (Optional): UUID string.

**Body**
```json
{ "userId": 1, "productId": 1, "quantity": 1 }
```

**Responses**
-   `200 OK`: `{ "status": "queued" }` (Success)
-   `409 Conflict`: `{ "error": "Stock problem" }` (Sold out)
-   `429 Too Many Requests`: `{ "error": "Too many requests" }`

### GET /purchase/orders/:userId
Check order status.
**Response**
```json
[ { "id": 1, "status": "CONFIRMED", "quantity": 1 } ]
```

### GET /purchase/metrics
System Health.
**Response**
```json
{ "stock_remaining": 45, "queue_depth": 0, "total_processed": 55 }
```

### POST /products/restock
Admin restock.
**Body**
```json
{ "productId": 1, "amount": 50 }
```
