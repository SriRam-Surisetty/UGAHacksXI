from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, or_, and_
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from werkzeug.security import generate_password_hash, check_password_hash
import os
import io
import csv
import logging
from dotenv import load_dotenv
from datetime import datetime
from decimal import Decimal, InvalidOperation

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

# --- JWT Debug Handlers ---
@jwt.unauthorized_loader
def jwt_missing_token(reason):
    app.logger.warning("JWT missing: %s", reason)
    return jsonify({"error": "Missing or invalid token", "reason": reason}), 401


@jwt.invalid_token_loader
def jwt_invalid_token(reason):
    app.logger.warning("JWT invalid: %s", reason)
    return jsonify({"error": "Invalid token", "reason": reason}), 422


@jwt.expired_token_loader
def jwt_expired_token(jwt_header, jwt_payload):
    app.logger.warning("JWT expired: %s", jwt_payload)
    return jsonify({"error": "Token expired"}), 401

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

class Dish(db.Model):
    __tablename__ = 'dishes'
    dishID = db.Column(db.Integer, primary_key=True)
    dishName = db.Column(db.String(100), nullable=False)
    orgID = db.Column(db.Integer, db.ForeignKey('orgs.orgID'))

class Ingredient(db.Model):
    __tablename__ = 'ing'
    ingID = db.Column(db.Integer, primary_key=True)
    ingName = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    expiry = db.Column(db.Date)
    batchNum = db.Column(db.String(50))
    orgID = db.Column(db.Integer, db.ForeignKey('orgs.orgID'))

class DishIngredient(db.Model):
    __tablename__ = 'dish_ing'
    dishID = db.Column(db.Integer, db.ForeignKey('dishes.dishID'), primary_key=True)
    ingID = db.Column(db.Integer, db.ForeignKey('ing.ingID'), primary_key=True)
    qty = db.Column(db.Numeric(10, 2))
    unit = db.Column(db.String(20))

def get_current_user():
    user_id = get_jwt_identity()
    if not user_id:
        return None
    try:
        return User.query.get(int(user_id))
    except (TypeError, ValueError):
        return None


def parse_date(value, field_name):
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return None
        try:
            return datetime.strptime(cleaned, "%Y-%m-%d").date()
        except ValueError as exc:
            raise ValueError(f"{field_name} must be YYYY-MM-DD") from exc
    raise ValueError(f"{field_name} must be a string")


def parse_quantity(value, field_name):
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"{field_name} must be numeric") from exc


STOCK_DISH_NAME = "__STOCK__"


def get_or_create_stock_dish(org_id):
    stock_dish = Dish.query.filter(
        Dish.orgID == org_id,
        Dish.dishName == STOCK_DISH_NAME,
    ).first()
    if stock_dish:
        return stock_dish
    stock_dish = Dish(dishName=STOCK_DISH_NAME, orgID=org_id)
    db.session.add(stock_dish)
    db.session.flush()
    return stock_dish

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

        access_token = create_access_token(identity=str(user.userID))
        return jsonify({"access_token": access_token, "userID": user.userID}), 200
    except Exception as e:
        app.logger.exception("/login failed with error")
        return jsonify({"error": str(e)}), 500


@app.route("/users/me", methods=["GET"])
@jwt_required()
def get_user_profile():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        org = Org.query.get(user.orgID) if user.orgID else None
        return jsonify({
            "orgName": org.orgName if org else None,
            "role": user.uRole,
            "email": user.email,
        }), 200
    except Exception as e:
        app.logger.exception("/users/me failed")
        return jsonify({"error": str(e)}), 500


@app.route("/users", methods=["GET", "POST"])
@jwt_required()
def manage_users():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        if user.uRole != 'admin':
            return jsonify({"error": "Forbidden"}), 403

        if request.method == "GET":
            users = User.query.filter(User.orgID == user.orgID).order_by(User.email.asc()).all()
            return jsonify({
                "users": [
                    {
                        "userID": member.userID,
                        "email": member.email,
                        "role": member.uRole,
                    }
                    for member in users
                ]
            }), 200

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        email = data.get("email")
        password = data.get("password")
        role = data.get("role")

        if not email or not password or not role:
            return jsonify({"error": "Missing email, password, or role"}), 400

        if role not in {"admin", "manager"}:
            return jsonify({"error": "Invalid role"}), 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "User already exists"}), 409

        new_user = User(
            email=email,
            hashed_pwd=generate_password_hash(password),
            orgID=user.orgID,
            uRole=role,
        )
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "msg": "User created",
            "user": {
                "userID": new_user.userID,
                "email": new_user.email,
                "role": new_user.uRole,
            },
        }), 201
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/users failed")
        return jsonify({"error": str(e)}), 500


@app.route("/users/<int:user_id>", methods=["PATCH", "DELETE"])
@jwt_required()
def modify_user(user_id):
    """Edit or delete a user within the same org (admin only)."""
    try:
        current = get_current_user()
        if not current or current.uRole != 'admin':
            return jsonify({"error": "Forbidden"}), 403

        target = User.query.filter_by(userID=user_id, orgID=current.orgID).first()
        if not target:
            return jsonify({"error": "User not found"}), 404

        if request.method == "DELETE":
            if target.userID == current.userID:
                return jsonify({"error": "Cannot delete yourself"}), 400
            db.session.delete(target)
            db.session.commit()
            return jsonify({"msg": "User deleted"}), 200

        # PATCH
        data = request.get_json(silent=True) or {}
        new_email = data.get("email", "").strip()
        new_password = data.get("password", "").strip()
        new_role = data.get("role", "").strip()

        if new_email and new_email != target.email:
            clash = User.query.filter(User.email == new_email, User.userID != target.userID).first()
            if clash:
                return jsonify({"error": "Email already in use"}), 409
            target.email = new_email

        if new_password:
            target.hashed_pwd = generate_password_hash(new_password)

        if new_role:
            if new_role not in {"admin", "manager"}:
                return jsonify({"error": "Invalid role"}), 400
            target.uRole = new_role

        db.session.commit()
        return jsonify({
            "msg": "User updated",
            "user": {"userID": target.userID, "email": target.email, "role": target.uRole},
        }), 200

    except Exception as e:
        db.session.rollback()
        app.logger.exception("/users/<id> failed")
        return jsonify({"error": str(e)}), 500


# --- Dashboard Route ---

