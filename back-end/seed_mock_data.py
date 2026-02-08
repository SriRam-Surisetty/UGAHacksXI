"""
seed_mock_data.py — Populate a StockSense organisation with realistic
mock restaurant inventory data for demonstration / hackathon judging.

Simulates:
  • 15 master ingredient types across 5 categories
  • 10 dishes (recipes) with ingredient linkage
  • Stock batches with varied expiry dates & quantities
  • 30 days of consumption history (CONSUME audit-log entries)
    with weekend peak patterns and random variation

Usage:
  1. Ensure the Flask back-end is configured (DB connection, .env).
  2. Run:  python seed_mock_data.py --org-id <ORG_ID>
     (defaults to org 1 if omitted)

Data Assumptions (ready to explain to judges):
  • All data is synthetically generated; no real customer data.
  • Daily sales follow a normal-ish distribution centred on each dish's
    popularity weight, boosted 30 % on weekends.
  • Supplier lead time defaults to 3 days (configurable in Settings).
  • Expiry windows are realistic for each food category (dairy 7-14 d,
    produce 5-10 d, etc.).
"""

import os
import sys
import json
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Allow running from back-end/ or project root
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db, Org, User, Dish, Ingredient, DishIngredient, AuditLog
from app import STOCK_DISH_NAME, get_or_create_stock_dish, record_audit

# ---------------------------------------------------------------------------
# Master data
# ---------------------------------------------------------------------------
INGREDIENTS = [
    # (name, category, shelf_life_days_range, default_unit)
    ("Chicken Breast",   "Protein",   (5, 10),  "lbs"),
    ("Ground Beef",      "Protein",   (4, 8),   "lbs"),
    ("Salmon Fillet",    "Protein",   (3, 6),   "lbs"),
    ("Tofu",             "Protein",   (10, 21), "lbs"),
    ("All-Purpose Flour","Dry Goods", (90, 180),"lbs"),
    ("White Rice",       "Dry Goods", (90, 180),"lbs"),
    ("Spaghetti",        "Dry Goods", (90, 180),"lbs"),
    ("Olive Oil",        "Dry Goods", (120,365),"oz"),
    ("Tomato",           "Produce",   (5, 10),  "lbs"),
    ("Lettuce",          "Produce",   (3, 7),   "lbs"),
    ("Onion",            "Produce",   (14, 30), "lbs"),
    ("Garlic",           "Produce",   (14, 30), "lbs"),
    ("Cheddar Cheese",   "Dairy",     (7, 14),  "lbs"),
    ("Heavy Cream",      "Dairy",     (5, 10),  "oz"),
    ("Butter",           "Dairy",     (14, 30), "lbs"),
]

DISHES = [
    # (name, [(ingredient_name, qty, unit), ...], popularity_weight)
    ("Grilled Chicken Salad", [
        ("Chicken Breast", 0.5, "lbs"),
        ("Lettuce", 0.3, "lbs"),
        ("Tomato", 0.2, "lbs"),
        ("Olive Oil", 1.0, "oz"),
    ], 8),
    ("Spaghetti Bolognese", [
        ("Spaghetti", 0.4, "lbs"),
        ("Ground Beef", 0.5, "lbs"),
        ("Tomato", 0.3, "lbs"),
        ("Onion", 0.15, "lbs"),
        ("Garlic", 0.05, "lbs"),
    ], 10),
    ("Salmon Rice Bowl", [
        ("Salmon Fillet", 0.4, "lbs"),
        ("White Rice", 0.3, "lbs"),
        ("Lettuce", 0.15, "lbs"),
        ("Onion", 0.1, "lbs"),
    ], 6),
    ("Cheeseburger", [
        ("Ground Beef", 0.35, "lbs"),
        ("Cheddar Cheese", 0.1, "lbs"),
        ("Lettuce", 0.1, "lbs"),
        ("Tomato", 0.1, "lbs"),
        ("Onion", 0.05, "lbs"),
    ], 12),
    ("Chicken Alfredo", [
        ("Chicken Breast", 0.4, "lbs"),
        ("Spaghetti", 0.35, "lbs"),
        ("Heavy Cream", 2.0, "oz"),
        ("Butter", 0.1, "lbs"),
        ("Garlic", 0.05, "lbs"),
    ], 7),
    ("Caesar Salad", [
        ("Lettuce", 0.4, "lbs"),
        ("Cheddar Cheese", 0.08, "lbs"),
        ("Olive Oil", 1.0, "oz"),
        ("Garlic", 0.03, "lbs"),
    ], 5),
    ("Tofu Stir Fry", [
        ("Tofu", 0.4, "lbs"),
        ("White Rice", 0.3, "lbs"),
        ("Onion", 0.15, "lbs"),
        ("Garlic", 0.05, "lbs"),
        ("Olive Oil", 1.0, "oz"),
    ], 4),
    ("Beef Tacos", [
        ("Ground Beef", 0.3, "lbs"),
        ("Tomato", 0.15, "lbs"),
        ("Lettuce", 0.1, "lbs"),
        ("Onion", 0.1, "lbs"),
        ("Cheddar Cheese", 0.08, "lbs"),
    ], 9),
    ("Creamy Tomato Soup", [
        ("Tomato", 0.5, "lbs"),
        ("Heavy Cream", 2.0, "oz"),
        ("Butter", 0.08, "lbs"),
        ("Onion", 0.1, "lbs"),
        ("Garlic", 0.03, "lbs"),
    ], 5),
    ("Garlic Bread", [
        ("All-Purpose Flour", 0.3, "lbs"),
        ("Butter", 0.12, "lbs"),
        ("Garlic", 0.05, "lbs"),
        ("Olive Oil", 0.5, "oz"),
    ], 6),
]

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def clear_org_data(org_id):
    """Remove existing seeded data for the org so the script is idempotent."""
    # Delete audit logs
    AuditLog.query.filter_by(orgID=org_id).delete()

    # Delete dish_ing links, dishes, ingredients
    dishes = Dish.query.filter_by(orgID=org_id).all()
    for d in dishes:
        DishIngredient.query.filter_by(dishID=d.dishID).delete()
    Dish.query.filter_by(orgID=org_id).delete()
    Ingredient.query.filter_by(orgID=org_id).delete()
    db.session.flush()


