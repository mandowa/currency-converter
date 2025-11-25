// Translations
const translations = {
    en: {
        title: "Currency Converter",
        subtitle: "Live Exchange Rates",
        amount: "Amount",
        from: "From",
        to: "To",
        swapCurrencies: "Swap currencies",
        conversionRate: "Conversion Rate",
        lastUpdated: "Last Updated",
        autoUpdate: "Auto-update (1m)",
        source: "Source",
        sourceBot: "Bank of Taiwan (Mid-Market Rate)",
        sourceMock: "Mock Data",
        updating: "Updating...",
        offlineMode: "Offline Mode (Mock Data)",
        connecting: "Connecting...",
        usdName: "USD - US Dollar",
        eurName: "EUR - Euro",
        gbpName: "GBP - British Pound",
        jpyName: "JPY - Japanese Yen",
        twdName: "TWD - New Taiwan Dollar",
        cnyName: "CNY - Chinese Yuan",
        krwName: "KRW - South Korean Won",
        audName: "AUD - Australian Dollar",
        cadName: "CAD - Canadian Dollar",
        chfName: "CHF - Swiss Franc",
        hkdName: "HKD - Hong Kong Dollar",
        sgdName: "SGD - Singapore Dollar"
    },
    zh: {
        title: "貨幣轉換器",
        subtitle: "即時匯率",
        amount: "金額",
        from: "從",
        to: "到",
        swapCurrencies: "交換貨幣",
        conversionRate: "轉換率",
        lastUpdated: "最後更新",
        autoUpdate: "自動更新 (1分鐘)",
        source: "資料來源",
        sourceBot: "台灣銀行（中間價）",
        sourceMock: "模擬資料",
        updating: "更新中...",
        offlineMode: "離線模式（模擬資料）",
        connecting: "連線中...",
        usdName: "USD - 美元",
        eurName: "EUR - 歐元",
        gbpName: "GBP - 英鎊",
        jpyName: "JPY - 日圓",
        twdName: "TWD - 新台幣",
        cnyName: "CNY - 人民幣",
        krwName: "KRW - 韓元",
        audName: "AUD - 澳幣",
        cadName: "CAD - 加幣",
        chfName: "CHF - 瑞士法郎",
        hkdName: "HKD - 港幣",
        sgdName: "SGD - 新加坡幣"
    }
};

// Get current language from localStorage or default to English
let currentLang = localStorage.getItem('language') || 'en';

// Function to switch language
function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    updateLanguage();
}

// Function to update all text elements based on current language
function updateLanguage() {
    const t = translations[currentLang];

    // Update header
    document.querySelector('h1').textContent = t.title;
    document.querySelector('.subtitle').textContent = t.subtitle;

    // Update labels
    document.querySelector('label[for="amount"]').textContent = t.amount;
    document.querySelector('label[for="from-currency"]').textContent = t.from;
    document.querySelector('label[for="to-currency"]').textContent = t.to;

    // Update swap button aria-label
    document.getElementById('swap-btn').setAttribute('aria-label', t.swapCurrencies);

    // Update currency options
    updateCurrencyOptions();

    // Update footer text
    const autoUpdateText = document.querySelector('.auto-update-text');
    if (autoUpdateText) {
        autoUpdateText.textContent = t.autoUpdate;
    }

    // Update last updated text if it's showing "Updating..." or "Connecting..."
    const lastUpdatedText = lastUpdated.textContent;
    if (lastUpdatedText === translations.en.updating || lastUpdatedText === translations.zh.updating) {
        lastUpdated.textContent = t.updating;
    } else if (lastUpdatedText === translations.en.connecting || lastUpdatedText === translations.zh.connecting) {
        lastUpdated.textContent = t.connecting;
    } else if (lastUpdatedText.includes('Offline Mode') || lastUpdatedText.includes('離線模式')) {
        lastUpdated.textContent = t.offlineMode;
    }

    // Update source text
    const sourceText = document.getElementById('rate-source').textContent;
    if (sourceText.includes('Bank of Taiwan') || sourceText.includes('台灣銀行')) {
        document.getElementById('rate-source').textContent = `${t.source}: ${t.sourceBot} `;
    } else if (sourceText.includes('Mock Data') || sourceText.includes('模擬資料')) {
        document.getElementById('rate-source').textContent = `${t.source}: ${t.sourceMock} `;
    } else if (sourceText.includes('Connecting') || sourceText.includes('連線中')) {
        document.getElementById('rate-source').textContent = `${t.source}: ${t.connecting} `;
    }

    // Update language toggle button text
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.textContent = currentLang === 'en' ? '中' : 'EN';
    }
}

// Function to update currency option text
function updateCurrencyOptions() {
    const t = translations[currentLang];
    const selects = [document.getElementById('from-currency'), document.getElementById('to-currency')];

    selects.forEach(select => {
        Array.from(select.options).forEach(option => {
            const currency = option.value;
            option.textContent = t[currency.toLowerCase() + 'Name'] || option.textContent;
        });
    });
}

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

// Fetch BTC Price
async function fetchBTCPrice() {
    const btcPriceElement = document.getElementById('btc-price');
    if (!btcPriceElement) return;

    try {
        const response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD');
        const data = await response.json();
        
        if (data.USD) {
            const price = data.USD.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2
            });
            btcPriceElement.textContent = price;
            btcPriceElement.style.color = 'var(--primary-color)';
        } else {
            throw new Error('No data');
        }
    } catch (error) {
        console.error('Error fetching BTC price:', error);
        btcPriceElement.textContent = 'Unavailable';
        btcPriceElement.style.color = 'var(--error-color)';
    }
}

// Fetch Exchange Rates from Local Proxy
async function fetchRates() {
    // Fetch BTC price alongside currency rates
    fetchBTCPrice();

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

    resultAmount.textContent = `${result.toFixed(decimals)} ${to} `;
    conversionRate.textContent = `1 ${from} = ${rate.toFixed(4)} ${to} `;
}

function updateLastUpdatedTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastUpdated.textContent = `Last updated: ${timeString} `;
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
        const t = translations[currentLang];
        lastUpdated.textContent = currentLang === 'en' ? 'Auto-update paused' : '自動更新已暫停';
    }
});

// Language toggle event listener
document.getElementById('lang-toggle').addEventListener('click', () => {
    switchLanguage(currentLang === 'en' ? 'zh' : 'en');
});

// Initialize
updateLanguage(); // Set initial language
startAutoUpdate();