@app.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard_summary():
    """Return a summary of the organization's inventory state for the dashboard."""
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        org_id = user.orgID
        org = Org.query.get(org_id) if org_id else None
        today = datetime.utcnow().date()
        from datetime import timedelta
        soon = today + timedelta(days=3)

        # ---- Stock batches with qty via __STOCK__ dish ----
        stock_dish = Dish.query.filter(
            Dish.orgID == org_id,
            Dish.dishName == STOCK_DISH_NAME,
        ).first()
        stock_dish_id = stock_dish.dishID if stock_dish else None

        batch_rows = Ingredient.query.filter(
            Ingredient.orgID == org_id,
            or_(Ingredient.expiry.isnot(None), Ingredient.batchNum.isnot(None)),
        ).order_by(
            Ingredient.expiry.is_(None),
            Ingredient.expiry.asc(),
            Ingredient.ingName.asc(),
        ).all()

        qty_map = {}
        if stock_dish_id and batch_rows:
            ing_ids = [b.ingID for b in batch_rows]
            qty_rows = DishIngredient.query.filter(
                DishIngredient.dishID == stock_dish_id,
                DishIngredient.ingID.in_(ing_ids),
            ).all()
            qty_map = {
                row.ingID: {"qty": float(row.qty) if row.qty is not None else None, "unit": row.unit}
                for row in qty_rows
            }

        # Categorise batches
        expiring_batches = []  # expiry today..soon
        expired_batches = []   # expiry < today
        healthy_batches = 0

        for b in batch_rows:
            info = {
                "ingID": b.ingID,
                "ingName": b.ingName,
                "category": b.category,
                "expiry": b.expiry.isoformat() if b.expiry else None,
                "batchNum": b.batchNum,
                "qty": qty_map.get(b.ingID, {}).get("qty"),
                "unit": qty_map.get(b.ingID, {}).get("unit"),
            }
            if b.expiry:
                if b.expiry < today:
                    expired_batches.append(info)
                elif b.expiry <= soon:
                    expiring_batches.append(info)
                else:
                    healthy_batches += 1
            else:
                healthy_batches += 1

        # ---- Counts ----
        total_ingredients = Ingredient.query.filter(
            Ingredient.orgID == org_id,
            Ingredient.expiry.is_(None),
            Ingredient.batchNum.is_(None),
        ).count()

        total_dishes = Dish.query.filter(
            Dish.orgID == org_id,
            Dish.dishName != STOCK_DISH_NAME,
        ).count()

        total_users = User.query.filter(User.orgID == org_id).count()
        total_batches = len(batch_rows)

        # ---- Categories breakdown ----
        categories = (
            db.session.query(Ingredient.category, func.count(Ingredient.ingID))
            .filter(
                Ingredient.orgID == org_id,
                Ingredient.expiry.is_(None),
                Ingredient.batchNum.is_(None),
            )
            .group_by(Ingredient.category)
            .all()
        )
        category_counts = {cat or "Uncategorized": count for cat, count in categories}

        return jsonify({
            "orgName": org.orgName if org else None,
            "counts": {
                "ingredients": total_ingredients,
                "dishes": total_dishes,
                "users": total_users,
                "batches": total_batches,
                "healthy": healthy_batches,
                "expiring": len(expiring_batches),
                "expired": len(expired_batches),
            },
            "expiringBatches": expiring_batches[:10],
            "expiredBatches": expired_batches[:10],
            "categories": category_counts,
        }), 200

    except Exception as e:
        app.logger.exception("/dashboard failed")
        return jsonify({"error": str(e)}), 500


# Copy your login and dish routes here...

# --- Inventory Routes ---

@app.route("/inventory/ingredients", methods=["GET"])
@jwt_required()
def list_master_ingredients():
    try:
        app.logger.debug("/inventory/ingredients Authorization=%s", request.headers.get("Authorization"))
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        search = request.args.get("search", "").strip()
        category = request.args.get("category", "").strip()
        linked_subquery = (
            db.session.query(
                DishIngredient.ingID.label("ingID"),
                func.count(DishIngredient.dishID).label("linked_dishes"),
            )
            .group_by(DishIngredient.ingID)
            .subquery()
        )
        query = (
            db.session.query(
                Ingredient,
                func.coalesce(linked_subquery.c.linked_dishes, 0).label("linked_dishes"),
            )
            .outerjoin(linked_subquery, linked_subquery.c.ingID == Ingredient.ingID)
            .filter(
                Ingredient.expiry.is_(None),
                Ingredient.batchNum.is_(None),
                Ingredient.orgID == user.orgID,
            )
        )

        if search:
            query = query.filter(Ingredient.ingName.ilike(f"%{search}%"))

        if category:
            query = query.filter(Ingredient.category == category)

        ingredients = query.order_by(Ingredient.ingName.asc()).all()
        return jsonify({
            "ingredients": [
                {
                    "ingID": ing.ingID,
                    "ingName": ing.ingName,
                    "category": ing.category,
                    "linkedDishes": linked_dishes,
                }
                for ing, linked_dishes in ingredients
            ]
        }), 200
    except Exception as e:
        app.logger.exception("/inventory/ingredients failed")
        return jsonify({"error": str(e)}), 500


@app.route("/inventory/dishes", methods=["GET"])
@jwt_required()
def list_dishes():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        search = request.args.get("search", "").strip()
        query = Dish.query.filter(
            Dish.orgID == user.orgID,
            Dish.dishName != STOCK_DISH_NAME,
        )

        if search:
            query = query.filter(Dish.dishName.ilike(f"%{search}%"))

        dishes = query.order_by(Dish.dishName.asc()).all()
        return jsonify({
            "dishes": [
                {
                    "dishID": dish.dishID,
                    "dishName": dish.dishName,
                }
                for dish in dishes
            ]
        }), 200
    except Exception as e:
        app.logger.exception("/inventory/dishes GET failed")
        return jsonify({"error": str(e)}), 500


@app.route("/inventory/ingredient-types", methods=["POST"])
@jwt_required()
def create_master_ingredient():
    try:
        app.logger.debug("/inventory/ingredient-types Authorization=%s", request.headers.get("Authorization"))
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        ing_name = data.get("ingName")
        if not ing_name:
            return jsonify({"error": "Missing ingName"}), 400

        new_ing = Ingredient(
            ingName=ing_name,
            category=data.get("category"),
            expiry=None,
            batchNum=None,
            orgID=user.orgID,
        )
        db.session.add(new_ing)
        db.session.commit()

        return jsonify({
            "msg": "Ingredient type created",
            "ingredient": {
                "ingID": new_ing.ingID,
                "ingName": new_ing.ingName,
                "category": new_ing.category,
            },
        }), 201
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/inventory/ingredient-types failed")
        return jsonify({"error": str(e)}), 500


