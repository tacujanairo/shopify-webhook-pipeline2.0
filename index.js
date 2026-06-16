//2026-06-07
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const Airtable = require('airtable');

const app = express();
const PORT = 3000;
const SHOPIFY_SECRET = process.env.SHOPIFY_SECRET;
/////////////////dead code//////////////////////////
// Configure Airtable
const airtable = new Airtable({
    apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
});

const base = airtable.base(process.env.AIRTABLE_BASE_ID);
//////////////////////dead code///////////////////////
// CRITICAL MIDDLEWARE: Captures the untouched raw body buffer before Express parses it.
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// Route for your Webhook
app.post('/webhook', async (req, res) => {
    console.log("⚡ Incoming Webhook detected via Express!");

    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');

    // 1. REJECTION CASE: If a request doesn't even bother to bring a signature header, drop it instantly.
    if (!hmacHeader) {
        console.log("❌ Blocked: Missing X-Shopify-Hmac-Sha256 header entirely.");
        return res.status(401).send("Unauthorized");
    }

    try {
        // 2. CRYPTO MATH TIME: Generate our own signature matching Shopify's exact algorithm
        const generatedHmac = crypto
            .createHmac('sha256', SHOPIFY_SECRET)
            .update(req.rawBody)
            .digest('base64');

        // 3. COMPARISON: Compare our hash against the incoming header signature
        if (generatedHmac !== hmacHeader) {
            console.log("❌ Alert: HMAC signature mismatch! Someone is trying to spoof data.");
            return res.status(401).send("Unauthorized");
        }

        console.log("🛡️ Verified: HMAC matches perfectly. Processing authentic Shopify order...");

        // 4. DATA PROCESSING: Safe to run now because we trust the source completely
        const data = req.body;
        const normalized = normalizeShopifyOrder(data);

        // Send to both services (await if you want to ensure completion)
        await sendToAirtable(normalized);
        await sendToHubSpot(normalized);

        res.status(200).send("OK");

    } catch (e) {
        console.error("❌ System Error during verification:", e);
        res.status(500).send("Internal Server Error");
    }
});

// Default Root Route
app.get('/', (req, res) => {
    res.send("Express Server running inside Docker space 🚀");
});
/*
function normalizeShopifyOrder(data) {
    return {
        id: data.id,
        email: data.email,
        total: data.total_price,
        created_at: data.created_at,
        customer_name: data.customer?.first_name + ' ' + data.customer?.last_name,
        order_status: data.fulfillment_status || 'pending'
    };
}
*/
function normalizeShopifyOrder(data) {
    return {
        // Order Meta
        id: String(data.id),
        order_number: data.name, // e.g., "#1024"
        total: parseFloat(data.total_price),
        created_at: new Date(data.created_at).toISOString(),
        financial_status: data.financial_status || 'pending',
        fulfillment_status: data.fulfillment_status || 'unfulfilled',

        // Customer Meta
        customer: {
            id: String(data.customer?.id),
            email: data.email || data.customer?.email,
            first_name: data.customer?.first_name || 'Guest',
            last_name: data.customer?.last_name || 'Customer'
        },

        // Array of products inside this specific order
        line_items: data.line_items.map(item => ({
            id: String(item.id),
            sku: item.sku || `NO-SKU-${item.product_id}`,
            title: item.title,
            variant_title: item.variant_title,
            quantity: parseInt(item.quantity, 10),
            price: parseFloat(item.price)
        }))
    };
}
async function sendToAirtable(data) {
    try {
        console.log("📦 [Express] Sending to Airtable...");

        const AIRTABLE_API_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/orders`;

        const response = await fetch(AIRTABLE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                records: [{
                    fields: {
                        "Order ID": String(data.id),
                        "Email": data.email,
                        "Total Price": parseFloat(data.total),
                        //"Order Date": data.created_at,
                        "Order Date": new Date(data.created_at).toISOString(),
                        "Customer Name": data.customer_name || "Unknown",
                        "Status": data.order_status || "pending"
                    }
                }]
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Airtable error:", result);
            throw new Error(result.error?.message || "Airtable error");
        }

        console.log("✅ Successfully sent to Airtable! Record ID:", result.records[0].id);

    } catch (error) {
        console.error("❌ Error sending to Airtable:", error.message);
        throw error;
    }
}

async function sendToHubSpot(data) {
    console.log("📇 [Express] Sending to HubSpot...");
    console.log(data);
    // Your HubSpot logic here
}

app.listen(PORT, () => {
    console.log(`🚀 Express App listening locally on port ${PORT}`);
});
/*

git add .
git commit -m "shopify"
git push



git clone git@github.com:tacujanairo/shopify-webhook-pipeline.git webhook-app


git pull

./deploy.sh



sudo docker logs my-running-webhook
sudo docker logs -f my-running-webhook


docker-compose down
docker-compose up -d


git fetch origin
git reset --hard origin/main

*/



/*



# 1. Stop the old container
sudo docker stop my-running-webhook

# 2. Delete the old container instance
sudo docker rm my-running-webhook

# 3. Rebuild the image (Docker will read the newly pulled index.js)
sudo docker build -t bike-webhook-app .

# 4. Fire up the new container with your environment variables intact
sudo docker run -d --name my-running-webhook --env-file .env -p 3000:3000 --restart always bike-webhook-app
*/
