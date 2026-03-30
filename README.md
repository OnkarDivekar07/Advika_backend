# Advika Flowers Inventory — v2.0

Backend rewritten following **Backend 2.0** architecture patterns.

## Stack
- **Runtime**: Node.js / Express 4
- **ORM**: Sequelize (MySQL)
- **Auth**: JWT (Bearer token)
- **Validation**: express-validator
- **Image storage**: AWS S3 + Sharp compression
- **Notifications**: WhatsApp Business API, Nodemailer
- **Security**: Helmet, CORS
- **Logging**: Morgan

## Project Structure
```
├── server.js                  # Entry point
├── src/
│   ├── app.js                 # Express app + middleware + cron
│   ├── config/
│   │   ├── env.js             # Validated env loader
│   │   └── multer.js          # Multer config
│   ├── middlewares/
│   │   ├── authenticate.js    # JWT auth
│   │   ├── authorizeAdmin.js  # Admin role guard
│   │   ├── errorHandler.js    # Global error handler
│   │   ├── responseMiddleware.js # res.sendResponse()
│   │   └── validateRequest.js # express-validator runner
│   ├── modules/               # Feature modules (controller / service / routes / validation)
│   │   ├── customerCount/
│   │   ├── email/
│   │   ├── finance/
│   │   ├── missingItem/
│   │   ├── product/
│   │   ├── purchaseOrder/
│   │   ├── qr/
│   │   ├── reorder/
│   │   ├── repayment/
│   │   ├── supplier/
│   │   ├── transaction/
│   │   ├── user/
│   │   └── webhook/
│   ├── routes/
│   │   └── apiRoutes.js       # Central route registry
│   ├── services/
│   │   ├── autoOrder/         # Auto purchase order generation
│   │   ├── supplier/          # Supplier lookup + WhatsApp dispatch
│   │   └── whatsapp/          # WhatsApp Business API client
│   └── utils/
│       ├── AWSUploads.js
│       ├── customError.js
│       ├── db.js
│       ├── generateToken.js
│       └── sendResponse.js
├── models/                    # Sequelize model definitions + associations
├── migrations/
├── seeders/
├── config/config.js           # Sequelize CLI config
├── view/                      # Server-rendered HTML pages
└── public/                    # Static assets (CSS / JS)
```

## API Base URL
```
/api
```

## Setup
1. Copy `.env.example` → `.env` and fill in all values
2. `npm install`
3. `npm run migrate`
4. `npm run seed`
5. `npm start`

## Environment Variables
```
PORT=5000
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
JWT_SECRET=
ADMIN_EMAIL=
EMAIL_USER=
EMAIL_PASSWORD=
RECIVER_EMAIL=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
BUCKET_NAME=
WA_PHONE_NUMBER_ID=
WA_ACCESS_TOKEN=
VERIFY_TOKEN=
```
