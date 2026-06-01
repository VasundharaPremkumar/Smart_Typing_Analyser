import os
import pickle
from flask import Flask, render_template, request, jsonify, redirect, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, text

app = Flask(__name__)
app.secret_key = "typeai_secret"

# DB Config: Preferred MySQL, SQLite fallback
mysql_uri = os.environ.get('DATABASE_URL', 'mysql+pymysql://root:password@localhost/typing_analyser')
sqlite_uri = 'sqlite:///typing.db'

try:
    base_uri = 'mysql+pymysql://root:password@localhost/'
    temp_engine = create_engine(base_uri)
    with temp_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT").execute(text("CREATE DATABASE IF NOT EXISTS typing_analyser"))
    
    app.config['SQLALCHEMY_DATABASE_URI'] = mysql_uri
    engine = create_engine(mysql_uri)
    with engine.connect() as conn:
        pass
    print("Database: Using MySQL successfully.")
except Exception as e:
    print(f"MySQL connection/creation failed: {e}. Falling back to SQLite.")
    app.config['SQLALCHEMY_DATABASE_URI'] = sqlite_uri

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# DATABASE MODELS
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)

class TypingHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    wpm = db.Column(db.Integer, nullable=False)
    accuracy = db.Column(db.Integer, nullable=False)
    mistakes = db.Column(db.Integer, nullable=False)
    backspaces = db.Column(db.Integer, nullable=False)
    level = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())

    user = db.relationship('User', backref=db.backref('history', lazy=True))

# Load ML Model (Random Forest Classifier)
try:
    with open('model.pkl', 'rb') as f:
        ml_model = pickle.load(f)
    print("ML Model loaded successfully!")
except Exception as e:
    ml_model = None
    print(f"Error loading model.pkl: {e}. Fallback heuristics will be used.")

# ROUTES
@app.route('/')
def landing():
    return render_template('landing.html') or "Welcome to TypeAI. Please go to /auth"

@app.route('/auth')
def auth():
    return render_template('auth.html') or "Auth Page Wrapper Placeholder"

@app.route('/dashboard')
def dashboard():
    username = session.get('username')
    if not username:
        return redirect('/auth')
    return render_template('dashboard.html', username=username)

# REGISTER API
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name')
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "message": "Missing arguments"})

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"success": False, "message": "Username already exists"})

    new_user = User(name=name, username=username, password=password)
    db.session.add(new_user)
    db.session.commit()
    session['username'] = name
    return jsonify({"success": True, "name": name})

# LOGIN API
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username, password=password).first()
    if user:
        session['username'] = user.name
        return jsonify({"success": True, "name": user.name})
    return jsonify({"success": False, "message": "Invalid username or password"})

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

# ML PREDICT API
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json() or {}
    wpm = int(data.get('wpm', 0))
    accuracy = int(data.get('accuracy', 0))
    mistakes = int(data.get('mistakes', 0))
    backspaces = int(data.get('backspaces', 0))

    if ml_model:
        try:
            prediction = ml_model.predict([[wpm, accuracy, mistakes, backspaces]])
            predicted_level = prediction[0]
            return jsonify({"level": predicted_level})
        except Exception as e:
            print(f"ML Prediction Error: {e}")
    
    # Advanced Heuristic standard fallback
    level = "Beginner"
    if wpm >= 65 and accuracy >= 92:
        level = "Advanced"
    elif wpm >= 40 and accuracy >= 80:
        level = "Intermediate"
    return jsonify({"level": level})

# SAVE HISTORY API
@app.route('/api/history', methods=['POST'])
def save_history():
    username = session.get('username')
    if not username:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    user = User.query.filter_by(name=username).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    data = request.get_json() or {}
    wpm = int(data.get('wpm', 0))
    accuracy = int(data.get('accuracy', 0))
    mistakes = int(data.get('mistakes', 0))
    backspaces = int(data.get('backspaces', 0))
    level = data.get('level', 'Beginner')

    history_record = TypingHistory(
        user_id=user.id,
        wpm=wpm,
        accuracy=accuracy,
        mistakes=mistakes,
        backspaces=backspaces,
        level=level
    )
    db.session.add(history_record)
    db.session.commit()
    return jsonify({"success": True})

# GET HISTORY API
@app.route('/api/history', methods=['GET'])
def get_history():
    username = session.get('username')
    if not username:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    user = User.query.filter_by(name=username).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    history = TypingHistory.query.filter_by(user_id=user.id).order_by(TypingHistory.timestamp.asc()).all()
    history_list = [{
        "wpm": h.wpm,
        "accuracy": h.accuracy,
        "mistakes": h.mistakes,
        "backspaces": h.backspaces,
        "level": h.level,
        "timestamp": h.timestamp.strftime('%Y-%m-%d %H:%M:%S')
    } for h in history]

    return jsonify({"success": True, "history": history_list})

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)