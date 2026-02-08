from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from werkzeug.security import generate_password_hash, check_password_hash
import os
import logging
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
app.logger.setLevel(logging.DEBUG)

# --- Secure Configuration ---
# Point this to the exact location of your downloaded ca-certificate.crt
CA_CERT_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'certs', 'ca-certificate.crt')

# We switch to 'mysqlconnector' for better SSL support with DigitalOcean
app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+mysqlconnector://doadmin:AVNS_E1MUlQ8IweUl4B3L72k@"
    f"db-mysql-nyc3-02019-do-user-33079250-0.j.db.ondigitalocean.com:25060/defaultdb"
    f"?ssl_ca={CA_CERT_PATH}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "super-secure-uga-hacks-key"

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:8081"]}},
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# --- Database Models (Mapping your Whiteboard) ---
class Org(db.Model):
    __tablename__ = 'orgs'
    orgID = db.Column(db.Integer, primary_key=True)
    orgName = db.Column(db.String(100), nullable=False)
    org_email = db.Column(db.String(100))

class User(db.Model):
    __tablename__ = 'users'
    userID = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    hashed_pwd = db.Column(db.String(255), nullable=False)
    uRole = db.Column(db.String(20), default='user')
    orgID = db.Column(db.Integer, db.ForeignKey('orgs.orgID'))

# --- Auth Routes ---

@app.route("/signup", methods=["POST"])
def signup():
    try:
        app.logger.debug("/signup request headers=%s", dict(request.headers))
        data = request.get_json(silent=True)
        app.logger.debug("/signup request json=%s", data)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        required_fields = ["orgName", "email", "password"]
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

        # ... logic for creating Org and Admin User ...
        new_org = Org(orgName=data.get("orgName"), org_email=data.get("email"))
        db.session.add(new_org)
        db.session.flush()

        admin_user = User(
            email=data.get("email"),
            hashed_pwd=generate_password_hash(data.get("password")),
            orgID=new_org.orgID,
            uRole='admin'
        )
        db.session.add(admin_user)
        db.session.commit()
        return jsonify({"msg": "Org and Admin created"}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/signup failed with error")
        return jsonify({"error": str(e)}), 500


@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return ("", 200)

    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        email = data.get("email")
        password = data.get("password")
        if not email or not password:
            return jsonify({"error": "Missing email or password"}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.hashed_pwd, password):
            return jsonify({"error": "Invalid credentials"}), 401

        access_token = create_access_token(identity=user.userID)
        return jsonify({"access_token": access_token, "userID": user.userID}), 200
    except Exception as e:
        app.logger.exception("/login failed with error")
        return jsonify({"error": str(e)}), 500

# Copy your login and dish routes here...

# --- Chatbot Route ---
@app.route("/chatbot", methods=["POST", "OPTIONS"])
def chatbot():
    if request.method == "OPTIONS":
        return ("", 200)
    
    try:
        data = request.get_json(silent=True)
        if not data or 'message' not in data:
            return jsonify({"error": "Missing message field"}), 400
        
        user_message = data.get('message', '').lower()
        response = ''
        
        # AI-powered response logic
        if 'ai' in user_message or 'work' in user_message:
            response = 'Our AI uses advanced machine learning algorithms to analyze your inventory patterns and predict stockouts with 95% accuracy. It continuously learns from your data to provide smarter recommendations! 🧠'
        elif 'pricing' in user_message or 'cost' in user_message or 'price' in user_message:
            response = 'We offer flexible pricing plans starting from $49/month. All plans include AI forecasting, real-time tracking, and 24/7 support. Want to see our full pricing? 💰'
        elif 'trial' in user_message or 'free' in user_message:
            response = 'Great! You can start your free 14-day trial right now - no credit card required. Sign up to get started! 🚀'
        elif 'waste' in user_message:
            response = 'Our platform helps reduce waste by 40% on average through predictive analytics and smart reordering. You\'ll save money and help the environment! 🌱'
        elif 'demo' in user_message:
            response = 'I\'d love to show you a demo! You can book a personalized demo with our team or watch a quick video tour. 🎥'
        elif 'hello' in user_message or 'hi' in user_message or 'hey' in user_message:
            response = 'Hello! 👋 Welcome to StockSense. How can I help you today?'
        elif 'feature' in user_message:
            response = 'StockSense offers AI forecasting, smart reordering, waste analytics, real-time tracking, and automated alerts. What would you like to know more about?'
        elif 'integration' in user_message or 'integrate' in user_message:
            response = 'We integrate with popular POS systems, accounting software, and supply chain management tools. Our API makes it easy to connect with your existing workflow. 🔌'
        elif 'support' in user_message or 'help' in user_message:
            response = 'We offer 24/7 customer support via chat, email, and phone. Plus, you get access to our comprehensive knowledge base and video tutorials. 💬'
        else:
            response = 'That\'s a great question! I recommend chatting with our team for more details. You can start your free trial or contact us directly. 😊'
        
        return jsonify({
            "response": response,
            "timestamp": "just now"
        }), 200
    except Exception as e:
        app.logger.exception("/chatbot failed with error")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)