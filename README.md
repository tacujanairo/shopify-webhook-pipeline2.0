## API Integration & Backend Automation (v2.0) *(Active Development)*
* **Demo Store:** TropicalBikePH Shopify Store
* **Sandbox Environment:** (Demo access password: `tropical`)

**Complimentary Checkout Simulator:** https://github.com/tacujanairo/shopify-checkout-simulator

### Key Features

- **Shopify Webhook Processing**  
  Handles orders, customer events, and inventory updates seamlessly using an Express-powered backend.

- **HMAC Signature Verification**  
  Validates incoming requests using Shopify’s webhook verification flow against raw request bodies.

- **Containerized Deployment**  
  Fully dockerized environment ensuring consistent, isolated, and repeatable deployments across local development and VPS environments.

- **Idempotent Database Logic**  
  Prevents duplicate inserts during Shopify webhook retries or repeated delivery attempts.

### Technical Overview

#### Backend & Infrastructure
- **Node.js & Express:** Event-driven REST endpoints optimized for high-throughput webhook ingestion.
- **Docker:** Containerized architecture for simplified environment orchestration and VPS deployment.
- **SQLite:** Lightweight, file-based relational storage.

#### Integrations
- Shopify Admin API
- HubSpot API
- Airtable API

#### Security
- HMAC verification
- Express raw payload parsing validation