@app.route("/inventory/ingredient-types/<int:ing_id>", methods=["PATCH", "DELETE"])
@jwt_required()
def update_or_delete_master_ingredient(ing_id):
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        ingredient = Ingredient.query.filter(
            Ingredient.ingID == ing_id,
            Ingredient.orgID == user.orgID,
            Ingredient.expiry.is_(None),
            Ingredient.batchNum.is_(None),
        ).first()

        if not ingredient:
            return jsonify({"error": "Ingredient not found"}), 404

        if request.method == "DELETE":
            usage_count = DishIngredient.query.filter(DishIngredient.ingID == ing_id).count()
            if usage_count > 0:
                return jsonify({
                    "error": "Ingredient is used in dishes",
                    "linkedDishes": usage_count,
                }), 409
            db.session.delete(ingredient)
            db.session.commit()
            return jsonify({"msg": "Ingredient deleted"}), 200

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        ing_name = data.get("ingName")
        category = data.get("category")
        if ing_name is not None:
            if not ing_name:
                return jsonify({"error": "ingName cannot be empty"}), 400
            ingredient.ingName = ing_name
        if category is not None:
            ingredient.category = category

        db.session.commit()
        return jsonify({
            "msg": "Ingredient updated",
            "ingredient": {
                "ingID": ingredient.ingID,
                "ingName": ingredient.ingName,
                "category": ingredient.category,
            },
        }), 200
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/inventory/ingredient-types update/delete failed")
        return jsonify({"error": str(e)}), 500


@app.route("/inventory/dishes", methods=["POST"])
@jwt_required()
def create_dish():
    try:
        app.logger.debug("/inventory/dishes Authorization=%s", request.headers.get("Authorization"))
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        dish_name = data.get("dishName")
        if not dish_name:
            return jsonify({"error": "Missing dishName"}), 400
        if dish_name == STOCK_DISH_NAME:
            return jsonify({"error": "Dish name is reserved"}), 400

        ingredients = data.get("ingredients", [])
        if not isinstance(ingredients, list):
            return jsonify({"error": "ingredients must be a list"}), 400

        new_dish = Dish(dishName=dish_name, orgID=user.orgID)
        db.session.add(new_dish)
        db.session.flush()

        if ingredients:
            ing_ids = [item.get("ingID") for item in ingredients if item.get("ingID") is not None]
            if len(ing_ids) != len(ingredients):
                return jsonify({"error": "Each ingredient must include ingID"}), 400

            valid_ings = Ingredient.query.filter(
                Ingredient.ingID.in_(ing_ids),
                Ingredient.expiry.is_(None),
                Ingredient.batchNum.is_(None),
                Ingredient.orgID == user.orgID,
            ).all()
            valid_ids = {ing.ingID for ing in valid_ings}
            invalid_ids = [ing_id for ing_id in ing_ids if ing_id not in valid_ids]
            if invalid_ids:
                return jsonify({"error": "Invalid ingredient IDs", "invalid": invalid_ids}), 400

            for item in ingredients:
                db.session.add(DishIngredient(
                    dishID=new_dish.dishID,
                    ingID=item["ingID"],
                    qty=item.get("qty"),
                    unit=item.get("unit"),
                ))

        db.session.commit()
        return jsonify({
            "msg": "Dish created",
            "dish": {
                "dishID": new_dish.dishID,
                "dishName": new_dish.dishName,
            },
        }), 201
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/inventory/dishes failed")
        return jsonify({"error": str(e)}), 500


@app.route("/inventory/dishes/<int:dish_id>", methods=["GET"])
@jwt_required()
def get_dish_detail(dish_id):
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        dish = Dish.query.filter(
            Dish.dishID == dish_id,
            Dish.orgID == user.orgID,
        ).first()

        if not dish:
            return jsonify({"error": "Dish not found"}), 404

        rows = (
            db.session.query(DishIngredient, Ingredient)
            .join(Ingredient, Ingredient.ingID == DishIngredient.ingID)
            .filter(DishIngredient.dishID == dish_id)
            .order_by(Ingredient.ingName.asc())
            .all()
        )

        return jsonify({
            "dish": {
                "dishID": dish.dishID,
                "dishName": dish.dishName,
            },
            "ingredients": [
                {
                    "ingID": ing.ingID,
                    "ingName": ing.ingName,
                    "category": ing.category,
                    "qty": float(link.qty) if link.qty is not None else None,
                    "unit": link.unit,
                }
                for link, ing in rows
            ],
        }), 200
    except Exception as e:
        app.logger.exception("/inventory/dishes detail failed")
        return jsonify({"error": str(e)}), 500


@app.route("/inventory/dishes/<int:dish_id>", methods=["PATCH", "DELETE"])
@jwt_required()
def update_or_delete_dish(dish_id):
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        dish = Dish.query.filter(
            Dish.dishID == dish_id,
            Dish.orgID == user.orgID,
        ).first()

        if not dish:
            return jsonify({"error": "Dish not found"}), 404

        if request.method == "DELETE":
            db.session.delete(dish)
            db.session.commit()
            return jsonify({"msg": "Dish deleted"}), 200

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        dish_name = data.get("dishName")
        ingredients = data.get("ingredients")

        if dish_name is not None:
            if not dish_name:
                return jsonify({"error": "dishName cannot be empty"}), 400
            if dish_name == STOCK_DISH_NAME:
                return jsonify({"error": "Dish name is reserved"}), 400
            dish.dishName = dish_name

        if ingredients is not None:
            if not isinstance(ingredients, list):
                return jsonify({"error": "ingredients must be a list"}), 400

            ing_ids = [item.get("ingID") for item in ingredients if item.get("ingID") is not None]
            if len(ing_ids) != len(ingredients):
                return jsonify({"error": "Each ingredient must include ingID"}), 400

            valid_ings = Ingredient.query.filter(
                Ingredient.ingID.in_(ing_ids),
                Ingredient.expiry.is_(None),
                Ingredient.batchNum.is_(None),
                Ingredient.orgID == user.orgID,
            ).all()
            valid_ids = {ing.ingID for ing in valid_ings}
            invalid_ids = [ing_id for ing_id in ing_ids if ing_id not in valid_ids]
            if invalid_ids:
                return jsonify({"error": "Invalid ingredient IDs", "invalid": invalid_ids}), 400

            DishIngredient.query.filter(DishIngredient.dishID == dish_id).delete()
            for item in ingredients:
                db.session.add(DishIngredient(
                    dishID=dish_id,
                    ingID=item["ingID"],
                    qty=item.get("qty"),
                    unit=item.get("unit"),
                ))

        db.session.commit()
        return jsonify({
            "msg": "Dish updated",
            "dish": {
                "dishID": dish.dishID,
                "dishName": dish.dishName,
            },
        }), 200
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/inventory/dishes update/delete failed")
        return jsonify({"error": str(e)}), 500


