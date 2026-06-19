<div align="center">

# 🎬 Film Roulette

![Language](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)
![Deploy](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)

*Roll the dice, find your movie. A random movie discovery app powered by TMDB.*

**[🌐 Live Demo](https://filmroulette.vercel.app)**

</div>

---

## 📌 Overview

Film Roulette helps you find something to watch when you can't decide. Set your filters — genre, year range, language, minimum rating — and roll the dice for a random movie recommendation. No signup, no ads, just cinema.

---

## ✨ Features

| # | Feature | Description |
|---|---|---|
| 1 | **Genre Filter** | Choose from 19 genres including Action, Drama, Horror, and Sci-Fi |
| 2 | **Year Range** | Narrow results to a custom release year range (1927–present) |
| 3 | **Language Filter** | Filter by original language (English, Turkish, Korean, and more) |
| 4 | **Minimum Rating** | Set a quality threshold from "Risky" to "Masterpiece" |
| 5 | **Roll the Dice** | Get a random movie matching your filters in one click |
| 6 | **Multi-language UI** | Available in English, Azerbaijani, and Russian |

---

## 🧠 Tech Stack

- **[Next.js](https://nextjs.org)** — App Router architecture
- **TypeScript** — type-safe components and logic
- **[TMDB API](https://www.themoviedb.org/documentation/api)** — movie data source
- **[Geist Font](https://vercel.com/font)** — via `next/font` optimization
- **Vercel** — hosting and deployment

---

## 🔧 Getting Started

**Requirements:** Node.js, npm/yarn/pnpm/bun

```bash
# Clone the repository
git clone https://github.com/Ibrmustafayev/film-roulette.git
cd film-roulette

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

---

## 📁 Structure

```
film-roulette/
├── app/
│   └── page.tsx     # Main page — edit here for live updates
├── public/
└── README.md
```

---

## 🚀 Deployment

Deployed on [Vercel](https://vercel.com), the platform built by the creators of Next.js. See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 📜 License

Released under the [MIT License](LICENSE).
