const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('from-currency');
const toCurrency = document.getElementById('to-currency');
const swapBtn = document.getElementById('swap-btn');
const resultAmount = document.getElementById('result-amount');
const conversionRate = document.getElementById('conversion-rate');
const lastUpdated = document.getElementById('last-updated');
const autoUpdateToggle = document.getElementById('auto-update');

let exchangeRates = {};
let updateInterval;

// Mock Data for Offline Mode
function useMockRates() {
    console.log('Using mock rates');
    exchangeRates = {
        'USD': 32.5,
        'EUR': 35.2,
        'GBP': 41.8,
        'JPY': 0.21,
        'TWD': 1,
        'CNY': 4.5,
        'KRW': 0.024,
        'AUD': 21.5,
        'CAD': 23.8,
        'CHF': 36.5,
        'HKD': 4.15,
        'SGD': 24.2
    };

    updateUI();

    lastUpdated.textContent = 'Offline Mode';
    lastUpdated.style.color = '#f59e0b'; // Amber color

    document.getElementById('rate-source').textContent = 'Source: Mock Data';
}

// Fetch Exchange Rates from Local Proxy
async function fetchRates() {
    try {
        const response = await fetch('/api/rates');
        const data = await response.json();

        if (data.success) {
            exchangeRates = data.rates;
            // Ensure TWD is in the rates
            if (!exchangeRates['TWD']) exchangeRates['TWD'] = 1;

            updateUI();
            updateLastUpdatedTime();
            document.getElementById('rate-source').textContent = 'Source: Bank of Taiwan (Mid-Market Rate)';
        } else {
            console.error('Error fetching rates:', data);
            useMockRates();
        }
    } catch (error) {
        console.error('Network error:', error);
        useMockRates();
    }
}

// Calculate and Update UI
function updateUI() {
    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (isNaN(amount)) {
        resultAmount.textContent = '0.00';
        return;
    }

    // Rates are all relative to TWD (1 Unit = X TWD)
    // To convert From -> To:
    // Amount * (FromRate / ToRate)
    // Example: 1 USD (32.5 TWD) -> JPY (0.21 TWD)
    // 1 * (32.5 / 0.21) = 154.76 JPY

    const fromRate = exchangeRates[from];
    const toRate = exchangeRates[to];

    if (!fromRate || !toRate) {
        resultAmount.textContent = '---';
        conversionRate.textContent = 'Rate unavailable';
        return;
    }

    const rate = fromRate / toRate;
    const result = amount * rate;

    // Format result based on currency (JPY usually 0 decimals, others 2)
    const decimals = (to === 'JPY' || to === 'KRW' || to === 'VND') ? 0 : 2;

    resultAmount.textContent = `${result.toFixed(decimals)} ${to}`;
    conversionRate.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
}

function updateLastUpdatedTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastUpdated.textContent = `Last updated: ${timeString}`;
    lastUpdated.style.color = 'var(--text-light)';

    // Reset animation
    const dot = document.querySelector('.dot');
    dot.style.animation = 'none';
    dot.offsetHeight; /* trigger reflow */
    dot.style.animation = 'pulse 2s infinite';
}

// Event Listeners
amountInput.addEventListener('input', updateUI);
fromCurrency.addEventListener('change', updateUI);
toCurrency.addEventListener('change', updateUI);

swapBtn.addEventListener('click', () => {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;

    // Add rotation animation class temporarily
    swapBtn.style.transform = 'rotate(180deg)';
    setTimeout(() => {
        swapBtn.style.transform = 'rotate(0deg)';
    }, 300);

    updateUI();
});

// Auto Update Logic
function startAutoUpdate() {
    // Initial fetch
    fetchRates();

    // Clear existing interval if any
    if (updateInterval) clearInterval(updateInterval);

    // Set new interval (60000ms = 1 minute)
    updateInterval = setInterval(() => {
        if (autoUpdateToggle.checked) {
            fetchRates();
        }
    }, 60000);
}

autoUpdateToggle.addEventListener('change', () => {
    if (autoUpdateToggle.checked) {
        startAutoUpdate();
    } else {
        if (updateInterval) clearInterval(updateInterval);
        lastUpdated.textContent = 'Auto-update paused';
    }
});

// Initialize
startAutoUpdate();
