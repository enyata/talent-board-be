# 📚 Talent Board — Backend API

Welcome to the **Talent Board API** repository.  
This project provides the backend server to manage **authentication (Google/LinkedIn OAuth)**, **user onboarding**, and **future recruiter-talent matching features**.

Built with **Node.js**, **Express**, **TypeScript**, **PostgreSQL**, **TypeORM**, **Passport.js**, and **Jest** for testing.

---

## 🏗️ Project Structure

```md
├── README.md
├── commitlint.config.ts
├── config
│ ├── corsOptions.ts
│ ├── default.ts
│ ├── helmetOptions.ts
│ ├── hppOptions.ts
│ ├── swaggerConfig.ts
│ └── test.ts
├── docker-compose.yml
├── jest.config.ts
├── package.json
├── src
│ ├── **tests**
│ │ ├── google.strategy.test.ts
│ │ ├── googleAuth.controller.test.ts
│ │ ├── googleAuth.service.test.ts
│ │ └── jwt.test.ts
│ ├── app.ts
│ ├── auth
│ │ ├── auth.constants.ts
│ │ ├── auth.route.ts
│ │ ├── google
│ │ │ ├── google.controller.ts
│ │ │ ├── google.interface.ts
│ │ │ ├── google.service.ts
│ │ │ └── google.strategy.ts
│ │ ├── linkedin
│ │ │ ├── linkedin.controller.ts
│ │ │ ├── linkedin.interface.ts
│ │ │ ├── linkedin.service.ts
│ │ │ └── linkedin.strategy.ts
│ │ └── loadStrategies.ts
│ ├── datasource.ts
│ ├── docs
│ │ ├── auth.docs.ts
│ │ └── health.docs.ts
│ ├── entities
│ │ ├── base.entity.ts
│ │ ├── refreshToken.entity.ts
│ │ └── user.entity.ts
│ ├── exceptions
│ │ ├── appError.ts
│ │ ├── clientError.ts
│ │ ├── conflictError.ts
│ │ ├── forbiddenError.ts
│ │ ├── methodNotAllowedError.ts
│ │ ├── notFoundError.ts
│ │ └── unauthorizedError.ts
│ ├── index.ts
│ ├── interfaces
│ │ └── index.ts
│ ├── middlewares
│ │ ├── asyncHandler.ts
│ │ ├── errorHandler.ts
│ │ └── validateData.ts
│ ├── migrations
│ │ └── 1745418605537-migration.ts
│ ├── queues
│ ├── routes
│ │ └── index.route.ts
│ ├── schemas
│ ├── seeders
│ │ └── testSeeder.ts
│ ├── templates
│ │ └── emails
│ ├── types
│ │ └── express.d.ts
│ ├── utils
│ │ ├── createHttpsAgent.ts
│ │ ├── createSendToken.ts
│ │ ├── jwt.ts
│ │ ├── logger.ts
│ │ └── sanitizeUser.ts
│ └── workers
├── tsconfig.jest.json
├── tsconfig.json
└── yarn.lock
```

✅ The project follows **modular structure** with **domain-driven design** principles for scalability and maintainability.

---

## 🛠️ Technologies Used

- **Node.js** + **Express**
- **TypeScript** (strict mode)
- **PostgreSQL** + **TypeORM**
- **Passport.js** (OAuth 2.0)
- **Swagger** (API Documentation)
- **Jest** (Testing)
- **Docker** (PostgreSQL setup)
- **Helmet** + **CORS** + **HPP** (Security best practices)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/enyata-community/talent-board-be.git
cd talent-board-be
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Setup `.env`

Create a `.env` file with the following:

```env
PORT=8000
NODE_ENV=development
DATABASE_URL=postgres://user:password@localhost:5432/talent_board
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
BASE_URL=https://localhost:8000
API_PREFIX=api/v1
EMAIL_PROVIDER=gmail
EMAIL_FROM=no-reply@yourdomain.com
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_PASSWORD=your_gmail_app_password
```

For local email testing with Gmail, set `EMAIL_PROVIDER=gmail`, and use an App Password if your Google account has 2FA enabled.

If you prefer a local SMTP sandbox, use Mailtrap or another SMTP provider and set:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your_mailtrap_user
SMTP_PASSWORD=your_mailtrap_password
```

The email sender is implemented in `src/utils/email.ts`, so changing the env values lets you swap providers without changing the signup flow.

### 4. Database Setup

```bash
# Start development services (Postgres, Redis, Adminer, and Backend)
docker compose --profile dev up -d
```

#### Run Migrations

If running the application via Docker:

```bash
docker compose exec backend yarn migration:run
```

If running the application locally:

```bash
yarn migration:run
```

### 5. Run in Development

If running locally:

```bash
yarn dev
```

Adminer (database UI) will be available at:

```text
http://localhost:8090
```

Server will run on:  
🔗 `https://localhost:8000`

Swagger Docs available at:  
📄 `https://localhost:8000/docs`

---

## 🔥 Available Scripts

| Script            | Description                            |
| :---------------- | :------------------------------------- |
| `yarn dev`        | Start in development mode (hot reload) |
| `yarn build`      | Build TypeScript code for production   |
| `yarn start`      | Run built code                         |
| `yarn test`       | Run all Jest tests                     |
| `yarn test:watch` | Watch mode for tests                   |
| `yarn lint`       | Lint project with ESLint               |
| `yarn format`     | Auto-format code with Prettier         |

---

## 🧪 Testing

```bash
yarn test
```

Testing framework:  
✅ **Jest**  
✅ Test files are placed under `src/__tests__/`.

---

## 📄 API Documentation (Swagger)

Available at:  
🔗 [`https://localhost:8000/docs`](https://localhost:8000/docs)

Auto-generated from the files in `src/docs/`.

---

## 🛡️ Security Measures

- CORS Configured
- Helmet Headers
- HPP (HTTP Parameter Pollution Prevention)
- Cookie-based Security
- JWT Access and Refresh Tokens

---

## 🛤️ Future Improvements

- Background Workers (Redis, BullMQ) for email notifications
- Full Notification System
- Recruiter → Talent Matching Engine
- Wallet and Payments Integration

---
