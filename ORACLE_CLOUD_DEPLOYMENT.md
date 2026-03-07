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
5.  Push Schema to DB: `npx prisma db push`.
6.  Build the app: `npm run build`.
7.  Install PM2: `npm install -g pm2`.
8.  Start the app: `pm2 start npm --name "inventory-app" -- start`.

## 4. Manual User Creation
Run the standalone script to create your first account:
```bash
npx tsx scripts/create-user.ts
```

## 5. Enable HTTPS (Nginx + Certbot)
**CRITICAL**: In your Nginx config, I noticed a typo: `cloverditital` (with two 't's) instead of **`cloverdigital`**. This will cause Nginx to ignore your requests.

### Step 5: Configure Nginx (Starter Config)
Since you don't have the SSL lines yet, we start with a **Port 80 only** config. Certbot will then "upgrade" this file for you automatically.

1.  Open the config: `sudo nano /etc/nginx/sites-available/inventory`
2.  Delete everything and paste this **Starter Template**:

```nginx
server {
    listen 80;
    server_name inventory.cloverdigital.com.my;

    location / {
        proxy_pass http://localhost:3011;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3.  Verify and Start:
    ```bash
    sudo nginx -t
    sudo systemctl restart nginx
    ```

### Step 5b: Enable HTTPS with Certbot
Now that Nginx is running correctly on Port 80, run Certbot to add the SSL lines for you:
```bash
sudo certbot --nginx -d inventory.cloverdigital.com.my
```
*(Certbot will now automatically find your "Starter Config" and add the `listen 443 ssl` block and certificate paths correctly).*

**Restart Nginx after editing**: `sudo systemctl restart nginx`

2.  **Why use Port 80?**: Even if another app is using Port 80, Nginx will see the name `inventory.cloverdigital.com.my` and send it to your app.

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

### Error: `Authentication failed against the database server (P1000)`
This means Postgres rejected the login. Follow these steps to verify everything:

1.  **Check the User**: Ensure the user `inventory_user` actually exists:
    ```bash
    sudo -u postgres psql -c "\du"
    ```
    If it's missing, create it: `sudo -u postgres psql -c "CREATE USER inventory_user WITH PASSWORD 'your_password';"`

2.  **Check the Database**: Ensure `inventory_db` exists:
    ```bash
    sudo -u postgres psql -l
    ```
    If missing, create it: `sudo -u postgres psql -c "CREATE DATABASE inventory_db OWNER inventory_user;"`

3.  **Special Characters**: If your password has symbols like `@`, `:`, `/`, or `#`, it **must be URL encoded** in the `.env` file.
    *   Example: `p@ssword` becomes `p%40ssword`.
    *   **Recommendation**: Use a simple alphanumeric password first to test.

4.  **Verifying Local Connection**: Try logging in manually using the credentials from `.env`:
    ```bash
    psql -h localhost -U inventory_user -d inventory_db
    ```
    (It will prompt for password). If this fails, the issue is definitely the password or Postgres permissions.

### Error: `Challenge failed for domain (SSL/Certbot)` - "connection" or "Error getting validation data"
... (previous fix) ...

## 6. Finalize HTTPS Transition
Once Certbot is successful, your app is now secure! You MUST update your configuration to use the domain:

1.  **Update `.env`**:
    Change `NEXTAUTH_URL` to your new secure domain:
    ```env
    NEXTAUTH_URL="https://inventory.cloverdigital.com.my"
    ```
2.  **Restart the App**:
    ```bash
    pm2 restart all
    ```
3.  **Access the App**:
    Go to **`https://inventory.cloverdigital.com.my`** in your browser. (You no longer need `:3010` or `:3011`).

### Error: `Login succeeds but redirects back to Login page (Login Loop)`
...

### Error: `Challenge failed for domain (SSL/Certbot)` - "unauthorized" or "404"
This means the server was reached, but the IP address in the error doesn't match your cloud IP.
...

### Error: `I see "Index of /" instead of the app`
This means Nginx is serving a folder instead of the app. Follow this **exact** sequence to fix it:

1.  **Check for conflicts**: run `ls -l /etc/nginx/sites-enabled/`.
    *   If you see `default`, delete it: `sudo rm /etc/nginx/sites-enabled/default`.
    *   If you see **more than one file**, delete the ones you don't need.

2.  **Verify Domain Typo**: Check your config: `grep "server_name" /etc/nginx/sites-available/inventory`.
    *   It MUST be `cloverdigital` (not `cloverditital`).

3.  **The "Clean Slate" Config**: If the above fails, use this **all-in-one** config (Replace EVERYTHING in `/etc/nginx/sites-available/inventory`):
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name inventory.cloverdigital.com.my;

    location / {
        proxy_pass http://localhost:3011;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*(After pasting this, run `sudo nginx -t` and `sudo systemctl restart nginx`. Then run Certbot again if you want HTTPS).*

4.  **Check Active Config**: Run `sudo nginx -T` and look for any line that says `root /var/www/html`. If you see it, that's what's causing the "Index" page.

### How to remove Port 80 Redirects
If you set up a redirect from Port 80 to 3000 (manually or via a script), it will block Nginx.

**1. Check and Remove `iptables` NAT rules**:
If you used `iptables` for forwarding, run:
```bash
# View list of redirects
sudo iptables -t nat -L --line-numbers

# Delete the redirect rule (replace <LINE_NUMBER> with the actual number from the list)
sudo iptables -t nat -D PREROUTING <LINE_NUMBER>
sudo netfilter-persistent save
```

**2. Domain-Level Redirects**:
Log in to your domain provider (e.g., GoDaddy, Namecheap) and ensure "Domain Forwarding" or "Redirect" is DISABLED. Use an **A Record** pointing to your IP instead.

### Error: `Port is open in OCI console but cannot connect`
Oracle Cloud Ubuntu instances have a secondary firewall (`iptables`) that blocks ports even if the Security List is open.
**Fix**: Run these commands on your server to allow port 3010:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3010 -j ACCEPT
sudo netfilter-persistent save
```

### Important: `NEXTAUTH_URL` Mismatch
Your `NEXTAUTH_URL` must match **exactly** what you type in your browser.
*   If you access via `http://138.2.94.149:3010`, your `.env` must be:
    `NEXTAUTH_URL="http://138.2.94.149:3010"`
*   Note: Even though the app runs on **3011** internally, Nginx shows it to you on **3010**. NextAuth needs to know the **external** port.

### Error: `The table public.users does not exist in the current database (P2021)`
This happens if your database connection is successful, but the tables haven't been created yet.
**Fix**: Run this command to push your schema to the cloud database:
```bash
npx prisma db push
```

### Error: `PrismaClientInitializationError`
This happens if the database is not accessible.
**Fix**: Check your `.env` file and ensure the `DATABASE_URL` is correct and the Postgres service is running (`sudo systemctl status postgresql`).

## 8. Local Testing
The app is now configured to run on port **3011** internally. You can test it locally with:
```bash
npm run dev
```
And access it at `http://localhost:3011`. When running in the cloud with Nginx, you will use `http://IP:3010`.
