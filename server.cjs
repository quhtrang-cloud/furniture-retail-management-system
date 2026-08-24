const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const port = 3000;

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
});

// Middleware
app.use(cors());
app.use(express.static('client'));
app.use(bodyParser.json());

// ------------------
// INIT: Create & Seed DB
// ------------------
app.get('/init-db', async (req, res) => {
  try {
    const createSQL = fs.readFileSync('db/create-tables.sql', 'utf8');
    const seedSQL = fs.readFileSync('db/seed-data.sql', 'utf8');
    await pool.query(createSQL);
    await pool.query(seedSQL);
    res.send('Database initialized and seeded successfully!');
  } catch (err) {
    console.error(err);
    res.status(500).send('DB init failed');
  }
});


// ------------------
// LOGIN
// ------------------
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check employee (admin or staff)
    const emp = await pool.query(
      'SELECT * FROM employee WHERE email=$1 AND password=$2',
      [email, password]
    );
    if (emp.rows.length) {
      return res.json({
        status: 'success',
        role: emp.rows[0].role, // 'admin' or 'staff'
        employee_id: emp.rows[0].employee_id
      });
    }

    // Check customer
    const cust = await pool.query(
      'SELECT * FROM customer WHERE email=$1 AND password=$2',
      [email, password]
    );
    if (cust.rows.length) {
      return res.json({
        status: 'success',
        role: 'customer',
        customer_id: cust.rows[0].customer_id
      });
    }

    res.json({ status: 'fail' }); // No match found
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// ------------------
// PRODUCTS
// ------------------
app.get('/api/products', async (req, res) => {
  const { min = 0, max = 1000000, showroom } = req.query;

  let query = `
    SELECT p.*, s.name AS showroom_name, sa.quantity
    FROM product p
    LEFT JOIN stock_availability sa ON p.product_id = sa.product_id
    LEFT JOIN showroom s ON sa.showroom_id = s.showroom_id
    WHERE p.price BETWEEN $1 AND $2
  `;
  const params = [min, max];

  if (showroom) {
    query += " AND s.showroom_id = $3";
    params.push(showroom);
  }

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching products with filters");
  }
});


app.post('/api/products', async (req, res) => {
  const { name, description, price, category_id, image1, image2 } = req.body;
  try {
    await pool.query(
      `INSERT INTO product (name, description, price, category_id, image1, image2)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, description, price, category_id, image1, image2]
    );
    res.json({ status: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding product');
  }
});

// ------------------
// CUSTOMERS
// ------------------
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customer');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error fetching customers');
  }
});

app.post('/api/customers', async (req, res) => {
  const { name, email, phone_number, address, password } = req.body;

  if (!name || !email || !phone_number || !address || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Name, email, phone number, address and password are required'
    });
  }

  try {
    await pool.query(
      `INSERT INTO customer (name, email, phone_number, address, password)
       VALUES ($1, $2, $3, $4, $5)`,
      [name.trim(), email.trim().toLowerCase(), phone_number.trim(), address.trim(), password]
    );
    res.status(201).json({ status: 'success' });
  } catch (err) {
    console.error('CREATE CUSTOMER ERROR:', err);
    if (err.code === '23505') {
      return res.status(409).json({ status: 'fail', message: 'Email is already registered' });
    }
    res.status(500).json({ status: 'fail', message: 'Registration failed' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { name, phone_number, email, address } = req.body;
  try {
    await pool.query(
        'UPDATE customer SET name = $1, phone_number = $2, email = $3, address = $4 WHERE customer_id = $5',
    [name, phone_number, email, address, req.params.id]
    );

    res.json({ status: 'success' });
  } catch (err) {
    console.error('UPDATE ERROR:', err);
    res.status(500).json({ status: 'fail', message: 'Update failed' });
  }
});




app.delete('/api/customers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customer WHERE customer_id = $1', [req.params.id]);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).send('Error deleting customer');
  }
});

// ------------------
// EMPLOYEES
// ------------------
app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.employee_id, e.name, e.role, e.showroom_id, s.name AS showroom_name
       FROM employee e LEFT JOIN showroom s ON e.showroom_id = s.showroom_id`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error fetching employees');
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employee WHERE employee_id = $1', [req.params.id]);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).send('Error deleting employee');
  }
});


app.put('/api/employees/:id', async (req, res) => {
  const { name, role, showroom } = req.body;
  try {
    // Fetch showroom_id based on name
    const result = await pool.query(
      'SELECT showroom_id FROM showroom WHERE name = $1',
      [showroom]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'Invalid showroom name' });
    }

    const showroom_id = result.rows[0].showroom_id;

    // Update employee
    await pool.query(
      'UPDATE employee SET name = $1, role = $2, showroom_id = $3 WHERE employee_id = $4',
      [name, role, showroom_id, req.params.id]
    );

    res.json({ status: 'success' });
  } catch (err) {
    console.error('UPDATE EMPLOYEE ERROR:', err);
    res.status(500).json({ status: 'fail', message: 'Update failed' });
  }
});


