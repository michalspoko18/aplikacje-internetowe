const API_KEY =
  window.ENV && window.ENV.WEATHER_API_KEY ? window.ENV.WEATHER_API_KEY : "";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const currentContent = document.getElementById("currentContent");
const forecastContent = document.getElementById("forecastContent");
const currentLoader = document.getElementById("currentLoader");
const forecastLoader = document.getElementById("forecastLoader");
const statusBar = document.getElementById("statusBar");
const errorBox = document.getElementById("errorBox");
const cityInput = document.getElementById("cityInput");
const weatherBtn = document.getElementById("weatherBtn");
const exampleBtn = document.getElementById("exampleBtn");

function setStatus(parts) {
  statusBar.innerHTML = parts
    .map(
      (p) =>
        `<span class="status-chip ${p.ok === false ? "fail" : "ok"}">${
          p.label
        }: ${p.value}</span>`
    )
    .join("");
}
function showError(msg) {
  errorBox.hidden = false;
  errorBox.textContent = msg;
}
function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
}
function toggleLoaders(c, bool) {
  c.hidden = !bool;
}

function fetchCurrentWeatherXHR(city) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/weather?q=${encodeURIComponent(
      city
    )}&appid=${API_KEY}&units=metric&lang=pl`;
    const t0 = performance.now();
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        const t1 = performance.now();
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            console.log("WEATHER RAW", data);
            resolve({ data, duration: (t1 - t0) | 0 });
          } catch (e) {
            reject(new Error("Błąd parsowania odpowiedzi WEATHER"));
          }
        } else reject(new Error("Błąd żądania WEATHER: " + xhr.status));
      }
    };
    xhr.onerror = () => reject(new Error("Błąd sieci WEATHER"));
    xhr.send();
  });
}

function fetchForecastFetch(city) {
  const url = `${BASE_URL}/forecast?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric&lang=pl`;
  const t0 = performance.now();
  return fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error("Błąd żądania FORECAST: " + r.status);
      return r.json();
    })
    .then((data) => {
      const t1 = performance.now();
      console.log("FORECAST RAW", data);
      return { data, duration: (t1 - t0) | 0 };
    });
}

function renderCurrent(json) {
  if (!json) {
    currentContent.innerHTML = "";
    return;
  }
  const w = json.weather && json.weather[0] ? json.weather[0] : {};
  currentContent.innerHTML = `<div class="weather-card">
		<div class="weather-head"><span>${json.name}, ${
    json.sys?.country || ""
  }</span><span>${w.main || ""}</span></div>
		<div class="weather-temp">${Math.round(json.main?.temp)}°C</div>
		<div class="weather-extra">
			<div class="badge">Odczuwalna: ${Math.round(json.main?.feels_like)}°C</div>
			<div class="badge">Min: ${Math.round(json.main?.temp_min)}°C</div>
			<div class="badge">Max: ${Math.round(json.main?.temp_max)}°C</div>
			<div class="badge">Wilgotność: ${json.main?.humidity}%</div>
			<div class="badge">Ciśnienie: ${json.main?.pressure} hPa</div>
			<div class="badge">Wiatr: ${json.wind?.speed} m/s</div>
			<div class="badge">${w.description || ""}</div>
		</div>
	</div>`;
}

class WeatherTable {
  constructor(list) {
    this.list = Array.isArray(list) ? list : [];
  }
  toHTML() {
    if (!this.list.length) return "<p>Brak danych prognozy.</p>";
    const rows = [];
    let lastDay = "";
    for (const item of this.list) {
      const dt = item.dt_txt || "";
      const day = dt.split(" ")[0];
      if (day !== lastDay) {
        rows.push(`<tr class="day-sep"><td colspan="6">${day}</td></tr>`);
        lastDay = day;
      }
      rows.push(`<tr>
				<td>${dt.split(" ")[1] || ""}</td>
				<td>${Math.round(item.main.temp)}°C</td>
				<td>${Math.round(item.main.feels_like)}°C</td>
				<td>${item.weather?.[0]?.main || ""}</td>
				<td>${item.weather?.[0]?.description || ""}</td>
				<td>${item.wind?.speed || ""} m/s</td>
			</tr>`);
    }
    return `<table class="forecast"><thead><tr><th>Godz</th><th>Temp</th><th>Odcz</th><th>Stan</th><th>Opis</th><th>Wiatr</th></tr></thead><tbody>${rows.join(
      ""
    )}</tbody></table>`;
  }
}

function renderForecast(json) {
  if (!json) {
    forecastContent.innerHTML = "";
    return;
  }
  const table = new WeatherTable(json.list);
  forecastContent.innerHTML = table.toHTML();
}

async function loadWeather() {
  clearError();
  setStatus([{ label: "INFO", value: "Ładowanie...", ok: true }]);
  const city = cityInput.value.trim();
  if (!city) {
    showError("Podaj nazwę miejscowości");
    setStatus([{ label: "BŁĄD", value: "Brak miasta", ok: false }]);
    return;
  }
  toggleLoaders(currentLoader, true);
  toggleLoaders(forecastLoader, true);
  currentContent.innerHTML = "";
  forecastContent.innerHTML = "";
  try {
    const [current, forecast] = await Promise.all([
      fetchCurrentWeatherXHR(city),
      fetchForecastFetch(city),
    ]);
    renderCurrent(current.data);
    renderForecast(forecast.data);
    setStatus([
      { label: "WEATHER XHR(ms)", value: current.duration, ok: true },
      { label: "FORECAST FETCH(ms)", value: forecast.duration, ok: true },
      { label: "MIASTO", value: city, ok: true },
    ]);
  } catch (e) {
    showError(e.message);
    setStatus([{ label: "BŁĄD", value: e.message, ok: false }]);
  } finally {
    toggleLoaders(currentLoader, false);
    toggleLoaders(forecastLoader, false);
  }
}

weatherBtn.addEventListener("click", loadWeather);
exampleBtn.addEventListener("click", () => {
  cityInput.value = "Szczecin";
  loadWeather();
});
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    loadWeather();
  }
});

if (!API_KEY) {
  showError("Brak klucza API. Utwórz plik env.js z window.ENV.WEATHER_API_KEY");
  setStatus([{ label: "BŁĄD", value: "Brak API key", ok: false }]);
  weatherBtn.disabled = true;
  exampleBtn.disabled = true;
} else {
  setStatus([
    { label: "READY", value: "Wpisz miasto i kliknij Pogoda", ok: true },
  ]);
}
