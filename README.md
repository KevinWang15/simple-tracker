# Simple Tracker

A lightweight private BitTorrent tracker system with torrent modification capabilities. This project consists of two main components:
1. An OpenTracker instance for handling BitTorrent tracker requests
2. A web application for uploading and modifying a torrent to make it belong to this tracker

## Features

- 🔒 Private tracker setup
- 🔄 Automatic torrent modification
   - Sets private flag
   - Disables DHT
   - Updates tracker URL
- 🐳 Full Docker support

## Quick Start

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/KevinWang15/simple-tracker.git
cd simple-tracker
```

2. Create `.env` file:
```bash
APP_URL=http://localhost:3000
```

3. Run with Docker Compose:
```bash
docker-compose up --build
```

4. Visit `http://localhost:3000` in your browser

### Production Deployment

1. Clone the repository:
```bash
git clone https://github.com/KevinWang15/simple-tracker.git
cd simple-tracker
```

2. Create `.env` file with your production settings:
```bash
APP_URL=https://your-domain.com
```

3. Configure ports in docker-compose.prod.yml:
```yaml
services:
  webapp:
    ports:
      - "8080:3000"  # Change 8080 to any port you want to use on your host machine
    # ... other settings ...
```

4. Set up Nginx as a reverse proxy:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/your/fullchain.pem;
    ssl_certificate_key /path/to/your/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;  # Use the port you configured in docker-compose.prod.yml
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

5. Run using production compose file:
```bash
docker-compose -f docker-compose.prod.yml up -d
```


## License

This project is licensed under the MIT License