@app.route("/stock/batches", methods=["GET"])
@jwt_required()
def list_stock_batches():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        stock_dish = Dish.query.filter(
            Dish.orgID == user.orgID,
            Dish.dishName == STOCK_DISH_NAME,
        ).first()
        stock_dish_id = stock_dish.dishID if stock_dish else None

        search = request.args.get("search", "").strip()
        query = Ingredient.query.filter(
            Ingredient.orgID == user.orgID,
            or_(Ingredient.expiry.isnot(None), Ingredient.batchNum.isnot(None)),
        )

        if search:
            query = query.filter(
                or_(
                    Ingredient.ingName.ilike(f"%{search}%"),
                    Ingredient.batchNum.ilike(f"%{search}%"),
                )
            )

        batches = query.order_by(
            Ingredient.expiry.is_(None),
            Ingredient.expiry.asc(),
            Ingredient.ingName.asc(),
        ).all()

        qty_map = {}
        if stock_dish_id and batches:
            ing_ids = [batch.ingID for batch in batches]
            qty_rows = DishIngredient.query.filter(
                DishIngredient.dishID == stock_dish_id,
                DishIngredient.ingID.in_(ing_ids),
            ).all()
            qty_map = {
                row.ingID: {
                    "qty": float(row.qty) if row.qty is not None else None,
                    "unit": row.unit,
                }
                for row in qty_rows
            }

        return jsonify({
            "batches": [
                {
                    "ingID": batch.ingID,
                    "ingName": batch.ingName,
                    "category": batch.category,
                    "expiry": batch.expiry.isoformat() if batch.expiry else None,
                    "batchNum": batch.batchNum,
                    "qty": qty_map.get(batch.ingID, {}).get("qty"),
                    "unit": qty_map.get(batch.ingID, {}).get("unit"),
                }
                for batch in batches
            ]
        }), 200
    except Exception as e:
        app.logger.exception("/stock/batches GET failed")
        return jsonify({"error": str(e)}), 500


@app.route("/stock/batches", methods=["POST"])
@jwt_required()
def create_stock_batch():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        ing_id = data.get("ingID")
        if not ing_id:
            return jsonify({"error": "Missing ingID"}), 400

        master = Ingredient.query.filter(
            Ingredient.ingID == ing_id,
            Ingredient.orgID == user.orgID,
            Ingredient.expiry.is_(None),
            Ingredient.batchNum.is_(None),
        ).first()

        if not master:
            return jsonify({"error": "Ingredient type not found"}), 404

        try:
            expiry = parse_date(data.get("expiry"), "expiry")
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

        batch_num = data.get("batchNum")
        if isinstance(batch_num, str):
            batch_num = batch_num.strip() or None

        if not expiry and not batch_num:
            return jsonify({"error": "Batch requires expiry or batchNum"}), 400

        qty_value = data.get("qty")
        unit_value = data.get("unit")
        if qty_value is None or unit_value is None:
            return jsonify({"error": "Batch requires qty and unit"}), 400
        try:
            qty = parse_quantity(qty_value, "qty")
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        if not isinstance(unit_value, str) or not unit_value.strip():
            return jsonify({"error": "unit is required"}), 400
        unit = unit_value.strip()

        new_batch = Ingredient(
            ingName=master.ingName,
            category=master.category,
            expiry=expiry,
            batchNum=batch_num,
            orgID=user.orgID,
        )
        db.session.add(new_batch)
        db.session.flush()

        stock_dish = get_or_create_stock_dish(user.orgID)
        db.session.add(DishIngredient(
            dishID=stock_dish.dishID,
            ingID=new_batch.ingID,
            qty=qty,
            unit=unit,
        ))

        db.session.commit()

        return jsonify({
            "msg": "Batch created",
            "batch": {
                "ingID": new_batch.ingID,
                "ingName": new_batch.ingName,
                "category": new_batch.category,
                "expiry": new_batch.expiry.isoformat() if new_batch.expiry else None,
                "batchNum": new_batch.batchNum,
                "qty": float(qty) if qty is not None else None,
                "unit": unit,
            },
        }), 201
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/stock/batches POST failed")
        return jsonify({"error": str(e)}), 500


@app.route("/stock/batches/<int:ing_id>", methods=["PATCH", "DELETE"])
@jwt_required()
def update_or_delete_stock_batch(ing_id):
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        batch = Ingredient.query.filter(
            Ingredient.ingID == ing_id,
            Ingredient.orgID == user.orgID,
            or_(Ingredient.expiry.isnot(None), Ingredient.batchNum.isnot(None)),
        ).first()

        if not batch:
            return jsonify({"error": "Batch not found"}), 404

        stock_dish = Dish.query.filter(
            Dish.orgID == user.orgID,
            Dish.dishName == STOCK_DISH_NAME,
        ).first()

        if request.method == "DELETE":
            if stock_dish:
                DishIngredient.query.filter(
                    DishIngredient.dishID == stock_dish.dishID,
                    DishIngredient.ingID == batch.ingID,
                ).delete()
            db.session.delete(batch)
            db.session.commit()
            return jsonify({"msg": "Batch deleted"}), 200

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        if "expiry" in data:
            try:
                batch.expiry = parse_date(data.get("expiry"), "expiry")
            except ValueError as exc:
                return jsonify({"error": str(exc)}), 400

        if "batchNum" in data:
            batch_num = data.get("batchNum")
            if isinstance(batch_num, str):
                batch_num = batch_num.strip()
            batch.batchNum = batch_num or None

        qty = None
        unit = None
        link = None
        if "qty" in data:
            try:
                qty = parse_quantity(data.get("qty"), "qty")
            except ValueError as exc:
                return jsonify({"error": str(exc)}), 400

        if "unit" in data:
            unit_value = data.get("unit")
            if unit_value is not None and (not isinstance(unit_value, str) or not unit_value.strip()):
                return jsonify({"error": "unit is required"}), 400
            unit = unit_value.strip() if isinstance(unit_value, str) else None

        if not batch.expiry and not batch.batchNum:
            return jsonify({"error": "Batch requires expiry or batchNum"}), 400

        if qty is not None or unit is not None:
            stock_dish = stock_dish or get_or_create_stock_dish(user.orgID)
            link = DishIngredient.query.filter(
                DishIngredient.dishID == stock_dish.dishID,
                DishIngredient.ingID == batch.ingID,
            ).first()
            if not link:
                link = DishIngredient(dishID=stock_dish.dishID, ingID=batch.ingID)
                db.session.add(link)
            if qty is not None:
                link.qty = qty
            if unit is not None:
                link.unit = unit
        elif stock_dish:
            link = DishIngredient.query.filter(
                DishIngredient.dishID == stock_dish.dishID,
                DishIngredient.ingID == batch.ingID,
            ).first()

        db.session.commit()
        return jsonify({
            "msg": "Batch updated",
            "batch": {
                "ingID": batch.ingID,
                "ingName": batch.ingName,
                "category": batch.category,
                "expiry": batch.expiry.isoformat() if batch.expiry else None,
                "batchNum": batch.batchNum,
                "qty": float(link.qty) if link and link.qty is not None else None,
                "unit": link.unit if link else None,
            },
        }), 200
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/stock/batches update/delete failed")
        return jsonify({"error": str(e)}), 500


