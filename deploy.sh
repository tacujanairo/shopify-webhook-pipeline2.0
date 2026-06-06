#!/bin/bash

echo "🔄 Pulling latest code from Git..."
git pull

echo "🛑 Stopping old container..."
sudo docker stop my-running-webhook || true

echo "❌ Removing old container..."
sudo docker rm my-running-webhook || true

echo "🏗️ Rebuilding Docker image with new code..."
sudo docker build -t bike-webhook-app .

echo "🚀 Launching the updated container..."
sudo docker run -d --name my-running-webhook --env-file .env -p 3000:3000 --restart always bike-webhook-app

echo "✅ Deployment complete! Showing live logs below (Press CTRL+C to exit logs):"
sudo docker logs -f my-running-webhook
