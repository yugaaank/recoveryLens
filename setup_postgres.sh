#!/bin/bash
# Run this script with: sudo bash setup_postgres.sh

echo "Creating PostgreSQL user and database..."

# Create user 'yugaaank' if it doesn't exist
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'yugaaank') THEN CREATE ROLE yugaaank WITH LOGIN PASSWORD 'local_dev_password' CREATEDB; END IF; END \$\$;"

# Create database 'recovery_db' if it doesn't exist
sudo -u postgres psql -c "SELECT 'CREATE DATABASE recovery_db OWNER yugaaank' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'recovery_db')\gexec"

echo "✅ Database 'recovery_db' and user 'yugaaank' created/verified."
