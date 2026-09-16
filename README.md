# Pompey Furniture Company

A full-stack retail management prototype for a fictional multi-showroom furniture company. The application connects customer-facing shopping and account journeys with staff operations, administrative tools and a PostgreSQL relational database.

> **Project status:** Functional portfolio prototype using simulated data. It is not intended for unrestricted commercial use.

## Project Preview

### Customer-facing homepage

![Pompey Furniture Company homepage with customer-support chatbot](docs/images/furniture-homepage.png)

### Product catalogue

The database-backed catalogue displays product pricing, showroom-specific availability and stock quantities. Customers can review product details, add items to their cart and begin a test-mode Stripe Checkout session using server-verified product data.

![Furniture product catalogue showing prices, showroom availability, stock quantities and purchasing actions](docs/images/furniture-products.png)

## Key Features

### Customer experience

- Browse products and view showroom-specific availability.
- Register and sign in to a customer account.
- View personal orders, return history, loyalty points and available coupons.
- Submit return requests for eligible orders within 28 days.
- Start a test-mode Stripe Checkout session using product names and prices retrieved by the server from PostgreSQL.
- Access a Chatbase-powered customer-support chatbot.

### Staff operations

- View stock, orders and returns associated with the staff member's assigned showroom.
- Review the customer and operational information required for day-to-day support.
- Access staff routes through server-validated session and role checks.

### Administration

- View dashboard totals for customers, products, orders and employees.
- Add products and customers.
- Review and update customer, employee, showroom and stock information.
- Review payroll data and remove selected management records.
- Access administrative API routes protected by server-side authorisation.

## Architecture

The frontend uses HTML, CSS and browser JavaScript served as static files by Express. The Express server exposes REST-style endpoints and communicates with PostgreSQL through `node-postgres`.

| Layer | Responsibility |
| --- | --- |
| Client | Product browsing, account journeys and role-specific interfaces |
| Express server | Routing, validation, sessions, authorisation and external-service integration |
| PostgreSQL | Relational data, constraints, operational queries and reporting data |
| Stripe Checkout | Server-created payment sessions using database-verified product data |
| Chatbase | Embedded customer-support chatbot |

Authentication is based on server-side sessions. Customer, staff and administrator permissions are checked on the server, and ownership checks prevent customers or staff members from requesting another user's protected records. Browser storage is used only to support interface state; it is not treated as the source of authorisation.

## Database Design

![Enhanced Entity-Relationship Diagram](docs/images/database-eerd.png)

The relational model covers:

- Product categories, products and showroom-specific inventory.
- Customers, loyalty accounts and coupons.
- Orders and order items.
- Home delivery and showroom pickup.
- Returns.
- Showrooms, managers and employees.
- Full-time and part-time employment details.
- Payroll records.

Notable design decisions include:

- `stock_availability` resolves the many-to-many relationship between products and showrooms while storing location-specific quantities.
- `order_item` supports multiple products per order and preserves the unit price charged at the time of purchase.
- `delivery_info` uses constraints to model either home delivery or showroom pickup.
- `return_record` links a return to its originating order and limits each order to one return record.
- Separate full-time and part-time tables represent different employment and payment structures.

## Business SQL Queries

Four standalone PostgreSQL reporting queries are provided in [`db/reporting-queries.sql`](db/reporting-queries.sql):

| Query | Business purpose | Main SQL techniques |
| --- | --- | --- |
| Monthly income from showroom pickup orders | Compares monthly income from orders collected at each showroom | `JOIN`, `SUM`, `GROUP BY`, `DATE_TRUNC` |
| Products within a price range | Finds in-stock products across showrooms within a selected price range | `JOIN`, `BETWEEN`, filtering, ordering |
| Delivery type summary | Compares home-delivery and showroom-pickup volumes | `COUNT`, `GROUP BY` |
| Returns in the last 28 days | Identifies recent returns for customer-service follow-up | `JOIN`, `INTERVAL`, filtering, ordering |

The first query intentionally reports pickup-order income only. Pickup records contain a `showroom_id`, while the current schema does not store enough information to attribute home-delivery income to a specific showroom.

These queries run independently in PostgreSQL and are not exposed through an application reporting dashboard.

## Security and Data Handling

The current implementation includes:

- Salted `scrypt` password hashing for seeded and newly registered accounts.
- Password columns sized to store the complete hashes.
- HTTP-only session cookies with `SameSite=Lax`.
- Server-side role and record-ownership checks.
- Parameterised PostgreSQL queries for application input.
- Server-side product and price lookup before Stripe Checkout session creation.
- Environment-based configuration for database credentials, session secrets and Stripe keys.
- Basic request validation and a restricted JSON request-body size.
- Customer password fields excluded from list responses.

