# Team Tracker VirtualIntern

A polished Flask web dashboard for tracking team member availability with a clean glassmorphism UI and real-time updates.

## Overview
This project provides a simple team availability tracker with a Flask backend, a lightweight SQLite database, and a modern front-end experience.

Users can:
- view current availability status for each team member
- toggle availability on and off
- track activity history automatically

## Quick Start
1. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
2. Install required packages:
   ```powershell
   pip install -r requirements.txt
   ```
3. Start the application:
   ```powershell
   python app.py
   ```
4. Open `http://127.0.0.1:5000/` in your browser.

## Project Structure
- `app.py` – Flask server, API endpoints, and database initialization.
- `templates/index.html` – dashboard HTML layout.
- `static/style.css` – styling and glassmorphism design.
- `static/app.js` – client-side interaction and API requests.
- `requirements.txt` – Python dependencies.

## How It Works
- Flask serves the dashboard and API routes.
- SQLite stores team member data and activity logs.
- The UI loads team members from the backend and updates availability with AJAX calls.

## Contributing
If you want to contribute to this repository, use a simple one-change-per-commit workflow:

Contribution ideas:
- Fix bugs and improve core tracker behavior.

1. Create a new branch:
   ```powershell
   git checkout -b feature/<short-description>
   ```
2. Make a small, focused change.
3. Stage the change:
   ```powershell
   git add .
   ```
4. Commit with a clear message:
   ```powershell
   git commit -m "Add <feature> or Fix <issue>"
   ```
5. Push the branch to GitHub:
   ```powershell
   git push origin feature/<short-description>
   ```
6. Open a pull request on GitHub and describe the change clearly.

## Push Changes to GitHub
After making each change and committing it, push your branch separately so each update is tracked one by one:

```powershell
git push origin feature/<short-description>
```

Then create a pull request for review.

## License
MIT License. Feel free to use, update, and improve this repository.
