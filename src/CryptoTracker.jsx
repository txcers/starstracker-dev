import { useState, useEffect } from 'react';
import axios from 'axios';
import './CryptoTracker.css';

const CryptoPriceTracker = () => {
  // Состояния
  const [priceData, setPriceData] = useState({
    usdtRub: null,
    starRub: null,
    loading: true,
    error: null,
    lastUpdated: null
  });
  
  const [conversionData, setConversionData] = useState({
    inputValue: '',
    mode: 'rub',
    converted: null,
    fixed: null,
    withCommission: null
  });

  // Константы
  const CONFIG = {
    starPriceUsdt: 0.015,
    fixedStarPrice: 1.6,
    commission: 0.3, // комиссия в USDT
    refreshInterval: 30000
  };

  // Загрузка данных
  const fetchPrice = async () => {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=rub&include_24hr_change=true'
      );
      
      const usdtRub = response.data.tether.rub;
      const starRub = (usdtRub + 2) * CONFIG.starPriceUsdt;
      
      setPriceData({
        usdtRub,
        starRub,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
      
    } catch (error) {
      console.error('Error fetching price:', error);
      setPriceData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch price'
      }));
    }
  };

  // Конвертация значений
  const convertValue = () => {
    const { inputValue, mode } = conversionData;
    const { usdtRub, starRub } = priceData;
    
    if (!inputValue || !starRub) return;
    
    const numericValue = Number(inputValue);
    if (isNaN(numericValue)) return;

    const newData = { 
      converted: (mode === 'rub' 
        ? numericValue / starRub 
        : numericValue * starRub
      ).toFixed(2),
      
      fixed: (mode === 'rub' 
        ? numericValue / CONFIG.fixedStarPrice 
        : numericValue * CONFIG.fixedStarPrice
      ).toFixed(2),
      
      withCommission: mode === 'rub'
        ? ((numericValue - (CONFIG.commission * usdtRub)) / starRub).toFixed(2) // Для RUB → Stars вычитаем комиссию
        : ((numericValue * starRub) + (CONFIG.commission * usdtRub)).toFixed(2) // Для Stars → RUB прибавляем комиссию
    };

    setConversionData(prev => ({ ...prev, ...newData }));
  };

  // Смена режима
  const changeMode = (mode) => {
    setConversionData({
      inputValue: '',
      mode,
      converted: null,
      fixed: null,
      withCommission: null
    });
  };

  // Обработчик изменения инпута
  const handleInputChange = (e) => {
    setConversionData(prev => ({
      ...prev,
      inputValue: e.target.value,
      // Сбрасываем результаты при изменении ввода
      converted: null,
      fixed: null,
      withCommission: null
    }));
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, CONFIG.refreshInterval);
    return () => clearInterval(interval);
  }, []);

  if (priceData.loading) return (
    <div className="loader-container">
      <div className="loader"></div>
      <p>Loading prices...</p>
    </div>
  );

  if (priceData.error) return (
    <div className="error-container">
      <p className="error">{priceData.error}</p>
      <button onClick={fetchPrice}>Retry</button>
    </div>
  );

  const { mode, inputValue, converted, fixed, withCommission } = conversionData;
  const { usdtRub, starRub, lastUpdated } = priceData;
  const commissionInRub = (CONFIG.commission * usdtRub).toFixed(2);

  return (
    <div className="crypto-tracker">
      <header>
        <h1>Star Converter</h1>
        <p className="subtitle">Convert between RUB and Stars</p>
      </header>

      <div className="converter-container">
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === 'rub' ? 'active' : ''}`}
            onClick={() => changeMode('rub')}
          >
            RUB → Stars
          </button>
          <button 
            className={`mode-btn ${mode === 'stars' ? 'active' : ''}`}
            onClick={() => changeMode('stars')}
          >
            Stars → RUB
          </button>
        </div>

        <div className="input-group">
          <input
            placeholder={mode === 'rub' ? 'Amount in RUB...' : 'Amount in Stars...'}
            value={inputValue}
            onChange={handleInputChange}
            type="number"
            className="amount-input"
          />
          <button 
            onClick={convertValue}
            className="convert-btn"
            disabled={!inputValue}
          >
            Convert
          </button>
        </div>

        {converted !== null && (
          <div className="results">
            {mode === 'rub' ? (
              <>
                <div className="result-card">
                  <h3>Market Rate</h3>
                  <p className="result-value">
                    {inputValue} ₽ = <strong>{converted}</strong> stars
                  </p>
                </div>
                
                <div className="result-card commission">
                  <h3>With Commission (0.3 USDT ≈ {commissionInRub}₽)</h3>
                  <p className="result-value">
                    {inputValue} ₽ = <strong>{withCommission}</strong> stars
                  </p>
                </div>
                
                <div className="result-card fixed">
                  <h3>Fixed Rate</h3>
                  <p className="result-value">
                    {inputValue} ₽ = <strong>{fixed}</strong> stars (1.6₽ each)
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="result-card">
                  <h3>Market Rate</h3>
                  <p className="result-value">
                    {inputValue} stars = <strong>{converted}</strong> ₽
                  </p>
                </div>
                
                <div className="result-card commission">
                  <h3>With Commission (0.3 USDT ≈ {commissionInRub}₽)</h3>
                  <p className="result-value">
                    {inputValue} stars = <strong>{withCommission}</strong> ₽
                  </p>
                </div>
                
                <div className="result-card fixed">
                  <h3>Fixed Rate</h3>
                  <p className="result-value">
                    {inputValue} stars = <strong>{fixed}</strong> ₽ (1.6₽ each)
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="price-info">
        <div className="info-card">
          <h3>Current Rates</h3>
          <p>1 USDT = {usdtRub} ₽</p>
          <p>1 Star = {starRub?.toFixed(2)} ₽ (market) | 1.6 ₽ (fixed)</p>
        </div>
        
        {lastUpdated && (
          <p className="timestamp">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default CryptoPriceTracker;