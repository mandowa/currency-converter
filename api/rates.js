const https = require('https');

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

module.exports = async function handler(req, res) {
    console.log(`${req.method} ${req.url}`);

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

        res.status(200).json({
            success: true,
            base: 'TWD',
            date: new Date().toISOString(),
            rates: rates
        });
    } catch (error) {
        console.error('Error fetching rates:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch rates' });
    }
}