@app.route("/stock/consume", methods=["POST"])
@jwt_required()
def consume_stock_for_dish():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        dish_id = data.get("dishID")
        if not dish_id:
            return jsonify({"error": "Missing dishID"}), 400

        try:
            cooked_qty = parse_quantity(data.get("quantity"), "quantity")
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

        if cooked_qty is None or cooked_qty <= 0:
            return jsonify({"error": "quantity must be greater than 0"}), 400

        dish = Dish.query.filter(
            Dish.dishID == dish_id,
            Dish.orgID == user.orgID,
            Dish.dishName != STOCK_DISH_NAME,
        ).first()
        if not dish:
            return jsonify({"error": "Dish not found"}), 404

        recipe_rows = (
            db.session.query(DishIngredient, Ingredient)
            .join(Ingredient, Ingredient.ingID == DishIngredient.ingID)
            .filter(DishIngredient.dishID == dish_id)
            .all()
        )

        if not recipe_rows:
            return jsonify({"error": "Dish has no ingredients"}), 400

        stock_dish = Dish.query.filter(
            Dish.orgID == user.orgID,
            Dish.dishName == STOCK_DISH_NAME,
        ).first()

        if not stock_dish:
            return jsonify({"error": "No stock batches available"}), 409

        deductions = []

        for recipe_link, recipe_ing in recipe_rows:
            if recipe_link.qty is None or not recipe_link.unit:
                return jsonify({
                    "error": "Recipe is missing qty/unit",
                    "ingredient": recipe_ing.ingName,
                }), 400

            required_qty = recipe_link.qty * cooked_qty

            batches = Ingredient.query.filter(
                Ingredient.orgID == user.orgID,
                Ingredient.ingName == recipe_ing.ingName,
                Ingredient.category == recipe_ing.category,
                or_(Ingredient.expiry.isnot(None), Ingredient.batchNum.isnot(None)),
            ).order_by(
                Ingredient.expiry.is_(None),
                Ingredient.expiry.asc(),
                Ingredient.ingID.asc(),
            ).all()

            if not batches:
                return jsonify({
                    "error": "Insufficient stock",
                    "ingredient": recipe_ing.ingName,
                }), 409

            links = {
                link.ingID: link
                for link in DishIngredient.query.filter(
                    DishIngredient.dishID == stock_dish.dishID,
                    DishIngredient.ingID.in_([batch.ingID for batch in batches]),
                ).all()
            }

            total_available = sum(
                link.qty for link in links.values()
                if link.qty is not None and link.unit == recipe_link.unit
            )

            if total_available < required_qty:
                return jsonify({
                    "error": "Insufficient stock",
                    "ingredient": recipe_ing.ingName,
                    "required": float(required_qty),
                    "available": float(total_available),
                    "unit": recipe_link.unit,
                }), 409

            remaining = required_qty
            for batch in batches:
                if remaining <= 0:
                    break
                link = links.get(batch.ingID)
                if not link or link.qty is None:
                    continue
                if link.unit != recipe_link.unit:
                    continue

                take = min(link.qty, remaining)
                link.qty = link.qty - take
                remaining -= take
                deductions.append({
                    "ingID": batch.ingID,
                    "ingName": batch.ingName,
                    "batchNum": batch.batchNum,
                    "expiry": batch.expiry.isoformat() if batch.expiry else None,
                    "qty": float(take),
                    "unit": link.unit,
                })

        db.session.commit()
        return jsonify({
            "msg": "Stock updated",
            "dishID": dish.dishID,
            "quantity": float(cooked_qty),
            "deductions": deductions,
        }), 200
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/stock/consume failed")
        return jsonify({"error": str(e)}), 500

# --- Spreadsheet Export / Import Routes ---


