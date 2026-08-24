-- ===============================
-- PRODUCT CATEGORIES
-- ===============================
INSERT INTO product_category (name, description) VALUES
('Sofas', 'Premium quality sofas'),
('Dining', 'Dining sets and tables'),
('Beds', 'Comfortable beds for all sizes');

-- ===============================
-- PRODUCTS
-- ===============================
INSERT INTO product (name, description, price, category_id, image1, image2) VALUES
('Luxury Sofa', '3-seater leather sofa', 799.00, 1, 'sofa1a.jpg', 'sofa1b.jpg'),
('Classic Dining Set', 'Wooden dining table with 6 chairs', 999.00, 2, 'dining1a.jpg', 'dining1b.jpg'),
('Queen Bed', 'Queen size memory foam bed', 599.00, 3, 'bed1a.jpg', 'bed1b.jpg');

-- ===============================
-- SHOWROOMS
-- ===============================
INSERT INTO showroom (name, address, contact_number) VALUES
('Portsmouth Central', '123 High St, Portsmouth', '0231234567'),
('Southsea Showroom', '45 Elm Road, Southsea', '0237654321');

-- ===============================
-- STOCK AVAILABILITY
-- ===============================
INSERT INTO stock_availability (product_id, showroom_id, quantity) VALUES
(1, 1, 5),
(2, 1, 3),
(3, 2, 2);

-- ===============================
-- CUSTOMERS
-- ===============================
INSERT INTO customer (name, email, phone_number, address, password) VALUES
('Alice Carter', 'alice@example.com', '0711111111', '12 Queen St, Portsmouth', 'customer1'),
('Bob Smith', 'bob@example.com', '0722222222', '89 Elm St, Southsea', 'customer2');

-- ===============================
-- LOYALTY ACCOUNTS
-- ===============================
INSERT INTO loyalty_account (customer_id, points) VALUES
(1, 120),
(2, 60);

-- ===============================
-- COUPONS
-- ===============================
INSERT INTO coupon (customer_id, description, discount_amount, expiry_date) VALUES
(1, '10% off any sofa', 50.00, '2025-12-31'),
(2, '£30 off orders over £500', 30.00, '2025-11-30');

-- ===============================
-- ORDERS
-- ===============================
INSERT INTO "order" (customer_id, order_date) VALUES
(1, CURRENT_DATE - INTERVAL '5 days'),
(2, CURRENT_DATE - INTERVAL '10 days');

-- ===============================
-- ORDER ITEMS
-- ===============================
INSERT INTO order_item (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 799.00),
(2, 2, 1, 999.00);

-- ===============================
-- DELIVERY INFO
-- ===============================
INSERT INTO delivery_info (order_id, delivery_type, delivery_address, showroom_id) VALUES
(1, 'home', '12 Queen St, Portsmouth', NULL),
(2, 'pickup', NULL, 1);

-- ===============================
-- RETURN RECORD
-- ===============================
INSERT INTO return_record (order_id, return_date, reason) VALUES
(2, CURRENT_DATE - INTERVAL '2 days', 'Wrong product delivered');

-- ===============================
-- MANAGERS
-- ===============================
INSERT INTO manager (name, email, contact_number) VALUES
('Jane Holloway', 'jane@pompey.com', '0234445555');

-- ===============================
-- EMPLOYEES
-- ===============================
INSERT INTO employee (name, email, password, role, showroom_id, manager_id) VALUES
('Daniel Bright', 'daniel@pompey.com', 'admin', 'admin', 1, 1),
('Sandra Lee', 'sandra@pompey.com', 'staff', 'staff', 2, 1);

-- ===============================
-- FULL-TIME EMP
-- ===============================
INSERT INTO full_time_emp (employee_id, monthly_salary, contract_type) VALUES
(1, 2400.00, 'permanent');

-- ===============================
-- PART-TIME EMP
-- ===============================
INSERT INTO part_time_emp (employee_id, hourly_rate, hours_per_week) VALUES
(2, 12.00, 20);

-- ===============================
-- PAYROLL RECORD
-- ===============================
INSERT INTO payroll_record (employee_id, salary_type, amount, payment_date) VALUES
(1, 'monthly', 2400.00, CURRENT_DATE - INTERVAL '1 month'),
(2, 'hourly', 960.00, CURRENT_DATE - INTERVAL '1 week');