app.get('/api/staff/stock-count/:id', async (req, res) => {
  const employeeId = req.params.id;

  try {
    const empResult = await pool.query(
      'SELECT showroom_id FROM employee WHERE employee_id = $1',
      [employeeId]
    );
    const showroomId = empResult.rows[0]?.showroom_id;

    if (!showroomId) return res.json({ total: 0 });

    const stockResult = await pool.query(`
      SELECT SUM(quantity) AS total FROM stock_availability WHERE showroom_id = $1
    `, [showroomId]);

    res.json({ total: parseInt(stockResult.rows[0].total || 0) });

  } catch (err) {
    console.error('Stock count error:', err);
    res.status(500).send('Failed to fetch stock count');
  }
});




app.get('/api/staff/order-count/:id', async (req, res) => {
  const employeeId = req.params.id;

  try {
    const empResult = await pool.query(
      'SELECT showroom_id FROM employee WHERE employee_id = $1',
      [employeeId]
    );
    const showroomId = empResult.rows[0]?.showroom_id;

    if (!showroomId) return res.json({ total: 0 });

    const orderResult = await pool.query(
      `SELECT COUNT(*) 
       FROM "order" o
       JOIN delivery_info d ON o.order_id = d.order_id
       WHERE d.showroom_id = $1`,
      [showroomId]
    );

    res.json({ total: parseInt(orderResult.rows[0].count) });
  } catch (err) {
    console.error('Order count error:', err);
    res.status(500).send('Failed to fetch order count');
  }
});



app.get('/api/staff/return-count/:id', async (req, res) => {
  const employeeId = req.params.id;

  try {
    const empResult = await pool.query(
      'SELECT showroom_id FROM employee WHERE employee_id = $1',
      [employeeId]
    );
    const showroomId = empResult.rows[0]?.showroom_id;

    if (!showroomId) return res.json({ total: 0 });

    const returnResult = await pool.query(`
      SELECT COUNT(*) 
      FROM return_record r
      JOIN "order" o ON r.order_id = o.order_id
      JOIN delivery_info d ON o.order_id = d.order_id
      WHERE d.showroom_id = $1
    `, [showroomId]);

    res.json({ total: parseInt(returnResult.rows[0].count) });
  } catch (err) {
    console.error('Return count error:', err);
    res.status(500).send('Failed to fetch return count');
  }
});


app.get('/api/staff/orders/:employeeId', async (req, res) => {
  const employeeId = req.params.employeeId;

  try {
    // Get staff's showroom ID
    const empResult = await pool.query(
      'SELECT showroom_id FROM employee WHERE employee_id = $1',
      [employeeId]
    );

    const showroomId = empResult.rows[0]?.showroom_id;
    if (!showroomId) return res.json([]);

    // Get orders from that showroom
    const result = await pool.query(`
      SELECT 
        o.order_id,
        c.name AS customer_name,
        s.name AS showroom_name,
        o.order_date,
        SUM(oi.unit_price * oi.quantity) AS total
      FROM "order" o
      JOIN customer c ON o.customer_id = c.customer_id
      JOIN order_item oi ON o.order_id = oi.order_id
      JOIN delivery_info di ON o.order_id = di.order_id
      JOIN showroom s ON di.showroom_id = s.showroom_id
      WHERE di.showroom_id = $1
      GROUP BY o.order_id, c.name, s.name, o.order_date
      ORDER BY o.order_date DESC
    `, [showroomId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching staff orders:', err);
    res.status(500).send('Failed to load order data');
  }
});




app.get('/api/staff/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.order_id,
        c.name AS customer_name,
        o.order_date,
        SUM(oi.unit_price * oi.quantity) AS total
      FROM "order" o
      JOIN customer c ON o.customer_id = c.customer_id
      JOIN order_item oi ON o.order_id = oi.order_id
      GROUP BY o.order_id, c.name, o.order_date
      ORDER BY o.order_date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Failed to fetch orders");
  }
});