def seed(org_id: int):
    org = Org.query.get(org_id)
    if not org:
        print(f"ERROR: Org {org_id} not found. Create the org first via /signup.")
        sys.exit(1)

    # Find an admin user to attribute actions
    admin = User.query.filter_by(orgID=org_id, uRole='admin').first()
    if not admin:
        admin = User.query.filter_by(orgID=org_id).first()
    admin_id = admin.userID if admin else None

    print(f"Seeding mock data for org '{org.orgName}' (ID={org_id})...")

    clear_org_data(org_id)

    # ---- 1. Create master ingredient types (expiry=None, batchNum=None) ----
    ing_map = {}  # name -> Ingredient record (master type)
    for name, category, _, _ in INGREDIENTS:
        ing = Ingredient(ingName=name, category=category, orgID=org_id)
        db.session.add(ing)
        db.session.flush()
        ing_map[name] = ing
    print(f"  Created {len(ing_map)} ingredient types")

    # ---- 2. Create dishes & recipe links ----
    dish_map = {}  # name -> Dish record
    for dish_name, recipe, _ in DISHES:
        dish = Dish(dishName=dish_name, orgID=org_id)
        db.session.add(dish)
        db.session.flush()
        dish_map[dish_name] = dish
        for ing_name, qty, unit in recipe:
            master_ing = ing_map[ing_name]
            link = DishIngredient(
                dishID=dish.dishID,
                ingID=master_ing.ingID,
                qty=Decimal(str(qty)),
                unit=unit,
            )
            db.session.add(link)
    db.session.flush()
    print(f"  Created {len(dish_map)} dishes with recipes")

    # ---- 3. Create stock batches ----
    stock_dish = get_or_create_stock_dish(org_id)
    today = datetime.utcnow().date()
    batch_count = 0

    # For each ingredient, create 2-4 batches with staggered expiry
    batch_ings = {}  # name -> list of batch Ingredient records
    for name, category, shelf_range, default_unit in INGREDIENTS:
        num_batches = random.randint(2, 4)
        batch_ings[name] = []
        for b in range(num_batches):
            days_offset = random.randint(-3, shelf_range[1])
            expiry = today + timedelta(days=days_offset)
            batch_num = f"B{random.randint(1000, 9999)}"
            batch = Ingredient(
                ingName=name,
                category=category,
                expiry=expiry,
                batchNum=batch_num,
                orgID=org_id,
            )
            db.session.add(batch)
            db.session.flush()

            # Stock quantity
            base_qty = random.uniform(3, 25)
            link = DishIngredient(
                dishID=stock_dish.dishID,
                ingID=batch.ingID,
                qty=Decimal(str(round(base_qty, 1))),
                unit=default_unit,
            )
            db.session.add(link)
            batch_ings[name].append(batch)
            batch_count += 1

    db.session.flush()
    print(f"  Created {batch_count} stock batches")

    # ---- 4. Simulate 30 days of consumption (audit log entries) ----
    consumption_count = 0
    for day_offset in range(30, 0, -1):
        sim_date = datetime.utcnow() - timedelta(days=day_offset)
        is_weekend = sim_date.weekday() >= 5  # Sat=5, Sun=6

        for dish_name, recipe, popularity in DISHES:
            # Servings per day: popularity ± random noise, boosted on weekends
            base_servings = popularity * (1.3 if is_weekend else 1.0)
            servings = max(0, int(base_servings + random.gauss(0, 2)))
            if servings == 0:
                continue

            # Record an audit-log CONSUME entry (mirrors what /stock/consume writes)
            entry = AuditLog(
                timestamp=sim_date.replace(
                    hour=random.randint(11, 21),
                    minute=random.randint(0, 59),
                ),
                userID=admin_id,
                orgID=org_id,
                action="CONSUME",
                resource_type="stock",
                resource_id=dish_map[dish_name].dishID,
                details=json.dumps({
                    "dishName": dish_name,
                    "quantity": servings,
                    "deductions_count": len(recipe),
                    "simulated": True,
                }),
                ip_address="127.0.0.1",
            )
            db.session.add(entry)
            consumption_count += 1

    db.session.flush()
    print(f"  Created {consumption_count} simulated consumption records (30 days)")

    db.session.commit()
    print("  Done! Mock data seeded successfully.\n")
    print("  Data assumptions:")
    print("    • 15 common restaurant ingredients, 5 categories")
    print("    • 10 dishes with realistic recipe proportions")
    print("    • Stock batches with staggered expiry (some already expired)")
    print("    • 30 days of daily sales with weekend +30% boost")
    print("    • Serving counts ~ dish popularity ± Gaussian noise")
    print("    • Supplier lead time: configurable (default 3 days)")
    print()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Seed mock restaurant data")
    parser.add_argument("--org-id", type=int, default=1,
                        help="Organization ID to populate (default: 1)")
    args = parser.parse_args()

    with app.app_context():
        seed(args.org_id)
