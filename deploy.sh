#!/bin/bash
set -e

echo "Pulling latest changes..."
git pull

echo "Building and starting containers..."
docker-compose up --build -d

echo "Deployment complete!"
