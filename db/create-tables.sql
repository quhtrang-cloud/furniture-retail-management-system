-- ===============================
-- PRODUCT & INVENTORY
-- ===============================

CREATE TABLE product_category (
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE product (
  product_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category_id INT NOT NULL REFERENCES product_category(category_id),
  image1 VARCHAR(100),
  image2 VARCHAR(100)
);

CREATE TABLE showroom (
  showroom_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  contact_number VARCHAR(15)
);

CREATE TABLE stock_availability (
  stock_id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES product(product_id),
  showroom_id INT NOT NULL REFERENCES showroom(showroom_id),
  quantity INT NOT NULL CHECK (quantity >= 0),
  UNIQUE (product_id, showroom_id)
);

-- ===============================
-- CUSTOMERS & PROMOTIONS
-- ===============================

CREATE TABLE customer (
  customer_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE loyalty_account (
  loyalty_id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL UNIQUE REFERENCES customer(customer_id),
  points INT NOT NULL DEFAULT 0 CHECK (points >= 0)
);

CREATE TABLE coupon (
  coupon_id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customer(customer_id),
  description TEXT,
  discount_amount DECIMAL(10, 2) CHECK (discount_amount >= 0),
  expiry_date DATE
);

-- ===============================
-- ORDERS & DELIVERIES
-- ===============================

CREATE TABLE "order" (
  order_id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customer(customer_id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE order_item (
  order_item_id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES "order"(order_id),
  product_id INT NOT NULL REFERENCES product(product_id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  UNIQUE (order_id, product_id)
);

CREATE TABLE delivery_info (
  delivery_id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES "order"(order_id),
  delivery_type VARCHAR(10) CHECK (delivery_type IN ('home', 'pickup')) NOT NULL,
  delivery_address TEXT,
  showroom_id INT REFERENCES showroom(showroom_id),
  UNIQUE (order_id),
  CHECK (
    (delivery_type = 'home' AND delivery_address IS NOT NULL AND showroom_id IS NULL)
    OR
    (delivery_type = 'pickup' AND showroom_id IS NOT NULL)
  )
);

CREATE TABLE return_record (
  return_id SERIAL PRIMARY KEY,
  order_id INT NOT NULL UNIQUE REFERENCES "order"(order_id),
  return_date DATE NOT NULL,
  reason TEXT
);

-- ===============================
-- EMPLOYEES & PAYROLL
-- ===============================

CREATE TABLE manager (
  manager_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  contact_number VARCHAR(15)
);

CREATE TABLE employee (
  employee_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff')),
  showroom_id INT REFERENCES showroom(showroom_id),
  manager_id INT REFERENCES manager(manager_id)
);

CREATE TABLE full_time_emp (
  employee_id INT PRIMARY KEY REFERENCES employee(employee_id),
  monthly_salary DECIMAL(10, 2) CHECK (monthly_salary >= 0),
  contract_type VARCHAR(50)
);

CREATE TABLE part_time_emp (
  employee_id INT PRIMARY KEY REFERENCES employee(employee_id),
  hourly_rate DECIMAL(10, 2) CHECK (hourly_rate >= 0),
  hours_per_week INT CHECK (hours_per_week >= 0)
);

CREATE TABLE payroll_record (
  payroll_id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES employee(employee_id),
  salary_type VARCHAR(10) CHECK (salary_type IN ('monthly', 'hourly')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  payment_date DATE NOT NULL
);
