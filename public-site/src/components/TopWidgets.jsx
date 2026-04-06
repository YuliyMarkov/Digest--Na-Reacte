import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/useLanguage";

const WEATHER_CODES = {
  ru: {
    0: "Ясно",
    1: "Ясно",
    2: "Облачно",
    3: "Пасмурно",
    45: "Туман",
    48: "Туман",
    51: "Морось",
    53: "Морось",
    55: "Дождь",
    61: "Дождь",
    63: "Дождь",
    65: "Ливень",
    71: "Снег",
    73: "Снег",
    75: "Снег",
    80: "Ливень",
    81: "Ливень",
    82: "Ливень",
    95: "Гроза",
  },
  uz: {
    0: "Ochiq",
    1: "Ochiq",
    2: "Bulutli",
    3: "Bulutli",
    45: "Tuman",
    48: "Tuman",
    51: "Shabada yomg‘ir",
    53: "Shabada yomg‘ir",
    55: "Yomg‘ir",
    61: "Yomg‘ir",
    63: "Yomg‘ir",
    65: "Jala",
    71: "Qor",
    73: "Qor",
    75: "Qor",
    80: "Jala",
    81: "Jala",
    82: "Kuchli jala",
    95: "Momaqaldiroq",
  },
};

const UZBEKISTAN_CITIES = [
  {
    key: "tashkent",
    name: { ru: "Ташкент", uz: "Toshkent" },
    latitude: 41.3111,
    longitude: 69.2797,
  },
  {
    key: "samarkand",
    name: { ru: "Самарканд", uz: "Samarqand" },
    latitude: 39.6542,
    longitude: 66.9597,
  },
  {
    key: "bukhara",
    name: { ru: "Бухара", uz: "Buxoro" },
    latitude: 39.767,
    longitude: 64.423,
  },
  {
    key: "andijan",
    name: { ru: "Андижан", uz: "Andijon" },
    latitude: 40.7831,
    longitude: 72.3439,
  },
];

function formatRate(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "—";
  return Math.round(number).toLocaleString("ru-RU");
}

function formatDiff(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return null;

  if (number > 0) return { direction: "up", text: `+${number.toFixed(2)}` };
  if (number < 0) return { direction: "down", text: `${number.toFixed(2)}` };

  return { direction: "flat", text: "0.00" };
}

function AnimatedTickerItem({ children, itemKey }) {
  return (
    <div className="ticker-slide-window">
      <div key={itemKey} className="ticker-item ticker-item-animated">
        {children}
      </div>
    </div>
  );
}

function TopWidgets() {
  const { language } = useLanguage();

  const [rates, setRates] = useState([]);
  const [weatherList, setWeatherList] = useState([]);

  const [rateIndex, setRateIndex] = useState(0);
  const [weatherIndex, setWeatherIndex] = useState(0);

  const labels = {
    ru: {
      rates: "КУРС ВАЛЮТ:",
      weather: "ПОГОДА:",
      loadingRates: "Загрузка курсов...",
      loadingWeather: "Загрузка погоды...",
    },
    uz: {
      rates: "VALUTA KURSLARI:",
      weather: "OB-HAVO:",
      loadingRates: "Kurslar yuklanmoqda...",
      loadingWeather: "Ob-havo yuklanmoqda...",
    },
  };

  const t = labels[language] || labels.ru;

  useEffect(() => {
    fetch("https://cbu.uz/ru/arkhiv-kursov-valyut/json/")
      .then((res) => res.json())
      .then((data) => {
        const needed = ["USD", "EUR", "RUB"];
        const filtered = data
          .filter((item) => needed.includes(item.Ccy))
          .sort((a, b) => needed.indexOf(a.Ccy) - needed.indexOf(b.Ccy));

        setRates(filtered);
      })
      .catch(() => setRates([]));
  }, []);

  useEffect(() => {
    Promise.all(
      UZBEKISTAN_CITIES.map(async (city) => {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code&timezone=Asia%2FTashkent`
        );
        const data = await res.json();

        return {
          key: city.key,
          name: city.name,
          temp: data.current?.temperature_2m,
          code: data.current?.weather_code,
        };
      })
    )
      .then(setWeatherList)
      .catch(() => setWeatherList([]));
  }, []);

  useEffect(() => {
    if (rates.length <= 1) return;

    const interval = setInterval(() => {
      setRateIndex((prev) => (prev + 1) % rates.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [rates]);

  useEffect(() => {
    if (weatherList.length <= 1) return;

    const interval = setInterval(() => {
      setWeatherIndex((prev) => (prev + 1) % weatherList.length);
    }, 3200);

    return () => clearInterval(interval);
  }, [weatherList]);

  const rate = useMemo(() => rates[rateIndex], [rates, rateIndex]);
  const weather = useMemo(
    () => weatherList[weatherIndex],
    [weatherList, weatherIndex]
  );

  const diff = rate ? formatDiff(rate.Diff) : null;
  const weatherText =
    weather && weather.code != null
      ? (WEATHER_CODES[language] || WEATHER_CODES.ru)[weather.code] || ""
      : "";

  return (
    <section className="top-ticker">
      <div className="container">
        <div className="top-ticker-inner">
          <div className="ticker-block">
            <span className="ticker-label">
              <span className="label-desktop">{t.rates}</span>
              <span className="label-mobile">💱</span>
            </span>

            <div className="ticker-window">
              {rate ? (
                <AnimatedTickerItem itemKey={`rate-${rate.Ccy}`}>
                  <span className="ticker-badge">{rate.Ccy}</span>
                  <span className="ticker-main">{formatRate(rate.Rate)}</span>

                  {diff && (
                    <span className={`ticker-diff ${diff.direction}`}>
                      {diff.direction === "up" && "▲ "}
                      {diff.direction === "down" && "▼ "}
                      {diff.text}
                    </span>
                  )}
                </AnimatedTickerItem>
              ) : (
                <AnimatedTickerItem itemKey="rate-loading">
                  <span className="ticker-main">{t.loadingRates}</span>
                </AnimatedTickerItem>
              )}
            </div>
          </div>

          <div className="ticker-divider" />

          <div className="ticker-block">
            <span className="ticker-label">
              <span className="label-desktop">{t.weather}</span>
              <span className="label-mobile">🌤</span>
            </span>

            <div className="ticker-window">
              {weather ? (
                <AnimatedTickerItem itemKey={`weather-${weather.key}`}>
                  <span className="ticker-city">
                    {weather.name?.[language] || weather.name?.ru}
                  </span>
                  <span className="ticker-main">
                    {Math.round(weather.temp)}°
                  </span>
                  <span className="ticker-weather-text">{weatherText}</span>
                </AnimatedTickerItem>
              ) : (
                <AnimatedTickerItem itemKey="weather-loading">
                  <span className="ticker-main">{t.loadingWeather}</span>
                </AnimatedTickerItem>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TopWidgets;