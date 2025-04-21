from flask import Flask, send_from_directory, jsonify, request
import random, os, json
from datetime import date

app = Flask(__name__, static_folder='.', static_url_path='')

def get_numbers_file(year):
    return f'/data/numbers_{year}.txt'

HISTORY_FILE = '/data/history.json'

def load_numbers(year):
    path = get_numbers_file(year)
    if not os.path.exists(path):
        with open(path, 'w') as f:
            f.write('\n'.join(str(i) for i in range(1, 101)))
    with open(path, 'r') as f:
        return [int(line.strip()) for line in f if line.strip()]

def save_numbers(year, numbers):
    path = get_numbers_file(year)
    with open(path, 'w') as f:
        for num in numbers:
            f.write(f"{num}\n")

def load_history():
    if not os.path.exists(HISTORY_FILE):
        return {}
    with open(HISTORY_FILE, 'r') as f:
        return json.load(f)

def save_history(history):
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/pick', methods=['POST'])
def pick_numbers():
    week = request.args.get('week') or get_week_key()
    history = load_history()

    if week in history:
        return jsonify({'error': f'Numbers already picked for {week}.'}), 400

    year = week.split("-W")[0]
    yearly_picks = [k for k in history if k.startswith(f"{year}-W")]
    if len(yearly_picks) >= 50:
        return jsonify({'error': f'Year {year} already has 50 picks. Limit reached.'}), 400

    numbers = load_numbers(year)
    if len(numbers) < 2:
        return jsonify({'error': 'Not enough numbers left.'}), 400

    chosen = random.sample(numbers, 2)
    remaining = [n for n in numbers if n not in chosen]
    save_numbers(year, remaining)

    history[week] = [chosen]
    save_history(history)

    return jsonify({'picked': chosen, 'remaining': len(remaining), 'week': week})

def get_week_key():
    today = date.today()
    y, w, _ = today.isocalendar()
    return f"{y}-W{w:02d}"

@app.route('/history', methods=['GET'])
def get_history():
    year_str = request.args.get('year')
    try:
        year = int(year_str)
    except (ValueError, TypeError):
        year = None

    history = load_history()
    if year:
        return jsonify({k: v for k, v in history.items() if k.startswith(f"{year}-W")})
    return jsonify(history)

@app.route('/available-weeks', methods=['GET'])
def get_available_weeks():
    year_str = request.args.get('year')
    try:
        year = int(year_str)
    except (ValueError, TypeError):
        year = date.today().year

    history = load_history()
    today = date.today()
    is_current_year = year == today.year
    max_week = today.isocalendar().week if is_current_year else 52

    available = []
    for week in range(1, max_week + 1):
        wk = f"{year}-W{week:02d}"
        if wk not in history:
            available.append(wk)
    return jsonify(available)

@app.route('/summary', methods=['GET'])
def get_summary():
    year_str = request.args.get('year')
    try:
        year = int(year_str)
    except (ValueError, TypeError):
        year = None

    history = load_history()
    if year:
        year_history = {k: v for k, v in history.items() if k.startswith(f"{year}-W")}
    else:
        year_history = history

    all_numbers = [n for picks in year_history.values() for pair in picks for n in pair]
    total_sum = sum(all_numbers)
    weekly_totals = {week: sum(n for pair in picks for n in pair) for week, picks in year_history.items()}
    return jsonify({'sum': total_sum, 'count': len(all_numbers), 'weekly_totals': weekly_totals})

@app.route('/admin/add-pick', methods=['POST'])
def admin_add_pick():
    data = request.get_json()
    week = data.get('week')
    numbers = data.get('numbers')

    if not week or not isinstance(numbers, list) or len(numbers) != 2:
        return jsonify({'error': 'Invalid input'}), 400

    year = int(week.split("-W")[0])
    history = load_history()
    numbers_pool = load_numbers(year)

    if week in history:
        return jsonify({'error': f'Numbers already picked for {week}.'}), 400
    
    for n in numbers:
        if n not in numbers_pool:
            return jsonify({'error': f'Number {n} already picked or invalid.'}), 400

    if week not in history:
        history[week] = []
    history[week].append(numbers)
    save_history(history)

    updated_pool = [n for n in numbers_pool if n not in numbers]
    save_numbers(year, updated_pool)

    return jsonify({'message': f'Pick {numbers} added for {week}.'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
