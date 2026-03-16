-- Seed categories
INSERT INTO categories (name, slug) VALUES
    ('Fruits', 'fruits'),
    ('Vegetables', 'vegetables'),
    ('Dairy', 'dairy'),
    ('Beverages', 'beverages'),
    ('Snacks', 'snacks');

-- Seed products
INSERT INTO products (category_id, name, description, price, unit) VALUES
    (1, 'Apple', 'Fresh red apples', 120.00, 'kg'),
    (1, 'Banana', 'Ripe yellow bananas', 40.00, 'dozen'),
    (1, 'Mango', 'Alphonso mangoes', 250.00, 'kg'),
    (1, 'Orange', 'Juicy oranges', 80.00, 'kg'),
    (2, 'Tomato', 'Fresh red tomatoes', 30.00, 'kg'),
    (2, 'Potato', 'Clean potatoes', 25.00, 'kg'),
    (2, 'Onion', 'Red onions', 35.00, 'kg'),
    (2, 'Spinach', 'Fresh spinach bunch', 20.00, 'bunch'),
    (3, 'Milk', 'Full cream milk', 60.00, 'litre'),
    (3, 'Paneer', 'Fresh cottage cheese', 320.00, 'kg'),
    (3, 'Curd', 'Set curd', 50.00, 'kg'),
    (4, 'Mango Juice', 'Real mango juice 1L', 90.00, 'piece'),
    (4, 'Lassi', 'Sweet lassi', 30.00, 'glass'),
    (5, 'Samosa', 'Crispy samosa', 15.00, 'piece'),
    (5, 'Namkeen', 'Mixed namkeen 200g', 45.00, 'packet');

-- Seed a staff user (password: staff123)
INSERT INTO users (username, password_hash, role) VALUES
    ('staff', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'staff');
