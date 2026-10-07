# Calorie Ledger

A dependency-free, mobile-first calorie tracking PWA. All entries and the daily goal are stored only in the browser with `localStorage`.

## Run locally

Service workers require HTTP rather than opening `index.html` directly. From this folder, run:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

To preview on an iPhone on the same Wi-Fi network, run:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Open `http://YOUR-COMPUTER-IP:8080` on the phone. Installation and service workers require HTTPS on a real device, so use the deployed Netlify URL for full PWA testing.

## Deploy to Netlify

Drag this folder into Netlify Drop, or connect the folder's Git repository. There is no build command; set the publish directory to the project root (`.`).
