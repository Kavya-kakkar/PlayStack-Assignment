<div align="center">

# 🏢 Employee Management System (EMS)

**A production-quality, full-stack Employee Management System built as a hiring assignment.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.x-green?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## 📸 Screenshots

### Dashboard — Stats & Department Overview
![Dashboard](https://raw.githubusercontent.com/Kavya-kakkar/PlayStack-Assignment/master/docs/screenshots/dashboard.png)

### Employees — Paginated List with Search & Filters
![Employees](https://raw.githubusercontent.com/Kavya-kakkar/PlayStack-Assignment/master/docs/screenshots/employees.png)

### Organization Chart — Collapsible Hierarchy Tree
![Org Chart](https://raw.githubusercontent.com/Kavya-kakkar/PlayStack-Assignment/master/docs/screenshots/org-chart.png)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **JWT Authentication** | Secure login with bcrypt-hashed passwords, token stored in localStorage |
| 👥 **Role-Based Access Control** | Three roles: Super Admin, HR Manager, Employee — each with scoped permissions |
| 📋 **Employee CRUD** | Create, Read, Update, Soft-Delete with full audit trail |
| 🔍 **Search & Filter** | Debounced search by name/email/ID, filter by role/status/dept, sort by name/date |
| 🏗️ **Org Hierarchy Tree** | Collapsible org chart with circular-reference prevention |
| 📊 **Dashboard Analytics** | Employee stats with department breakdown bar chart |
| 📄 **Pagination** | Server-side paginated employee listing |
| ✅ **Shared Validation** | Zod schemas shared between frontend and backend |

---

## 🛡️ RBAC Matrix

| Action | Super Admin | HR Manager | Employee |
|---|:---:|:---:|:---:|
| View all employees | ✅ | ✅ | ❌ (own only) |
| Create employee | ✅ | ✅ | ❌ |
| Edit employee (full) | ✅ | ✅ | ❌ |
| Edit own phone | ✅ | ✅ | ✅ |
| Change roles | ✅ | ✅ (not to SA) | ❌ |
| Soft-delete employee | ✅ | ❌ | ❌ |
| View dashboard stats | ✅ | ✅ | ❌ |
| View org chart | ✅ | ✅ | ✅ (own branch) |
| Assign reporting manager | ✅ | ✅ | ❌ |

---

## 🏗️ Tech Stack

```
ems/                          ← npm workspace monorepo
├── apps/
│   ├── api/                  ← Node.js + Express + TypeScript
│   │   ├── src/
│   │   │   ├── routes/       ← auth, employee, organization, dashboard
│   │   │   ├── middleware/   ← JWT auth, RBAC
│   │   │   └── index.ts      ← Express server entry
│   │   └── prisma/
│   │       ├── schema.prisma ← Employee & Department models
│   │       └── seed.ts       ← 17 seeded employees across 4 depts
│   └── web/                  ← Next.js 16 (App Router) + Tailwind CSS
│       └── src/app/
│           ├── login/        ← Auth page with demo shortcuts
│           ├── dashboard/    ← Stats + dept chart
│           ├── employees/    ← List, Detail/Edit, New
│           └── organization/ ← Collapsible org tree
└── packages/
    └── shared/               ← Shared Zod schemas (used by API + Web)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/Kavya-kakkar/PlayStack-Assignment.git
cd PlayStack-Assignment
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
Create `apps/api/.env`:
```env
DATABASE_URL="postgresql://user:pass@ep-xxxx.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-secret-key"
PORT=3001
```

> ⚠️ Use the **direct connection URL** from Neon (without `-pooler` in the hostname) for Prisma compatibility.

### 4. Set up the database
```bash
cd apps/api
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 5. Start the app
Open **two terminals**:

**Terminal 1 — API (port 3001)**
```bash
cd apps/api
npx nodemon --watch src --ext ts --exec "npx tsx src/index.ts"
```

**Terminal 2 — Frontend (port 3000)**
```bash
cd apps/web
npm run dev
```

Open **http://localhost:3000** 🎉

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 👑 Super Admin | `admin@company.com` | `password123` |
| 👤 HR Manager | `hr1@company.com` | `password123` |
| 🧑‍💻 HR Manager 2 | `hr2@company.com` | `password123` |
| 👷 Director | `director@company.com` | `password123` |
| 💻 Engineer | `se1@company.com` | `password123` |

---

## 🗃️ Database Schema

```prisma
model Employee {
  id                String     @id @default(cuid())
  employeeId        String     @unique
  name              String
  email             String     @unique
  passwordHash      String
  phone             String
  designation       String
  salary            Float
  joiningDate       DateTime
  status            Status     @default(ACTIVE)
  role              Role       @default(EMPLOYEE)
  profileImageUrl   String?
  departmentId      String
  reportingManagerId String?
  deletedAt         DateTime?
  department        Department @relation(...)
  reportingManager  Employee?  @relation("Hierarchy", ...)
  reportees         Employee[] @relation("Hierarchy")
}

model Department {
  id        String     @id @default(cuid())
  name      String     @unique
  employees Employee[]
}
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login, returns JWT |
| `POST` | `/api/auth/logout` | Logout |

### Employees
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/employees` | All | Paginated, filtered list |
| `POST` | `/api/employees` | Admin, HR | Create employee |
| `GET` | `/api/employees/:id` | Scoped | Get by ID |
| `PUT` | `/api/employees/:id` | Scoped | Update employee |
| `DELETE` | `/api/employees/:id` | Admin | Soft delete |

### Organization
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/organization/tree` | Full org hierarchy as nested JSON |
| `PATCH` | `/api/organization/:id/manager` | Assign manager (with circular-ref check) |
| `GET` | `/api/organization/:id/reportees` | Direct reports of an employee |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Stats: total, active, inactive, by dept |
| `GET` | `/api/departments` | All departments (for dropdowns) |

---

## 🧑‍💻 Author

**Kavya Kakkar**
- GitHub: [@Kavya-kakkar](https://github.com/Kavya-kakkar)

---

<div align="center">
Built with ❤️ as a PlayStack hiring assignment
</div>
