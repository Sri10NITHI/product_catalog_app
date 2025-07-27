from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Product
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all origins

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Create database tables if they don't exist
with app.app_context():
    db.create_all()

# --- API Endpoints ---

@app.route('/products', methods=['GET'])
def get_products():
    """Fetches all products."""
    products = Product.query.all()
    return jsonify([product.to_dict() for product in products])

@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Fetches a single product by ID."""
    product = Product.query.get(product_id)
    if product is None:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(product.to_dict())

@app.route('/products', methods=['POST'])
def create_product():
    """Creates a new product."""
    data = request.json
    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400

    name = data.get('name')
    description = data.get('description')
    price = data.get('price')
    stock = data.get('stock')

    # Basic input validation
    if not name or not price or not stock:
        return jsonify({'error': 'Missing required fields: name, price, stock'}), 400
    try:
        price = float(price)
        stock = int(stock)
        if price <= 0 or stock < 0:
            return jsonify({'error': 'Price must be positive and stock non-negative'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid data type for price or stock'}), 400

    new_product = Product(name=name, description=description, price=price, stock=stock)
    db.session.add(new_product)
    db.session.commit()
    return jsonify(new_product.to_dict()), 201

@app.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """Updates an existing product."""
    product = Product.query.get(product_id)
    if product is None:
        return jsonify({'error': 'Product not found'}), 404

    data = request.json
    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400

    # Update fields if present in the request data
    if 'name' in data:
        product.name = data['name']
    if 'description' in data:
        product.description = data['description']
    if 'price' in data:
        try:
            price = float(data['price'])
            if price <= 0:
                return jsonify({'error': 'Price must be positive'}), 400
            product.price = price
        except ValueError:
            return jsonify({'error': 'Invalid data type for price'}), 400
    if 'stock' in data:
        try:
            stock = int(data['stock'])
            if stock < 0:
                return jsonify({'error': 'Stock cannot be negative'}), 400
            product.stock = stock
        except ValueError:
            return jsonify({'error': 'Invalid data type for stock'}), 400

    db.session.commit()
    return jsonify(product.to_dict())

@app.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Deletes a product by ID."""
    product = Product.query.get(product_id)
    if product is None:
        return jsonify({'error': 'Product not found'}), 404

    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully'}), 204 # 204 No Content

if __name__ == '__main__':
    # Run the Flask app in debug mode
    app.run(debug=True, port=5000)