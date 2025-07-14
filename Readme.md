# 🧭 Travel Guru – Server Side

This is the **backend server** for the **Travel Guru** web application — a full-featured travel platform that connects customers with curated destinations and travel packages. It supports **role-based access control** for Admins, Managers, and Customers, and integrates with **SSLCommerz** for secure local payment handling.

---

## 🔗 Live Links

- 🚀 **Client (Live)**: [https://travel-guru-795b7.web.app](https://travel-guru-795b7.web.app)
- 🌐 **Server (API Base URL)**: [https://travel-guru-server-coral.vercel.app](https://travel-guru-server-coral.vercel.app)
- 🗃️ **Client GitHub Repo**: [client repo](https://github.com/WasefUllah/travel-guru-clientSide)
- 🗃️ **Server GitHub Repo**: [server repo](https://github.com/WasefUllah/travel-guru-serverSide)

---

## ⚙️ Technologies Used

- **Node.js & Express.js** – RESTful API
- **MongoDB** – NoSQL database (with native driver)
- **SSLCommerz** – Local payment gateway for Bangladesh
- **dotenv** – Secure environment configuration
- **CORS** – Cross-origin access
- **Vercel** – Deployment

---

## 📁 Features & API Highlights

### 🔐 Role-based Access

- **Admin**: Can approve packages, manage destinations, FAQs
- **Manager**: Can create packages and view bookings
- **Customer**: Can book packages and view payment history

### 🧾 Booking & Payment

- Creates bookings with transaction ID (`tran_id`)
- Initiates SSLCommerz payment
- Updates booking status to `paid` on success
- Tracks and stores payment history

### 📦 Key API Endpoints

#### POST

- `POST /bookings` – Create a booking and initiate payment
- `POST /success/:tranId` – Confirm payment and update status
- `POST /users` – Add new user
- `POST /packages` – Add a travel package
- `POST /destinations` – Add destination
- `POST /faq` – Add FAQ item

#### GET

- `GET /packages?email=...&role=...&filter=...` – Filtered packages
- `GET /popularPackage` – Top 6 popular packages
- `GET /popularDestination` – Top 6 popular destinations
- `GET /approvedPackage` – Packages pending approval
- `GET /bookings?email=...&role=...` – Bookings per user role
- `GET /paymentHistory?email=...` – User's payment history
- `GET /relatedPackages/:id` – Packages by destination
- `GET /faq` – All FAQs

#### PATCH

- `PATCH /package/:id` – Update a package or toggle `popular`
- `PATCH /booking/:id` – Update a destination or toggle `popular`

#### DELETE

- `DELETE /destinations/:id`
- `DELETE /packages/:id`
- `DELETE /bookings/:id`

---

## 🛠️ Setup Instructions

### 🔧 Environment Variables (.env)

PORT=3000
DB_USER=your_db_user
DB_PASS=your_db_pass
STORE_ID=your_sslcommerz_store_id
STORE_PASS=your_sslcommerz_store_pass


### ▶️ Run Locally

```bash
# Install dependencies
npm install

# Start server
node index.js
```
### 📌 Folder Structure

travel-guru-server/
├── index.js           # Main server logic
├── .env               # Environment variables
├── package.json       # Project metadata
└── collections:
    users
    packages
    destinations
    bookings
    faqs


### 💳 Payment Flow (SSLCommerz)
Customer submits booking → POST /bookings
Server creates tran_id and inserts booking with status: "failed"
Payment URL is returned
On success, SSLCommerz calls /success/:tranId
Server updates booking to status: "paid" and redirects to client


### 📬 Contact
If you face any issues or want to contribute, feel free to create a pull request or reach out.

⚠️ This is a student project built for academic purposes and may lack full production-level security (e.g. JWT, rate limiting, etc.). But it will be implemented soon