These controls strengthen the prototype but do not make it production-ready. See [Limitations](#limitations).

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, SQL |
| Database access | `node-postgres` (`pg`) |
| Authentication | `express-session`, Node.js `crypto` and `scrypt` |
| Integrations | Stripe Checkout, Chatbase |
| Development | npm, Git, GitHub, pgAdmin |

## Project Structure

```text
.
├── client/
│   ├── images/
│   │   └── products/
│   ├── videos/
│   │   └── 201947-916877801_medium.mp4
│   ├── auth.js
│   ├── index.html
│   ├── products.html
│   ├── customer.html
│   ├── orders.html
│   ├── returns.html
│   ├── loyalty.html
│   ├── admin.html
│   ├── staff.html
│   ├── customers.html
│   ├── employees.html
│   ├── payroll.html
│   ├── showrooms.html
│   ├── stocks.html
│   └── style.css
├── db/
│   ├── create-tables.sql
│   ├── seed-data.sql
│   └── reporting-queries.sql
├── do-not-edit/
│   ├── cleanup-db.js
│   ├── db.js
│   └── setup-db.js
├── docs/
│   └── images/
│       ├── database-eerd.png
│       ├── furniture-homepage.png
│       └── furniture-products.png
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.cjs
```

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL
- A Stripe **test secret key** beginning with `sk_test_`

Stripe is initialised when the current server starts, so a valid secret key must be present in `.env`. Test mode is recommended for all local and portfolio demonstrations.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/quhtrang-cloud/furniture-retail-management-system.git
   cd furniture-retail-management-system
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to a new local file named `.env`, then replace the placeholders:

   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=mydb
   DB_PASSWORD=YOUR_POSTGRES_PASSWORD
   DB_PORT=5432
   DB_ADMIN_DATABASE=postgres
   PORT=3000
   SESSION_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
   APP_URL=http://localhost:3000

   # Use the secret test key from Stripe Dashboard, not the publishable key.
   STRIPE_SECRET_KEY=YOUR_STRIPE_TEST_SECRET_KEY
   ```

   Generate a suitable local session secret with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

4. Create the local database, tables and simulated data:

   ```bash
   npm run setup
   ```

5. Start the application:

   ```bash
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000).

> Never commit `.env`, database passwords, session secrets, API keys or real personal data. If a Stripe secret key is exposed, rotate it in Stripe Dashboard and replace the value in the local `.env` file.

## Stripe Test Setup

1. Open Stripe Dashboard in **test mode**.
2. Go to **Developers → API keys**.
3. Copy the **secret key** beginning with `sk_test_`.
4. Add it to the local `.env` file as `STRIPE_SECRET_KEY`.
5. Restart the Node.js server after changing the key.

Do not use the publishable `pk_test_` key in `server.cjs` or `.env`. The server can technically create live Checkout sessions if supplied with a live secret key, but live mode is not appropriate for this prototype because payment webhooks and post-payment order creation have not been implemented.

## Demonstration Accounts

Running `npm run setup` creates these local demonstration accounts:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `daniel@pompey.com` | `admin` |
| Staff | `sandra@pompey.com` | `staff` |
| Customer | `alice@example.com` | `customer1` |

The database seed stores salted hashes rather than these plain-text values. The passwords are intentionally simple for local demonstration and must not be reused for a public deployment.

### Existing local databases

Updating `create-tables.sql` or `seed-data.sql` does not modify a database that has already been created. If an older local database still contains short or plain-text passwords, either migrate those records or rebuild the simulated database:

```bash
npm run cleanup
npm run setup
```

This deletes the database configured by `DB_NAME` before recreating it. Back up anything you need before running the command.

## Available Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Starts the Express application |
| `npm run setup` | Creates the configured development database, schema and seed data |
| `npm run cleanup` | Deletes the configured development database |

## Running the Reporting Queries

After setting up the database, open `db/reporting-queries.sql` in pgAdmin and run each statement independently, or use `psql`:

```bash
psql -U postgres -d mydb -f db/reporting-queries.sql
```

The values in Query 2 are demonstration inputs and can be changed directly in the SQL file when testing a different price range. Application-facing SQL uses parameters such as `$1` and `$2`; the reporting file contains standalone statements intended for direct execution in PostgreSQL.

## My Role and Contribution

This project was initially developed collaboratively and later independently extended and technically refined. My primary responsibilities focused on project coordination, database design, SQL development and system integration, alongside contributions to information architecture and initial wireframes.

My contribution included:

- Leading project planning, task allocation and delivery coordination as Project Manager.
- Contributing to requirements analysis, comparative research, use cases, role-based information architecture, site architecture and wireframes.
- Designing the enhanced entity-relationship model and translating it into a PostgreSQL relational schema.
- Developing and validating business SQL queries using joins, filtering, aggregation, grouping and date-based analysis.
- Contributing to customer-facing, staff and administrative interfaces and workflows.
- Integrating browser-based interfaces with Node.js, Express.js and PostgreSQL.
- Testing and debugging core database-backed journeys across customer, staff and administrator roles.
- Independently refining authentication, password storage, session-based authorisation, ownership checks, input handling, environment configuration and Stripe Checkout data validation.
- Improving technical documentation and overall project maintainability.

The final frontend implementation was developed collaboratively. My interface contribution focused primarily on application structure, user flows and wireframes, while my main technical ownership centred on the database and supporting application logic.

## Limitations

This repository demonstrates application structure and database-backed workflows; it is not intended for live commercial use. Current limitations include:

- Sessions use the default in-memory store, which is unsuitable for production deployment.
- CSRF protection, rate limiting, email verification and account recovery are not implemented.
- Stripe Checkout creates a payment session, but Stripe webhook verification and persistent order creation after confirmed payment are not implemented.
- Some management operations require stronger field validation and database transactions.
- Reporting queries run directly in PostgreSQL rather than through an application dashboard.
- Automated unit, integration and end-to-end tests have not been added.
- Production deployment would require HTTPS, a persistent session store, stronger credential policies, secure secret management, structured logging, monitoring and a full security review.

## Author

**Quynh Trang Nguyen**

- [Portfolio](https://my-portfolio-ivory-ten-46.vercel.app/)
- [LinkedIn](https://www.linkedin.com/in/quynh-trang-nguyen-21a559334/)