// ------------------
// UPDATE STOCK ENTRY
// ------------------
app.put('/api/stocks/:id', async (req, res) => {
  const { quantity } = req.body;
  const stockId = req.params.id;

  try {
    await pool.query(
      'UPDATE stock_availability SET quantity = $1 WHERE stock_id = $2',
      [quantity, stockId]
    );
    res.json({ status: 'success' });
  } catch (err) {
    console.error('UPDATE STOCK ERROR:', err);
    res.status(500).json({ status: 'fail', message: 'Stock update failed' });
  }
});

// GET customer orders
app.get('/api/customer/orders/:id', async (req, res) => {
  const customerId = req.params.id;

  try {
    const orders = await pool.query(`
      SELECT
        o.order_id,
        o.order_date,
        d.delivery_type,
        d.delivery_address,
        s.name AS showroom_name,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total,
        COALESCE(
          json_agg(
            json_build_object(
              'product_name', p.name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price
            ) ORDER BY oi.order_item_id
          ) FILTER (WHERE oi.order_item_id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM "order" o
      LEFT JOIN order_item oi ON o.order_id = oi.order_id
      LEFT JOIN product p ON oi.product_id = p.product_id
      LEFT JOIN delivery_info d ON o.order_id = d.order_id
      LEFT JOIN showroom s ON d.showroom_id = s.showroom_id
      WHERE o.customer_id = $1
      GROUP BY o.order_id, o.order_date, d.delivery_type, d.delivery_address, s.name
      ORDER BY o.order_date DESC
    `, [customerId]);

    res.json(orders.rows);
  } catch (err) {
    console.error('Error fetching customer orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});



// GET customer returns
app.get('/api/customer/returns/:id', async (req, res) => {
  const customerId = req.params.id;

  try {
    const returns = await pool.query(`
      SELECT r.order_id, r.reason, r.return_date
      FROM return_record r
      INNER JOIN "order" o ON r.order_id = o.order_id
      WHERE o.customer_id = $1
      ORDER BY r.return_date DESC
    `, [customerId]);

    res.json(returns.rows);
  } catch (err) {
    console.error('Error fetching returns:', err);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});


app.get('/api/customer/loyalty/:id', async (req, res) => {
  const customerId = req.params.id;

  try {
    const loyalty = await pool.query(
      'SELECT points FROM loyalty_account WHERE customer_id = $1',
      [customerId]
    );

    const coupons = await pool.query(`
      SELECT coupon_id, description, discount_amount, expiry_date
      FROM coupon
      WHERE customer_id = $1 AND expiry_date >= CURRENT_DATE
      ORDER BY expiry_date
    `, [customerId]);

    res.json({
      points: loyalty.rows[0]?.points || 0,
      coupons: coupons.rows
    });
  } catch (err) {
    console.error('Error fetching loyalty:', err);
    res.status(500).json({ error: 'Failed to fetch loyalty data' });
  }
});



const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-checkout-session', async (req, res) => {
  const { name, price } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: name,
          },
          unit_amount: Math.round(price * 100), // in pence
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:3000/success.html',
      cancel_url: 'http://localhost:3000/customer.html',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Stripe session failed' });
  }
});


app.get('/api/customers/count', async (req, res) => {
  const result = await pool.query('SELECT COUNT(*) FROM customer');
  res.json({ total: parseInt(result.rows[0].count) });
});

app.get('/api/products/count', async (req, res) => {
  const result = await pool.query('SELECT COUNT(*) FROM product');
  res.json({ total: parseInt(result.rows[0].count) });
});

app.get('/api/orders/count', async (req, res) => {
  const result = await pool.query('SELECT COUNT(*) FROM "order"');
  res.json({ total: parseInt(result.rows[0].count) });
});

app.get('/api/employees/count', async (req, res) => {
  const result = await pool.query('SELECT COUNT(*) FROM employee');
  res.json({ total: parseInt(result.rows[0].count) });
});

// ------------------
// PAYROLL
// ------------------
app.get('/api/payroll', async (req, res) => {
  try {
const result = await pool.query(`
  SELECT p.*, e.name AS name
  FROM payroll_record p
  JOIN employee e ON p.employee_id = e.employee_id
`);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching payroll data:', err);
    res.status(500).send('Error loading payroll');
  }
});


app.delete('/api/payroll/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM payroll_record WHERE payroll_id = $1', [req.params.id]);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).send('Error deleting payroll');
  }
});


