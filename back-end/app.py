from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)

# --- Configuration ---
# Replace with your MySQL password from the installer
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:dawg@localhost/dish_app"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "change-this-to-a-secure-key" 

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

# --- Database Models (Mapping your Whiteboard) ---
class Org(db.Model):
    __tablename__ = 'Orgs'
    orgID = db.Column(db.Integer, primary_key=True)
    orgName = db.Column(db.String(100), nullable=False)
    org_email = db.Column(db.String(100))

class User(db.Model):
    __tablename__ = 'Users'
    userID = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    hashed_pwd = db.Column(db.String(255), nullable=False)
    uRole = db.Column(db.String(20), default='user') # 'admin' or 'user'
    orgID = db.Column(db.Integer, db.ForeignKey('Orgs.orgID'))

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Backend is running!"}), 200

# --- Auth Routes ---

@app.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Missing JSON data"}), 400

        org_name = data.get("orgName")
        username = data.get("username")
        password = data.get("password")
        email = data.get("email")

        if not org_name or not username or not password:
            return jsonify({"msg": "Missing required fields: orgName, username, and password"}), 400

        # Check if username exists BEFORE creating the organization
        if User.query.filter_by(username=username).first():
            return jsonify({"msg": "Username already exists"}), 400

        # 1. Create the Org
        new_org = Org(orgName=org_name, org_email=email)
        db.session.add(new_org)
        db.session.flush() # This generates the orgID without committing yet

        # 2. Create the Admin User
        admin_user = User(
            username=username,
            hashed_pwd=generate_password_hash(password),
            orgID=new_org.orgID,
            uRole='admin'
        )
        
        db.session.add(admin_user)
        db.session.commit()

        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token, orgID=new_org.orgID), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get("username")).first()

    if user and check_password_hash(user.hashed_pwd, data.get("password")):
        access_token = create_access_token(identity=user.username)
        return jsonify(access_token=access_token), 200
    
    return jsonify({"msg": "Invalid credentials"}), 401

# --- Dish Routes ---

@app.route("/api/dishes", methods=["GET"])
@jwt_required()
def get_my_dishes():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()
    
    # Query to get all dishes for the user's organization
    query = """
        SELECT d.dishID, d.dishName 
        FROM Dishes d 
        WHERE d.orgID = :org_id
    """
    result = db.session.execute(db.text(query), {"org_id": user.orgID})
    dishes = [dict(row._mapping) for row in result]
    
    return jsonify(dishes), 200

@app.route("/api/org/add-user", methods=["POST"])
@jwt_required()
def add_user_to_org():
    current_username = get_jwt_identity()
    admin = User.query.filter_by(username=current_username).first()

    # Cybersecurity check: only admins can add users
    if admin.uRole != 'admin':
        return jsonify({"msg": "Unauthorized. Admins only."}), 403

    data = request.get_json()
    new_username = data.get("username")
    new_password = data.get("password")

    if User.query.filter_by(username=new_username).first():
        return jsonify({"msg": "User already exists"}), 400

    new_employee = User(
        username=new_username,
        hashed_pwd=generate_password_hash(new_password),
        orgID=admin.orgID, # Link them to the same org as the admin
        uRole='user'
    )

    db.session.add(new_employee)
    db.session.commit()
    return jsonify({"msg": f"User {new_username} added to {admin.orgID}"}), 201

if __name__ == '__main__':
    # Using 5001 as per your current setup
    app.run(host='0.0.0.0', port=5001, debug=True)