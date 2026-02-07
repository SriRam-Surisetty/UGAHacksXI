from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager

app = Flask(__name__)

# Setup the Flask-JWT-Extended extension
app.config["JWT_SECRET_KEY"] = "super-secret-key"  # Change this!
jwt = JWTManager(app)

CORS(app)

# In-memory user storage (for demo purposes)
users = {
    "test": "test"
}

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"message": "Hello from Flask backend!"})

@app.route("/login", methods=["POST"])
def login():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    
    # Check against in-memory users
    if username not in users or users[username] != password:
        return jsonify({"msg": "Bad username or password"}), 401

    access_token = create_access_token(identity=username)
    return jsonify(access_token=access_token)

@app.route("/signup", methods=["POST"])
def signup():
    username = request.json.get("username", None)
    password = request.json.get("password", None)

    if not username or not password:
        return jsonify({"msg": "Username and password required"}), 400

    if username in users:
        return jsonify({"msg": "Username already exists"}), 400

    users[username] = password
    
    # Auto-login after signup
    access_token = create_access_token(identity=username)
    return jsonify(access_token=access_token, msg="User created successfully"), 201

@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    # Access the identity of the current user with get_jwt_identity
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
