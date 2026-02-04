#!/bin/sh

echo "Running database setup..."
node scripts/setup-db.js

echo "Starting application..."
exec node server.js
