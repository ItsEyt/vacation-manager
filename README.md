
# VacationManager | Vacation Request Management App

A fullstack web application to manage employee vacation requests, built with **Vue.js**, **Node.js/Express**, **TypeORM**, and **PostgreSQL**

---
### Design Approach
-  **Separation of concerns**: controllers handle business logic, routes define endpoints, middleware handles validation and errors centrally.
-  **TypeORM EntitySchema** (plain JS, no decorators) for DB schema definition and automatic table sync in development.
-  **Pinia stores** decouple API calls from UI components.
-  **Vue Router** provides two distinct interfaces via `/requester` and `/validator` routes.
-  **Simulated session**: a user picker in the navbar simulates switching between Requester and Validator accounts (no auth required for this prototype).
---
## Prerequisites
-  **Node.js**
-  **PostgreSQL**
-  **npm**
---
## Setup Instructions
### 1. Clone the repository
```bash
git clone https://github.com/ItsEyt/vacation-manager.git
cd vacation-manager
```
### 2. Configure the backend environment
> there are defaults for testing purposes in database connection initialization
```bash
cd backend
cp .env.example  .env
```  
Edit `.env` with your PostgreSQL credentials. 
for example:
```env
PORT=3000
CLIENT_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vacation_db
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_SYNC=true # for testing only
```
### 3. Create the PostgreSQL database
```sql
-- In psql or your DB client:
CREATE DATABASE vacation_db;
```
### 4. Install dependencies
```bash
# From project root
# should install all dependencies for root | backend | frontend
npm install:all # installs concurrently
```
### 5. Populate sample users
```bash
# From project root
# adds 3 test users (2 requesters + 1 validator)
npm run populate
```
This creates:
|Name|Role|
|--|--|
|Alice|Requester|
|Bob|Requester|
|Carol|Validator|

### 6. Run the application
```bash
# From project root - starts both servers concurrently
npm run dev
```
| Service | URL |
|---|---|
| Backend API | http://localhost:3000 |
| Frontend | http://localhost:5173 |
---
## Running Tests
> before running the test you **need** to create a new database for testing
```sql
-- In psql or your DB client:
CREATE DATABASE vacation_test;
```
>then in project root:
```bash
npm test
# or
cd backend && npm test
```
Tests use **Jest + Supertest**

Test coverage includes:
-  `POST /api/requests` - happy path, missing fields, invalid dates, role check
-  `GET /api/requests/user/:userId` - per-user list, unknown user 404
-  `GET /api/requests` - all requests, status filtering, invalid filter 422
-  `PATCH /api/requests/:id/review` - approve, reject (with/without comment), double-review 409
---

## API Reference

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get a user by ID |

### Vacation Requests
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/requests` | Submit a new vacation request |
| GET | `/api/requests` | Get all requests (optional `?status=Pending\|Approved\|Rejected`) |
| GET | `/api/requests/user/:userId` | Get requests for a specific user |
| PATCH | `/api/requests/:id/review` | Approve or reject a request |

#### POST `/api/requests` - body
```json
{
"user_id": 1,
"start_date": "2026-08-01",
"end_date": "2026-08-05",
"reason": "Summer holiday"
}
```
#### PATCH `/api/requests/:id/review` - body
```json
{
"status": "Rejected",
"comments": "Too many people on leave this week"
}
```
>  `comments` is **required** when `status` is `"Rejected"`.
---
## Database Schema
### `users`
| Column | Type | Notes |
|---|---|---|
| id | int (PK) | auto-increment |
| name | varchar(100) | |
| role | enum | `Requester` \| `Validator` |

### `vacation_requests`
| Column | Type | Notes |
|---|---|---|
| id | int (PK) | auto-increment |
| user_id | int (FK → users) | |
| start_date | date | |
| end_date | date | must be ≥ start_date |
| reason | text | nullable |
| status | enum | `Pending` \| `Approved` \| `Rejected` |
| comments | text | nullable; required on Rejected |
| created_at | timestamp | auto-set |
---
## User Interfaces

### Requester Interface (`/requester`)
- Form to submit a vacation request (start date, end date, optional reason)
- Live duration counter
- Full list of your submitted requests with status indicators and manager comments

### Validator Interface (`/validator`)
- Dashboard with counts by status
- Filter bar (All / Pending / Approved / Rejected)
- Table of all requests with Approve / Reject actions
- Reject modal requires a mandatory comment
---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Vue 3, Vite, Vue Router, Pinia, Axios |
| Backend | Node.js, Express, express-validator, CORS |
| ORM | TypeORM (EntitySchema) |
| Database | PostgreSQL |
| Testing | Jest, Supertest |