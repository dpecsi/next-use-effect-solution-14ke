"use client";

import dayjs from "dayjs";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// --- Konstans adatok ---
// Ezek NEM állapotok, mert soha nem változnak. A komponens FÖLÖTT vannak,
// így nem keletkeznek újra minden rendereléskor.
type City = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

const CITIES: City[] = [
  { id: "gy", label: "Győr", latitude: 47.6875, longitude: 17.6504 },
  { id: "bp", label: "Budapest", latitude: 47.4979, longitude: 19.0402 },
  { id: "db", label: "Debrecen", latitude: 47.5316, longitude: 21.6273 },
  { id: "sz", label: "Szeged", latitude: 46.253, longitude: 20.1414 },
  { id: "pe", label: "Pécs", latitude: 46.0727, longitude: 18.2323 },
];

// WMO időjárás-kódok. Ugyanolyan objektum-tömb, mint a városoké: a codes tömbben vannak
// azok a kódok, amikhez ugyanaz a felirat és ikon tartozik.
type WeatherInfo = {
  codes: number[];
  label: string;
  icon: string;
};

const WEATHER: WeatherInfo[] = [
  { codes: [0], label: "Derült", icon: "☀️" },
  { codes: [1, 2], label: "Részben felhős", icon: "⛅" },
  { codes: [3], label: "Felhős", icon: "☁" },
  { codes: [45, 48], label: "Ködös", icon: "🌫️" },
  { codes: [51, 53, 55], label: "Szitálás", icon: "🌦️" },
  { codes: [61, 63, 65], label: "Esős", icon: "🌧️" },
  { codes: [71, 73, 75], label: "Havazás", icon: "🌨️" },
  { codes: [80, 81, 82], label: "Zápor", icon: "🌦️" },
  { codes: [95], label: "Zivatar", icon: "⛈️" },
];

// Tartalék érték, ha az API olyan kódot ad vissza, ami nincs a fenti listában.
const UNKNOWN_WEATHER: WeatherInfo = { codes: [], label: "Ismeretlen", icon: "❓" };

// Az API válaszának minket érdeklő része (response.data.current)
type CurrentWeather = {
  time: string;
  temperature_2m: number;
  wind_speed_10m: number;
  weather_code: number;
};

export default function HomePage() {
  const [clock, setClock] = useState<Date | null>(null);
  useEffect(() => {
    const intervalId = setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);
  return (
    <main className="flex min-h-screen justify-center bg-gray-100 p-4">
      <div className="w-full max-w-lg self-start rounded-2xl bg-white p-6 shadow-xl">
        {/* Fejléc */}
        <header className="text-center">
          <h1 className="text-3xl text-gray-500">⛅ Időjárás Jelentés</h1>
          <p className="text-gray-500">{clock ? clock.toLocaleTimeString("hu-HU") : "--:--:--"}</p>
        </header>
      </div>
    </main>
  );
}