def make_csv_response(rows, headers, filename):
    """Build a CSV Response from a list of dicts."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=headers, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    content = output.getvalue()
    return Response(
        content,
        mimetype="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def parse_csv_upload():
    """Return list[dict] from an uploaded CSV file, or (None, error_response)."""
    if "file" not in request.files:
        return None, (jsonify({"error": "No file uploaded"}), 400)
    file = request.files["file"]
    if not file.filename:
        return None, (jsonify({"error": "Empty filename"}), 400)
    if not file.filename.lower().endswith(".csv"):
        return None, (jsonify({"error": "Only .csv files are supported"}), 400)
    try:
        stream = io.StringIO(file.stream.read().decode("utf-8-sig"))
        reader = csv.DictReader(stream)
        rows = list(reader)
        return rows, None
    except Exception as exc:
        return None, (jsonify({"error": f"Unable to parse CSV: {exc}"}), 400)


# ---- Ingredients export / import ----

@app.route("/export/ingredients", methods=["GET"])
@jwt_required()
def export_ingredients():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        ingredients = Ingredient.query.filter(
            Ingredient.orgID == user.orgID,
            Ingredient.expiry.is_(None),
            Ingredient.batchNum.is_(None),
        ).order_by(Ingredient.ingName.asc()).all()
        rows = [{"ingName": i.ingName, "category": i.category or ""} for i in ingredients]
        return make_csv_response(rows, ["ingName", "category"], "ingredients.csv")
    except Exception as e:
        app.logger.exception("/export/ingredients failed")
        return jsonify({"error": str(e)}), 500


@app.route("/import/ingredients", methods=["POST"])
@jwt_required()
def import_ingredients():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        rows, err = parse_csv_upload()
        if err:
            return err
        created = 0
        skipped = 0
        for row in rows:
            ing_name = (row.get("ingName") or row.get("name") or "").strip()
            if not ing_name:
                skipped += 1
                continue
            existing = Ingredient.query.filter(
                Ingredient.orgID == user.orgID,
                Ingredient.ingName == ing_name,
                Ingredient.expiry.is_(None),
                Ingredient.batchNum.is_(None),
            ).first()
            if existing:
                skipped += 1
                continue
            db.session.add(Ingredient(
                ingName=ing_name,
                category=(row.get("category") or "").strip() or None,
                expiry=None,
                batchNum=None,
                orgID=user.orgID,
            ))
            created += 1
        db.session.commit()
        return jsonify({"msg": f"{created} ingredients imported, {skipped} skipped"}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/import/ingredients failed")
        return jsonify({"error": str(e)}), 500


# ---- Dishes export / import ----

@app.route("/export/dishes", methods=["GET"])
@jwt_required()
def export_dishes():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        dishes = Dish.query.filter(
            Dish.orgID == user.orgID,
            Dish.dishName != STOCK_DISH_NAME,
        ).order_by(Dish.dishName.asc()).all()
        rows = []
        for dish in dishes:
            links = (
                db.session.query(DishIngredient, Ingredient)
                .join(Ingredient, Ingredient.ingID == DishIngredient.ingID)
                .filter(DishIngredient.dishID == dish.dishID)
                .all()
            )
            if links:
                for link, ing in links:
                    rows.append({
                        "dishName": dish.dishName,
                        "ingName": ing.ingName,
                        "qty": float(link.qty) if link.qty is not None else "",
                        "unit": link.unit or "",
                    })
            else:
                rows.append({"dishName": dish.dishName, "ingName": "", "qty": "", "unit": ""})
        return make_csv_response(rows, ["dishName", "ingName", "qty", "unit"], "dishes.csv")
    except Exception as e:
        app.logger.exception("/export/dishes failed")
        return jsonify({"error": str(e)}), 500


@app.route("/import/dishes", methods=["POST"])
@jwt_required()
def import_dishes():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        rows, err = parse_csv_upload()
        if err:
            return err
        dishes_map: dict[str, list] = {}
        for row in rows:
            dish_name = (row.get("dishName") or row.get("name") or "").strip()
            if not dish_name or dish_name == STOCK_DISH_NAME:
                continue
            dishes_map.setdefault(dish_name, [])
            ing_name = (row.get("ingName") or "").strip()
            if ing_name:
                dishes_map[dish_name].append({
                    "ingName": ing_name,
                    "qty": row.get("qty", ""),
                    "unit": row.get("unit", ""),
                })
        created = 0
        skipped = 0
        for dish_name, ingredients in dishes_map.items():
            existing = Dish.query.filter(
                Dish.orgID == user.orgID,
                Dish.dishName == dish_name,
            ).first()
            if existing:
                skipped += 1
                continue
            new_dish = Dish(dishName=dish_name, orgID=user.orgID)
            db.session.add(new_dish)
            db.session.flush()
            for ing_info in ingredients:
                master = Ingredient.query.filter(
                    Ingredient.orgID == user.orgID,
                    Ingredient.ingName == ing_info["ingName"],
                    Ingredient.expiry.is_(None),
                    Ingredient.batchNum.is_(None),
                ).first()
                if master:
                    qty_val = None
                    try:
                        qty_val = Decimal(str(ing_info["qty"])) if ing_info["qty"] else None
                    except (InvalidOperation, ValueError):
                        pass
                    db.session.add(DishIngredient(
                        dishID=new_dish.dishID,
                        ingID=master.ingID,
                        qty=qty_val,
                        unit=ing_info["unit"] or None,
                    ))
            created += 1
        db.session.commit()
        return jsonify({"msg": f"{created} dishes imported, {skipped} skipped"}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/import/dishes failed")
        return jsonify({"error": str(e)}), 500


# ---- Stock batches export / import ----

@app.route("/export/stock", methods=["GET"])
@jwt_required()
def export_stock():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        stock_dish = Dish.query.filter(
            Dish.orgID == user.orgID,
            Dish.dishName == STOCK_DISH_NAME,
        ).first()
        stock_dish_id = stock_dish.dishID if stock_dish else None
        batches = Ingredient.query.filter(
            Ingredient.orgID == user.orgID,
            or_(Ingredient.expiry.isnot(None), Ingredient.batchNum.isnot(None)),
        ).order_by(Ingredient.ingName.asc()).all()
        qty_map = {}
        if stock_dish_id and batches:
            ids = [b.ingID for b in batches]
            qty_rows = DishIngredient.query.filter(
                DishIngredient.dishID == stock_dish_id,
                DishIngredient.ingID.in_(ids),
            ).all()
            qty_map = {r.ingID: {"qty": float(r.qty) if r.qty else "", "unit": r.unit or ""} for r in qty_rows}
        rows = []
        for b in batches:
            q = qty_map.get(b.ingID, {})
            rows.append({
                "ingName": b.ingName,
                "category": b.category or "",
                "batchNum": b.batchNum or "",
                "expiry": b.expiry.isoformat() if b.expiry else "",
                "qty": q.get("qty", ""),
                "unit": q.get("unit", ""),
            })
        return make_csv_response(rows, ["ingName", "category", "batchNum", "expiry", "qty", "unit"], "stock.csv")
    except Exception as e:
        app.logger.exception("/export/stock failed")
        return jsonify({"error": str(e)}), 500


@app.route("/import/stock", methods=["POST"])
@jwt_required()
def import_stock():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        rows, err = parse_csv_upload()
        if err:
            return err
        created = 0
        skipped = 0
        for row in rows:
            ing_name = (row.get("ingName") or row.get("name") or "").strip()
            if not ing_name:
                skipped += 1
                continue
            master = Ingredient.query.filter(
                Ingredient.orgID == user.orgID,
                Ingredient.ingName == ing_name,
                Ingredient.expiry.is_(None),
                Ingredient.batchNum.is_(None),
            ).first()
            if not master:
                skipped += 1
                continue
            expiry_str = (row.get("expiry") or "").strip()
            batch_num = (row.get("batchNum") or "").strip() or None
            expiry = None
            if expiry_str:
                try:
                    expiry = datetime.strptime(expiry_str, "%Y-%m-%d").date()
                except ValueError:
                    skipped += 1
                    continue
            if not expiry and not batch_num:
                skipped += 1
                continue
            qty_str = (row.get("qty") or "").strip()
            unit_str = (row.get("unit") or "").strip()
            if not qty_str or not unit_str:
                skipped += 1
                continue
            try:
                qty = Decimal(qty_str)
            except (InvalidOperation, ValueError):
                skipped += 1
                continue
            new_batch = Ingredient(
                ingName=master.ingName,
                category=master.category,
                expiry=expiry,
                batchNum=batch_num,
                orgID=user.orgID,
            )
            db.session.add(new_batch)
            db.session.flush()
            stock_dish = get_or_create_stock_dish(user.orgID)
            db.session.add(DishIngredient(
                dishID=stock_dish.dishID,
                ingID=new_batch.ingID,
                qty=qty,
                unit=unit_str,
            ))
            created += 1
        db.session.commit()
        return jsonify({"msg": f"{created} batches imported, {skipped} skipped"}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/import/stock failed")
        return jsonify({"error": str(e)}), 500


# ---- Users export / import ----

@app.route("/export/users", methods=["GET"])
@jwt_required()
def export_users():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        if user.uRole != "admin":
            return jsonify({"error": "Forbidden"}), 403
        users = User.query.filter(User.orgID == user.orgID).order_by(User.email.asc()).all()
        rows = [{"email": u.email, "role": u.uRole} for u in users]
        return make_csv_response(rows, ["email", "role"], "users.csv")
    except Exception as e:
        app.logger.exception("/export/users failed")
        return jsonify({"error": str(e)}), 500


@app.route("/import/users", methods=["POST"])
@jwt_required()
def import_users():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        if user.uRole != "admin":
            return jsonify({"error": "Forbidden"}), 403
        rows, err = parse_csv_upload()
        if err:
            return err
        created = 0
        skipped = 0
        for row in rows:
            email = (row.get("email") or "").strip()
            password = (row.get("password") or "").strip()
            role = (row.get("role") or "manager").strip().lower()
            if not email or not password:
                skipped += 1
                continue
            if role not in {"admin", "manager"}:
                role = "manager"
            existing = User.query.filter_by(email=email).first()
            if existing:
                skipped += 1
                continue
            db.session.add(User(
                email=email,
                hashed_pwd=generate_password_hash(password),
                orgID=user.orgID,
                uRole=role,
            ))
            created += 1
        db.session.commit()
        return jsonify({"msg": f"{created} users imported, {skipped} skipped"}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.exception("/import/users failed")
        return jsonify({"error": str(e)}), 500


# --- Gemini Agentic Chatbot Route ---
import google.generativeai as genai
from sqlalchemy import text as sql_text
import json
import re

# Dangerous SQL patterns that should never be allowed
BLOCKED_SQL_PATTERNS = [
    r"\bDROP\s+DATABASE\b",
    r"\bDROP\s+TABLE\s+(?!dish_ing|dishes|ing|orgs|users)",  # only allow known tables
    r"\bTRUNCATE\b",
    r"\bALTER\s+TABLE\b",
    r"\bCREATE\s+TABLE\b",
    r"\bGRANT\b",
    r"\bREVOKE\b",
    r"\bSHOW\s+VARIABLES\b",
    r"\bLOAD\s+DATA\b",
    r"\bINTO\s+OUTFILE\b",
    r"\bINTO\s+DUMPFILE\b",
]

WRITE_SQL_PATTERNS = [
    r"\bINSERT\b",
    r"\bUPDATE\b",
    r"\bDELETE\b",
    r"\bREPLACE\b",
]

DB_SCHEMA_DESCRIPTION = """
Database schema (MySQL):

