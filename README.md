# 💸 Savings Envelopes

[![CI](https://github.com/tuxpreacher/savings-envelopes/actions/workflows/ci.yml/badge.svg)](https://github.com/tuxpreacher/savings-envelopes/actions/workflows/ci.yml)

**Savings Envelopes** is a web-based app that helps you save money each week by randomly selecting two numbers from a pool of 100. You get 50 picks per year — and once picked, numbers are gone! Tracks history, shows charts, and celebrates milestones. 🥳

![screenshot](docs/screenshot.png)

---

## ✨ Features

- 🎲 Pick 2 random numbers per week (max 50/year)
- 📆 Year/week selection with filters
- 📊 Weekly totals chart with highest/lowest highlights
- 💰 Running savings sum + progress bar
- 🛠️ Admin import tool for manual entries
- 🎉 Confetti celebration when the year is full!
- 💾 Persistent storage with per-year number pools
- 🧧 Favicon with dollar envelope
- 💡 Designed with clean HTML/CSS and no JS frameworks

---

## 🚀 Getting Started

### 🐳 With Docker Compose

```bash
git clone https://github.com/tuxpreacher/savings-envelopes.git
cd savings-envelopes
docker-compose up --build
```

Visit: [http://localhost:8080](http://localhost:8080)

---

## 🐧 Podman Support

```bash
podman-compose up --build
```

---

## 🗂️ Project Structure

```shell
app/
  ├── index.html       # Frontend UI
  ├── script.js        # UI logic
  ├── server.py        # Flask backend
  ├── favicon.ico      # Envelope 💸
data/
  ├── history.json     # Saved picks
  └── numbers_2025.txt # Pool of available numbers (per year)
```

---

## 🔧 Development

- Python 3.11
- Flask
- Chart.js + Canvas Confetti
- No frontend build step

---

## 🧪 Tests & CI

This repo includes GitHub Actions for:

- ✅ Linting Python with `flake8`
- ✅ Validating JSON and HTML structure

See `.github/workflows/ci.yml`.

---

## 📄 License

GPL-3.0 © Jason