// ------------------
// SHOWROOMS
// ------------------
app.get('/api/showrooms', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM showroom ORDER BY showroom_id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error fetching showrooms');
  }
});

app.delete('/api/showrooms/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM showroom WHERE showroom_id = $1', [req.params.id]);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).send('Error deleting showroom');
  }
});

app.put('/api/showrooms/:id', async (req, res) => {
  const { name, address, contact_number } = req.body;
  try {
    await pool.query(
      'UPDATE showroom SET name = $1, address = $2, contact_number = $3 WHERE showroom_id = $4',
      [name, address, contact_number, req.params.id]
    );
    res.json({ status: 'success' });
  } catch (err) {
    console.error('UPDATE SHOWROOM ERROR:', err);
    res.status(500).json({ status: 'fail', message: 'Update failed' });
  }
});

// ------------------
// STOCKS
// ------------------
app.get('/api/stocks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sa.stock_id, sa.quantity, p.name AS product_name, s.name AS showroom_name
      FROM stock_availability sa
      JOIN product p ON p.product_id = sa.product_id
      JOIN showroom s ON s.showroom_id = sa.showroom_id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error fetching stock data');
  }
});

app.delete('/api/stocks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM stock_availability WHERE stock_id = $1', [req.params.id]);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).send('Error deleting stock');
  }
});

// ------------------
// RETURNS (simplified)
// ------------------
app.post('/api/customer/return-request', async (req, res) => {
  const { customer_id, order_id, reason } = req.body;

  if (!customer_id || !order_id || !reason?.trim()) {
    return res.status(400).json({ status: 'fail', message: 'Order and return reason are required' });
  }

  try {
    const eligible = await pool.query(`
      SELECT o.order_id
      FROM "order" o
      WHERE o.order_id = $1
        AND o.customer_id = $2
        AND CURRENT_DATE - o.order_date <= 28
        AND NOT EXISTS (
          SELECT 1 FROM return_record r WHERE r.order_id = o.order_id
        )
    `, [order_id, customer_id]);

    if (eligible.rows.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'This order is not eligible for return'
      });
    }

    await pool.query(
      `INSERT INTO return_record (order_id, return_date, reason)
       VALUES ($1, CURRENT_DATE, $2)`,
      [order_id, reason.trim()]
    );

    res.status(201).json({ status: 'success' });
  } catch (err) {
    console.error('RETURN REQUEST ERROR:', err);
    res.status(500).json({ status: 'fail', message: 'Error submitting return request' });
  }
});


app.get('/api/customer/return-eligible/:id', async (req, res) => {
  const customerId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT
        o.order_id,
        o.order_date,
        d.delivery_type,
        d.delivery_address,
        s.name AS showroom_name
      FROM "order" o
      JOIN delivery_info d ON o.order_id = d.order_id
      LEFT JOIN showroom s ON d.showroom_id = s.showroom_id
      WHERE o.customer_id = $1
        AND CURRENT_DATE - o.order_date <= 28
        AND NOT EXISTS (
          SELECT 1 FROM return_record r WHERE r.order_id = o.order_id
        )
      ORDER BY o.order_date DESC
    `, [customerId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching eligible returns:', err);
    res.status(500).json({ message: 'Failed to load eligible returns' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.order_id,
        c.name AS customer_name,
        s.name AS showroom_name,
        o.order_date,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_amount
      FROM "order" o
      JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN order_item oi ON o.order_id = oi.order_id
      LEFT JOIN delivery_info d ON o.order_id = d.order_id
      LEFT JOIN showroom s ON d.showroom_id = s.showroom_id
      GROUP BY o.order_id, c.name, s.name, o.order_date
      ORDER BY o.order_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});