TABLE orgs:
  - orgID INT PRIMARY KEY AUTO_INCREMENT
  - orgName VARCHAR(100) NOT NULL
  - latCoord DECIMAL(10,8)
  - longCoord DECIMAL(11,8)
  - org_email VARCHAR(100)

TABLE users:
  - userID INT PRIMARY KEY AUTO_INCREMENT
  - email VARCHAR(100) UNIQUE
  - hashed_pwd VARCHAR(255) NOT NULL  (NEVER expose or query this column)
  - uRole VARCHAR(20)   -- 'admin' or 'manager'
  - orgID INT FK -> orgs.orgID

TABLE dishes:
  - dishID INT PRIMARY KEY AUTO_INCREMENT
  - dishName VARCHAR(100) NOT NULL
  - orgID INT FK -> orgs.orgID
  Note: Dishes with dishName='__STOCK__' are internal system records for stock tracking.

TABLE ing (ingredients):
  - ingID INT PRIMARY KEY AUTO_INCREMENT
  - ingName VARCHAR(100) NOT NULL
  - category VARCHAR(50)
  - expiry DATE          -- NULL for master ingredient types; set for stock batches
  - batchNum VARCHAR(50) -- NULL for master ingredient types; set for stock batches
  - orgID INT FK -> orgs.orgID
  Note: Rows with expiry=NULL AND batchNum=NULL are "master ingredient types" (templates).
        Rows with expiry OR batchNum set are stock batches.

TABLE dish_ing (recipe links & stock quantities):
  - dishID INT FK -> dishes.dishID (PK part 1)
  - ingID INT FK -> ing.ingID (PK part 2)
  - qty DECIMAL(10,2)
  - unit VARCHAR(20)
  Note: Links ingredients to dishes (recipes). Also used with the __STOCK__ dish to track batch quantities.
"""


def build_system_prompt(org_name, org_email, user_email, user_role, org_id):
    return f"""You are **StockSense AI**, the intelligent assistant for the StockSense inventory management platform.

## About StockSense
StockSense is a restaurant / food-service inventory management system that helps organizations track:
- **Ingredient types** (master list of ingredients used by the org)
- **Dishes / recipes** (with linked ingredients and quantities)
- **Stock batches** (physical inventory with expiry dates, batch numbers, and quantities)
- **Stock consumption** (deducting ingredients when dishes are cooked)

## Current Context
- Organization: **{org_name}** (ID: {org_id}, email: {org_email or 'N/A'})
- Current user: **{user_email}** (role: {user_role})

## Your Capabilities
1. **Answer questions** about the organization's inventory, dishes, ingredients, stock levels, and users.
2. **Run SQL queries** against the database to look up information. Use the `run_sql_query` function.
3. **Modify data** when the user explicitly asks you to add, update, or delete records. Use the `run_sql_write` function.
4. **Provide insights** — e.g. expiring ingredients, low stock alerts, recipe cost estimates, usage patterns.

## Rules
- ALWAYS filter queries by orgID = {org_id} so you never leak data from other organizations.
- NEVER select, return, or expose the `hashed_pwd` column from the users table.
- NEVER run DROP DATABASE, TRUNCATE, ALTER TABLE, or other destructive DDL.
- When modifying data, confirm what you're about to do before executing, unless the user's intent is very clear.
- For INSERT/UPDATE/DELETE, always respect foreign key constraints and required fields.
- Keep responses concise, friendly, and helpful. Use markdown formatting for readability.
- If a query returns no results, say so clearly.
- When showing tabular data, use markdown tables.
- You can run multiple queries in sequence to answer complex questions — do so proactively.

