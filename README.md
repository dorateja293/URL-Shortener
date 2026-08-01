# SnipURL - URL Shortener and Analytics Platform

SnipURL is a full-stack URL shortener with authentication, custom aliases, expiration dates, QR code generation, and analytics dashboards. The frontend is hosted on AWS S3 and the backend runs on AWS EC2.

## Live Demo

- Frontend: http://snipurl-shortener.s3-website.ap-south-1.amazonaws.com/
- GitHub: https://github.com/dorateja293/URL-Shortener

## Features

- JWT authentication with register, login, and profile endpoints
- Google OAuth login
- User-specific shortened URLs
- Custom aliases such as `/openai` or `/github`
- URL expiration with `410 Gone` for expired links
- QR code generation and download
- Search, pagination, and sorting for user links
- Click analytics by browser, OS, device, referrer, and recent activity
- Recharts analytics dashboard
- Light and dark mode
- Rate limiting, Helmet security headers, CORS, Morgan logging, and compression
- Redis caching for redirects

## Architecture

```text
User Browser
    |
    v
AWS S3 Static Website
    |
    v
React + Vite Frontend
    |
    v
AWS EC2 Backend API
    |
    +--> MongoDB Atlas
    +--> Redis
    +--> Google OAuth
```

## Tech Stack

Frontend:
- React
- Vite
- Recharts
- Lucide React

Backend:
- Node.js
- Express
- MongoDB + Mongoose
- Redis
- JWT
- Google OAuth
- QRCode
- Helmet, CORS, Morgan, Compression, Express Rate Limit

Deployment:
- AWS S3 static website hosting
- AWS EC2
- PM2
- Nginx
- MongoDB Atlas

## Screenshots

Add screenshots in `docs/screenshots/` and reference them here:

```text
docs/screenshots/home.png
docs/screenshots/login.png
docs/screenshots/dashboard.png
docs/screenshots/analytics.png
docs/screenshots/url-creation.png
docs/screenshots/qrcode.png
```

Example:

```md
![Dashboard](docs/screenshots/dashboard.png)
```

## API Documentation

Base URL:

```text
http://65.2.81.212
```

### Health

```http
GET /health
```

Response:

```json
{
  "success": true,
  "message": "Server is healthy"
}
```

### Auth

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
GET /api/auth/google
GET /api/auth/google/callback
```

### URLs

Authenticated routes require:

```http
Authorization: Bearer <token>
```

```http
GET /api/url/my?page=1&limit=10&search=google&sort=createdAt
POST /api/url/shorten
GET /api/url/:shortCode/analytics
GET /api/url/:shortCode/qrcode
DELETE /api/url/:shortCode
```

Create URL body:

```json
{
  "longUrl": "https://example.com",
  "customAlias": "example",
  "expiresIn": "7d"
}
```

Supported expiration options:

```text
1d
7d
30d
```

Public redirect:

```http
GET /:shortCode
```

Expired links return:

```http
410 Gone
```

## Local Installation

Clone the repository:

```bash
git clone https://github.com/dorateja293/URL-Shortener.git
cd URL-Shortener
```

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
OAUTH_SUCCESS_REDIRECT_URL=http://localhost:5173
```

Run backend:

```bash
cd server
npm run dev
```

Run frontend:

```bash
cd client
npm run dev
```

## Production Build

Create `client/.env.production`:

```env
VITE_API_URL=http://65.2.81.212
```

Build frontend:

```bash
cd client
npm run build
```

Upload `client/dist` to the S3 static website bucket.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full EC2, Redis, PM2, Nginx, MongoDB Atlas, S3, Google OAuth, and CORS deployment guide.
