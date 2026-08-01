# SnipURL Deployment Guide

This guide documents the production deployment for SnipURL using AWS S3 for the frontend and AWS EC2 for the backend.

## Production URLs

- Frontend: http://snipurl-shortener.s3-website.ap-south-1.amazonaws.com/
- Backend API: http://65.2.81.212
- Repository: https://github.com/dorateja293/URL-Shortener

## 1. EC2 Setup

Launch an Ubuntu EC2 instance and connect:

```bash
ssh -i your-key.pem ubuntu@65.2.81.212
```

Update packages:

```bash
sudo apt update
sudo apt upgrade -y
```

Install Node.js and npm:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Clone the repository:

```bash
git clone https://github.com/dorateja293/URL-Shortener.git
cd URL-Shortener/server
npm install
```

## 2. Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-domain/api/auth/google/callback
CLIENT_URL=https://your-domain
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=https://your-domain
OAUTH_SUCCESS_REDIRECT_URL=https://your-domain
```

For the current S3 frontend, use:

```env
CORS_ORIGIN=http://snipurl-shortener.s3-website.ap-south-1.amazonaws.com
CLIENT_URL=http://snipurl-shortener.s3-website.ap-south-1.amazonaws.com
OAUTH_SUCCESS_REDIRECT_URL=http://snipurl-shortener.s3-website.ap-south-1.amazonaws.com
```

## 3. MongoDB Atlas

Create a MongoDB Atlas cluster.

Allow EC2 access:

```text
Network Access -> Add IP Address -> EC2 public IP
```

Create a database user and paste the connection string into:

```env
MONGO_URI=...
```

## 4. Redis

Install Redis on EC2:

```bash
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server
redis-cli ping
```

Expected:

```text
PONG
```

Use:

```env
REDIS_URL=redis://localhost:6379
```

## 5. PM2

Install PM2:

```bash
sudo npm install -g pm2
```

Start backend:

```bash
cd ~/URL-Shortener/server
pm2 start src/server.js --name url-shortener
```

Save the process list:

```bash
pm2 save
```

Enable restart after EC2 reboot:

```bash
pm2 startup
```

PM2 prints a command similar to:

```bash
sudo env PATH=... pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Copy the exact command PM2 prints and run it. Then run:

```bash
pm2 save
```

Check status:

```bash
pm2 status
```

Expected:

```text
url-shortener   online
```

## 6. Nginx

Install Nginx:

```bash
sudo apt install nginx -y
```

Create config:

```bash
sudo nano /etc/nginx/sites-available/url-shortener
```

Example:

```nginx
server {
    listen 80;
    server_name 65.2.81.212;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/url-shortener /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. Backend CORS Fix

The backend should keep this clean production setup:

```js
app.set("trust proxy", 1);

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
```

Do not leave temporary debug logs that print environment variables or request origins.

## 8. S3 Frontend Hosting

Build frontend locally:

```bash
cd client
npm run build
```

Upload the contents of:

```text
client/dist
```

to the S3 bucket.

Enable static website hosting in S3.

Current frontend:

```text
http://snipurl-shortener.s3-website.ap-south-1.amazonaws.com/
```

## 9. Frontend Production API URL

Create:

```text
client/.env.production
```

Use:

```env
VITE_API_URL=http://65.2.81.212
```

Then rebuild:

```bash
cd client
npm run build
```

## 10. Google OAuth

In Google Cloud Console, add the production callback URL:

```text
https://your-domain/api/auth/google/callback
```

For IP-only backend testing, use the exact backend callback URL configured in `.env`.

Update:

```env
GOOGLE_CALLBACK_URL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OAUTH_SUCCESS_REDIRECT_URL=...
```

## 11. Docker Installation

If Docker is needed on EC2:

```bash
sudo apt install docker.io -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu
```

Log out and log back in, then verify:

```bash
docker --version
```

## 12. Verification

Check PM2:

```bash
pm2 status
```

Check backend health:

```bash
curl http://localhost:5000/health
```

Expected:

```json
{
  "success": true,
  "message": "Server is healthy"
}
```

Check public backend:

```bash
curl http://65.2.81.212/health
```

## 13. Update Deployment

When code changes:

```bash
git pull origin main
cd server
npm install
pm2 restart url-shortener
pm2 save
```

When frontend changes:

```bash
cd client
npm install
npm run build
```

Upload the new `client/dist` contents to S3.
