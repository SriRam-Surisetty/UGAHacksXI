from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, or_, and_
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from werkzeug.security import generate_password_hash, check_password_hash
import os
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

# --- Gemini Chatbot Route ---
import google.generativeai as genai

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        message = data.get("message")
        if not message:
            return jsonify({"error": "Missing message field"}), 400

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            app.logger.error("GEMINI_API_KEY is not set")
            return jsonify({"error": "Server configuration error: API key missing"}), 500

        genai.configure(api_key=api_key)
        # Using gemini-flash-latest as verified in previous steps
        model = genai.GenerativeModel('gemini-flash-latest')
        
        chat = model.start_chat(history=[])
        response = chat.send_message(message)
        
        return jsonify({"response": response.text}), 200

    except Exception as e:
        app.logger.exception("/chat failed with error")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)