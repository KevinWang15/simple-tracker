require('dotenv').config();
const express = require('express');
const fileUpload = require('express-fileupload');
const http = require('http');
const path = require('path');
const {modifyTorrent} = require('./torrentUtils');

const app = express();
const PORT = 3000;
const TRACKER_PORT = 6969;
const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

// Create a prefix from APP_URL
const getFilePrefix = () => {
    try {
        const url = new URL(APP_URL);
        return url.hostname
            .replace(/^www\./, '').split(":")[0];
    } catch (error) {
        return 'tracker';
    }
};

// Middleware
app.use(fileUpload({
    limits: {fileSize: 50 * 1024 * 1024}, // 50MB max file size
    preserveExtension: true,
    safeFileNames: true,
    debug: true  // Enable debug logs
}));
app.use(express.static('public'));

// Routes
app.post('/upload', async (req, res) => {
    try {
        if (!req.files || !req.files.torrent) {
            return res.status(400).send('No torrent file uploaded');
        }

        const torrentFile = req.files.torrent;
        const trackerUrl = `${APP_URL}/announce`;

        // Get the original filename from the hidden form field
        const originalName = req.body.originalFilename || torrentFile.name;
        const prefix = getFilePrefix();
        const newFilename = `${prefix}-${originalName}`;

        console.log('Original filename:', originalName);
        console.log('New filename:', newFilename);

        // Modify the torrent
        const newTorrentBuffer = await modifyTorrent(torrentFile.data, trackerUrl);

        // Send the modified torrent file
        res.setHeader('Content-Type', 'application/x-bittorrent');
        res.setHeader('Content-Disposition',
            `attachment; filename="${encodeURIComponent(newFilename)}"; filename*=UTF-8''${encodeURIComponent(newFilename)}`);
        res.send(newTorrentBuffer);
    } catch (error) {
        console.error('Error processing torrent:', error);
        res.status(500).send(`Error processing torrent: ${error.message}`);
    }
});

// Function to get client's real IP
function getClientIP(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return req.socket.remoteAddress;
}

// Function to clean headers
function cleanHeaders(headers) {
    const cleaned = {};
    for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined && value !== null) {
            cleaned[key.toLowerCase()] = value;
        }
    }
    return cleaned;
}

// Tracker proxy
app.all('/announce', (req, res) => {
    const clientIP = getClientIP(req);

    // Clean and prepare headers
    const headers = cleanHeaders({
        ...req.headers,
        'x-forwarded-for': clientIP,
        'x-real-ip': clientIP
    });

    // Don't forward these headers
    delete headers['host'];
    delete headers['connection'];

    const options = {
        hostname: 'tracker',
        port: TRACKER_PORT,
        path: req.url,
        method: req.method,
        headers: headers
    };

    const trackerReq = http.request(options, (trackerRes) => {
        // Copy response headers
        const responseHeaders = cleanHeaders(trackerRes.headers);
        Object.keys(responseHeaders).forEach(key => {
            res.setHeader(key, responseHeaders[key]);
        });

        res.status(trackerRes.statusCode);
        trackerRes.pipe(res);
    });

    trackerReq.on('error', (error) => {
        console.error('Tracker proxy error:', error);
        res.status(502).send('Tracker error');
    });

    // Pipe the request body if it exists
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        req.pipe(trackerReq);
    } else {
        trackerReq.end();
    }
});

app.listen(PORT, () => {
    console.log(`Server running at ${APP_URL}`);
});