{DB_SCHEMA_DESCRIPTION}
"""


def validate_sql(query_str, allow_writes=False, org_id=None):
    """Validate a SQL query for safety. Returns (is_safe, reason)."""
    normalized = query_str.strip().upper()

    # Block dangerous patterns
    for pattern in BLOCKED_SQL_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return False, f"Blocked: query matches dangerous pattern"

    # Check for write operations
    is_write = any(re.search(p, normalized, re.IGNORECASE) for p in WRITE_SQL_PATTERNS)
    if is_write and not allow_writes:
        return False, "Write operations not allowed in read-only mode. Use run_sql_write instead."

    # Ensure org_id filter is present (basic check)
    if org_id is not None and str(org_id) not in query_str:
        return False, f"Query must filter by orgID = {org_id} for data isolation."

    return True, "OK"


def execute_sql_query(query_str, org_id, allow_writes=False):
    """Execute a SQL query and return results as a list of dicts."""
    is_safe, reason = validate_sql(query_str, allow_writes=allow_writes, org_id=org_id)
    if not is_safe:
        return {"error": reason}

    try:
        result = db.session.execute(sql_text(query_str))

        if allow_writes:
            db.session.commit()
            return {"success": True, "rows_affected": result.rowcount}

        # For SELECT queries
        if result.returns_rows:
            columns = list(result.keys())
            rows = []
            for row in result.fetchall():
                row_dict = {}
                for i, col in enumerate(columns):
                    val = row[i]
                    # Convert non-serializable types
                    if isinstance(val, Decimal):
                        val = float(val)
                    elif isinstance(val, (datetime,)):
                        val = val.isoformat()
                    elif hasattr(val, 'isoformat'):
                        val = val.isoformat()
                    row_dict[col] = val
                rows.append(row_dict)
            return {"columns": columns, "rows": rows, "row_count": len(rows)}
        else:
            db.session.commit()
            return {"success": True, "rows_affected": result.rowcount}

    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}


# Define Gemini function declarations for the agentic chatbot
sql_read_tool = genai.protos.Tool(
    function_declarations=[
        genai.protos.FunctionDeclaration(
            name="run_sql_query",
            description="Execute a read-only SQL SELECT query against the database to retrieve information. Always include WHERE orgID = <org_id> to filter by the current organization. Never select hashed_pwd.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "query": genai.protos.Schema(
                        type=genai.protos.Type.STRING,
                        description="The SQL SELECT query to execute. Must include orgID filter.",
                    ),
                    "purpose": genai.protos.Schema(
                        type=genai.protos.Type.STRING,
                        description="Brief explanation of what this query is looking up.",
                    ),
                },
                required=["query", "purpose"],
            ),
        ),
        genai.protos.FunctionDeclaration(
            name="run_sql_write",
            description="Execute a SQL INSERT, UPDATE, or DELETE query to modify data in the database. Only use when the user explicitly asks to add, change, or remove data. Always include WHERE orgID = <org_id> for UPDATE/DELETE. For INSERT, set orgID to the current org.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    "query": genai.protos.Schema(
                        type=genai.protos.Type.STRING,
                        description="The SQL INSERT/UPDATE/DELETE query to execute. Must respect orgID.",
                    ),
                    "purpose": genai.protos.Schema(
                        type=genai.protos.Type.STRING,
                        description="Brief explanation of what this modification does.",
                    ),
                },
                required=["query", "purpose"],
            ),
        ),
    ]
)


@app.route("/chat", methods=["POST"])
@jwt_required()
def chat_endpoint():
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        message = data.get("message")
        if not message:
            return jsonify({"error": "Missing message field"}), 400

        # Get conversation history from client (list of {role, text} dicts)
        history_raw = data.get("history", [])

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            app.logger.error("GEMINI_API_KEY is not set")
            return jsonify({"error": "Server configuration error: API key missing"}), 500

        # Build context
        org = Org.query.get(user.orgID) if user.orgID else None
        org_name = org.orgName if org else "Unknown"
        org_email = org.org_email if org else None
        org_id = user.orgID

        system_prompt = build_system_prompt(
            org_name=org_name,
            org_email=org_email,
            user_email=user.email,
            user_role=user.uRole,
            org_id=org_id,
        )

        genai.configure(api_key=api_key)

        # Models to try in priority order; falls back on rate-limit errors
        GEMINI_MODELS = [
            'gemini-2.5-flash-lite',
            'gemini-3-flash-preview',
            'gemini-2.5-flash',
        ]

        # Build Gemini conversation history
        gemini_history = []
        for entry in history_raw:
            role = entry.get("role", "user")
            text = entry.get("text", "")
            if role in ("user", "model") and text:
                gemini_history.append({"role": role, "parts": [text]})

        last_error = None
        for model_name in GEMINI_MODELS:
            try:
                app.logger.info(f"Trying Gemini model: {model_name}")
                model = genai.GenerativeModel(
                    model_name,
                    tools=[sql_read_tool],
                    system_instruction=system_prompt,
                )

                chat_session = model.start_chat(history=gemini_history)

                # Send the user message and handle function calling loop
                response = chat_session.send_message(message)

                # Agentic loop: keep processing function calls until we get a text response
                max_iterations = 10
                iteration = 0
                actions_taken = []

                while iteration < max_iterations:
                    iteration += 1

                    # Check if there are function calls in the response
                    function_calls = []
                    for candidate in response.candidates:
                        for part in candidate.content.parts:
                            if part.function_call:
                                function_calls.append(part.function_call)

                    if not function_calls:
                        break  # No more function calls, we have the final text response

                    # Process each function call
                    function_responses = []
                    for fc in function_calls:
                        fn_name = fc.name
                        fn_args = dict(fc.args) if fc.args else {}

                        app.logger.info(f"AI function call: {fn_name}({fn_args})")

                        if fn_name == "run_sql_query":
                            query = fn_args.get("query", "")
                            purpose = fn_args.get("purpose", "")
                            result = execute_sql_query(query, org_id=org_id, allow_writes=False)
                            actions_taken.append({"action": "query", "purpose": purpose, "query": query})
                            function_responses.append(
                                genai.protos.Part(
                                    function_response=genai.protos.FunctionResponse(
                                        name="run_sql_query",
                                        response={"result": json.dumps(result, default=str)},
                                    )
                                )
                            )

                        elif fn_name == "run_sql_write":
                            query = fn_args.get("query", "")
                            purpose = fn_args.get("purpose", "")
                            result = execute_sql_query(query, org_id=org_id, allow_writes=True)
                            actions_taken.append({"action": "write", "purpose": purpose, "query": query})
                            function_responses.append(
                                genai.protos.Part(
                                    function_response=genai.protos.FunctionResponse(
                                        name="run_sql_write",
                                        response={"result": json.dumps(result, default=str)},
                                    )
                                )
                            )

                        else:
                            function_responses.append(
                                genai.protos.Part(
                                    function_response=genai.protos.FunctionResponse(
                                        name=fn_name,
                                        response={"error": f"Unknown function: {fn_name}"},
                                    )
                                )
                            )

                    # Send all function responses back to the model
                    response = chat_session.send_message(function_responses)

                # Extract final text
                final_text = ""
                for candidate in response.candidates:
                    for part in candidate.content.parts:
                        if part.text:
                            final_text += part.text

                if not final_text:
                    final_text = "I processed your request but couldn't generate a text response."

                app.logger.info(f"Chat succeeded with model: {model_name}")
                return jsonify({
                    "response": final_text,
                    "actions": actions_taken,
                }), 200

            except Exception as model_err:
                err_str = str(model_err)
                # If it's a rate-limit (429) or quota error, try next model
                if "429" in err_str or "quota" in err_str.lower() or "rate" in err_str.lower() or "ResourceExhausted" in err_str:
                    app.logger.warning(f"Model {model_name} rate-limited, trying next: {err_str[:200]}")
                    last_error = model_err
                    continue
                else:
                    # Non-rate-limit error — raise immediately
                    raise model_err

        # All models exhausted
        app.logger.error("All Gemini models rate-limited")
        return jsonify({"error": f"All AI models are currently rate-limited. Please try again in a minute. Last error: {str(last_error)[:200]}"}), 429

    except Exception as e:
        app.logger.exception("/chat failed with error")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)