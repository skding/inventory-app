# Oracle Cloud Deployment Guide

This guide details the steps to deploy your Inventory Management System to an Oracle Cloud Infrastructure (OCI) instance and enable HTTPS for camera scanning.

## 1. OCI Instance Provisioning
1.  Create a **Compute Instance** (Ubuntu 22.04 or Oracle Linux).
2.  **VCN Security List**:
    *   Ingress Rule: Allow CIDR `0.0.0.0/0` on Port `80` (HTTP).
    *   Ingress Rule: Allow CIDR `0.0.0.0/0` on Port `443` (HTTPS).
    *   Ingress Rule: Allow CIDR `0.0.0.0/0` on Port `3010` (If not using Nginx).

## 2. Server Setup
Connect via SSH and install dependencies:

```bash
# Update and install Node.js (via NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20

# Install PostgreSQL (if not using OCI DB)
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Setup Database
sudo -u postgres psql
# CREATE DATABASE inventory_db;
# CREATE USER user WITH PASSWORD 'your_password';
# GRANT ALL PRIVILEGES ON DATABASE inventory_db TO user;
```

## 3. Application Deployment
1.  Clone your repository.
2.  Install dependencies: `npm install`.
3.  Setup `.env`:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/inventory_db"
    NEXTAUTH_SECRET="your_secret_here"
    NEXTAUTH_URL="https://yourdomain.com"
    ```
4.  Generate Prisma Client: `npx prisma generate`.
5.  Build the app: `npm run build`.
6.  Install PM2: `npm install -g pm2`.
7.  Start the app: `pm2 start npm --name "inventory-app" -- start`.

## 4. Manual User Creation
Run the standalone script to create your first account:
```bash
npx tsx scripts/create-user.ts
```

## 5. Enable HTTPS (Nginx + Certbot)
Since you are using Port **3010** externally (because Port 80 is taken), Nginx will listen on 3010 and forward traffic to the app running internally on 3011.

1.  **Install Nginx**:
    ```bash
    sudo apt update
    sudo apt install nginx -y
    ```

2.  **Configure Nginx**: Create `/etc/nginx/sites-available/inventory`:
    ```nginx
    server {
        listen 3010; # External port (you will type http://IP:3010)
        server_name _; 

        location / {
            proxy_pass http://localhost:3011; # Internal app port
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **Enable Configuration**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/inventory /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

## 6. SSL via Certbot (For HTTPS)
If you have a domain, you can run this to enable HTTPS. If not, you may need a self-signed certificate or a service like Cloudflare/ngrok for camera scanning to work, as browsers require HTTPS for camera access.

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## 7. Troubleshooting

### Error: `sh: 1: next: not found`
This happens if `node_modules` are missing or `npm install` was not successful.
**Fix**: Ensure you are in the project folder and run:
```bash
npm install
```

### Error: `EACCES: permission denied, mkdir '/opt/inventory-app/node_modules'`
This happens because the `/opt` directory is owned by `root`.
**Fix**: Give the `ubuntu` user ownership of the project folder:
```bash
sudo chown -R ubuntu:ubuntu /opt/inventory-app
```
Then run `npm install` again.

### Error: `PrismaClientInitializationError`
This happens if the database is not accessible.
**Fix**: Check your `.env` file and ensure the `DATABASE_URL` is correct and the Postgres service is running (`sudo systemctl status postgresql`).

## 8. Local Testing
The app is now configured to run on port **3011** internally. You can test it locally with:
```bash
npm run dev
```
And access it at `http://localhost:3011`. When running in the cloud with Nginx, you will use `http://IP:3010`.
