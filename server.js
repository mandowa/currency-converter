const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

function fetchBOTRates() {
    return new Promise((resolve, reject) => {
        const url = 'https://rate.bot.com.tw/xrt/flcsv/0/day';
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', (err) => reject(err));
    });
}

function parseCSVLine(line) {
    return line.split(',');
}

const server = http.createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);

    if (req.url === '/api/rates') {
        try {
            const csvData = await fetchBOTRates();
            const lines = csvData.split('\n');
            const rates = {};
            rates['TWD'] = 1;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const parts = parseCSVLine(line);
                if (parts.length < 14) continue;

                const currency = parts[0];

                // Try Spot Rates first (Buy: index 3, Sell: index 13)
                let buyRate = parseFloat(parts[3]);
                let sellRate = parseFloat(parts[13]);

                // If Spot rates are invalid, try Cash Rates (Buy: index 2, Sell: index 12)
                if (isNaN(buyRate) || buyRate === 0 || isNaN(sellRate) || sellRate === 0) {
                    buyRate = parseFloat(parts[2]);
                    sellRate = parseFloat(parts[12]);
                }

                // Calculate Mid-Market Rate
                if (!isNaN(buyRate) && buyRate > 0 && !isNaN(sellRate) && sellRate > 0) {
                    const midRate = (buyRate + sellRate) / 2;
                    rates[currency] = midRate;
                }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                base: 'TWD',
                date: new Date().toISOString(),
                rates: rates
            }));
        } catch (error) {
            console.error('Error fetching rates:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Failed to fetch rates' }));
        }
        return;
    }

    // Static File Serving
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('500 Internal Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});
