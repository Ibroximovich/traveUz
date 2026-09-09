import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🌍 Tripuz Turizm Marketplace API',
      version: '1.0.0',
      description: `
## Tripuz — Samarqand Turizm Platformasi

Tripuz — turistlar va mahalliy gidlarni bog\'lovchi online marketplace.
Bu API orqali siz:
- **Google OAuth** bilan tizimga kirishingiz
- **Experience (Turlar)** ro\'yxatini ko\'rishingiz
- **Booking (Buyurtma)** yaratishingiz
- **To\'lov** amalga oshirishingiz
- **Gid paneli** orqali o\'z turlaringizni boshqarishingiz
- **Admin paneli** orqali platformani nazorat qilishingiz mumkin

### Authentication
JWT Bearer token talab qilinadi. Avval \`POST /api/auth/google\` orqali token oling.

### Rollar
| Rol | Huquqlar |
|-----|----------|
| TOURIST | Turlarni ko\'rish, buyurtma berish |
| GUIDE | O\'z turlarini boshqarish, booking statusini yangilash |
| ADMIN | Barcha operatsiyalar, komissiya hisoboti |
      `,
      contact: {
        name: 'Tripuz Team',
        email: 'admin@tripuz.uz',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.port}/api`,
        description: 'Development Server',
      },
      {
        url: 'https://api.tripuz.uz/api',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'POST /api/auth/google dan olingan JWT access token',
        },
      },
      schemas: {
        // ─── User ────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxyz123abc' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', example: 'Ali Valiyev' },
            avatar: { type: 'string', nullable: true, example: 'https://...' },
            role: { type: 'string', enum: ['TOURIST', 'GUIDE', 'ADMIN'], example: 'TOURIST' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Experience ───────────────────────────────────────
        Experience: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxyz456def' },
            title: { type: 'string', example: 'Registon maydoni sayohati' },
            description: { type: 'string', example: "Samarqandning eng go'zal joyi..." },
            city: { type: 'string', example: 'Samarqand' },
            price: { type: 'number', format: 'float', example: 150000 },
            duration: { type: 'string', example: '4 soat' },
            meetingPoint: { type: 'string', example: 'Registon maydoni, sharq darvoza' },
            images: {
              type: 'array',
              items: { type: 'string', format: 'uri' },
              example: ['https://upload.wikimedia.org/...'],
            },
            guideId: { type: 'string', example: 'clxyz789ghi' },
            guide: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string', example: 'Jasur Karimov' },
                avatar: { type: 'string', nullable: true },
              },
            },
            availableDates: {
              type: 'array',
              items: { $ref: '#/components/schemas/AvailableDate' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── AvailableDate ────────────────────────────────────
        AvailableDate: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxyz111jkl' },
            experienceId: { type: 'string' },
            date: { type: 'string', format: 'date-time', example: '2026-09-15T09:00:00Z' },
            slots: { type: 'integer', example: 12 },
          },
        },
        // ─── Booking ─────────────────────────────────────────
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxyz222mno' },
            userId: { type: 'string' },
            experienceId: { type: 'string' },
            dateId: { type: 'string' },
            participantsCount: { type: 'integer', example: 2 },
            totalPrice: { type: 'number', format: 'float', example: 300000 },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
              example: 'PENDING',
            },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'REFUNDED'],
              example: 'PENDING',
            },
            voucherCode: { type: 'string', example: 'TRP-A1B2C3D4' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Error Responses ──────────────────────────────────
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
              example: { email: ['Invalid email format'] },
            },
          },
        },
        // ─── Success Response wrapper ─────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        // ─── Pagination Meta ──────────────────────────────────
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 12 },
            total: { type: 'integer', example: 25 },
            totalPages: { type: 'integer', example: 3 },
          },
        },
        // ─── Commission Report ────────────────────────────────
        CommissionReport: {
          type: 'object',
          properties: {
            guideId: { type: 'string' },
            guideName: { type: 'string', example: 'Jasur Karimov' },
            guideEmail: { type: 'string', format: 'email' },
            totalBookings: { type: 'integer', example: 15 },
            totalRevenue: { type: 'number', example: 2250000 },
            platformCommission: { type: 'number', example: 337500 },
            netPayout: { type: 'number', example: 1912500 },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Token taqdim etilmagan yoki yaroqsiz',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Authentication required. Please provide a valid Bearer token.' },
            },
          },
        },
        Forbidden: {
          description: "Bu amalni bajarish uchun ruxsat yo'q",
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Access denied. Required role(s): ADMIN' },
            },
          },
        },
        NotFound: {
          description: 'Resurs topilmadi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Experience not found' },
            },
          },
        },
        ValidationFailed: {
          description: "Ma'lumotlar validatsiyadan o'tmadi",
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Server holati' },
      { name: 'Auth', description: "Autentifikatsiya — Google OAuth va JWT" },
      { name: 'Experiences', description: "Turlar (public — hamma ko'ra oladi)" },
      { name: 'Bookings', description: "Buyurtmalar (TOURIST)" },
      { name: 'Payments', description: "To'lovlar (TOURIST)" },
      { name: 'Guide', description: "Gid paneli (GUIDE, ADMIN)" },
      { name: 'Admin', description: "Admin paneli (ADMIN only)" },
    ],
    paths: {
      // ─── HEALTH ───────────────────────────────────────────────────────────────
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Server holati',
          description: 'API server ishlayotganini tekshirish uchun',
          responses: {
            200: {
              description: 'Server ishlamoqda',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Tripuz API is running' },
                      timestamp: { type: 'string', format: 'date-time' },
                      version: { type: 'string', example: '1.0.0' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ─── AUTH ─────────────────────────────────────────────────────────────────
      '/auth/google': {
        post: {
          tags: ['Auth'],
          summary: 'Google orqali kirish',
          description: `
Frontend'dan olingan Google ID token'ni yuborib, JWT access/refresh token olish.

**Dev (test) rejimi:** \`GOOGLE_CLIENT_ID=mock\` bo'lsa, base64-encoded JSON yuborishingiz mumkin:
\`\`\`js
const token = btoa(JSON.stringify({ sub: "12345", email: "test@gmail.com", name: "Test User", picture: "https://..." }));
\`\`\`
          `,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['idToken'],
                  properties: {
                    idToken: {
                      type: 'string',
                      description: "Google Firebase yoki Google Sign-In'dan olingan ID token",
                      example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ii...',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Muvaffaqiyatli kirish",
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Login successful' },
                      data: {
                        type: 'object',
                        properties: {
                          accessToken: { type: 'string', example: 'eyJhbGci...' },
                          refreshToken: { type: 'string', example: 'eyJhbGci...' },
                          user: { $ref: '#/components/schemas/User' },
                        },
                      },
                    },
                  },
                },
              },
            },
            422: { $ref: '#/components/responses/ValidationFailed' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: "Mening profilim",
          description: "Joriy JWT token egasining to'liq profilini qaytaradi",
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: "Foydalanuvchi profili",
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: { user: { $ref: '#/components/schemas/User' } },
                      },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      // ─── EXPERIENCES ──────────────────────────────────────────────────────────
      '/experiences': {
        get: {
          tags: ['Experiences'],
          summary: "Turlar ro'yxati",
          description: "Shahar bo'yicha filtrlangan, sahifalangan turlar ro'yxati",
          parameters: [
            {
              in: 'query',
              name: 'city',
              schema: { type: 'string', default: 'Samarqand' },
              description: "Shahar nomi bo'yicha filter",
              example: 'Samarqand',
            },
            {
              in: 'query',
              name: 'page',
              schema: { type: 'integer', default: 1, minimum: 1 },
              description: 'Sahifa raqami',
            },
            {
              in: 'query',
              name: 'limit',
              schema: { type: 'integer', default: 12, minimum: 1, maximum: 50 },
              description: "Har sahifadagi yozuvlar soni",
            },
          ],
          responses: {
            200: {
              description: "Turlar ro'yxati",
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Experience' },
                      },
                      meta: { $ref: '#/components/schemas/PaginationMeta' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/experiences/{id}': {
        get: {
          tags: ['Experiences'],
          summary: "Bitta tur ma'lumotlari",
          description: "To'liq tavsif, rasmlar, gid profili va mavjud sanalar",
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
              description: 'Experience ID (cuid)',
              example: 'clxyz456def',
            },
          ],
          responses: {
            200: {
              description: "To'liq tur ma'lumotlari",
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Experience' },
                    },
                  },
                },
              },
            },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ─── BOOKINGS ─────────────────────────────────────────────────────────────
      '/bookings': {
        post: {
          tags: ['Bookings'],
          summary: 'Yangi buyurtma yaratish',
          description: "PENDING statusida booking yaratadi va noyob voucher kodi generatsiya qiladi. To'lash uchun /payments/checkout ga murojaat qiling.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['experienceId', 'dateId', 'participantsCount'],
                  properties: {
                    experienceId: { type: 'string', example: 'clxyz456def', description: 'Experience ID' },
                    dateId: { type: 'string', example: 'clxyz111jkl', description: 'AvailableDate ID' },
                    participantsCount: { type: 'integer', minimum: 1, maximum: 50, example: 2 },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Booking yaratildi",
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Booking created. Please complete payment to confirm.' },
                      data: { $ref: '#/components/schemas/Booking' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
            409: {
              description: "Joy yetarli emas",
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Not enough slots available. Only 3 slot(s) remaining.' },
                },
              },
            },
            422: { $ref: '#/components/responses/ValidationFailed' },
          },
        },
      },
      '/bookings/my': {
        get: {
          tags: ['Bookings'],
          summary: "Mening buyurtmalarim",
          description: "Autentifikatsiya qilingan turistning barcha buyurtmalari",
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: "Buyurtmalar ro'yxati",
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      // ─── PAYMENTS ─────────────────────────────────────────────────────────────
      '/payments/checkout': {
        post: {
          tags: ['Payments'],
          summary: "Mock to'lov (Checkout)",
          description: `
PENDING booking uchun mock to'lov jarayoni. To'lov muvaffaqiyatli bo'lsa:
- Booking status: **CONFIRMED**
- Payment status: **PAID**  
- Slot soni kamayadi

⚠️ Bu MVP uchun mock to'lov. Haqiqiy to'lov tizimi (Payme, Click, Stripe) keyingi bosqichda qo'shiladi.
          `,
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['bookingId', 'card'],
                  properties: {
                    bookingId: { type: 'string', example: 'clxyz222mno' },
                    card: {
                      type: 'object',
                      required: ['number', 'expiry', 'cvv', 'holderName'],
                      properties: {
                        number: { type: 'string', pattern: '^\\d{16}$', example: '4111111111111111' },
                        expiry: { type: 'string', pattern: '^(0[1-9]|1[0-2])\\/\\d{2}$', example: '12/27' },
                        cvv: { type: 'string', pattern: '^\\d{3,4}$', example: '123' },
                        holderName: { type: 'string', example: 'ALI VALIYEV' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "To'lov muvaffaqiyatli",
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Payment successful! Your booking is confirmed.' },
                      data: {
                        type: 'object',
                        properties: {
                          booking: { $ref: '#/components/schemas/Booking' },
                          voucherCode: { type: 'string', example: 'TRP-A1B2C3D4' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            409: {
              description: "Booking allaqachon to'langan yoki bekor qilingan",
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            422: { $ref: '#/components/responses/ValidationFailed' },
          },
        },
      },

      // ─── GUIDE ────────────────────────────────────────────────────────────────
      '/guide/experiences': {
        get: {
          tags: ['Guide'],
          summary: "Mening turlarim (Gid)",
          description: "Gid o'zi yaratgan barcha turlarni ko'radi",
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: "Gidning turlari",
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Experience' } },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/guide/bookings': {
        get: {
          tags: ['Guide'],
          summary: "Turlarimga kelgan buyurtmalar (Gid)",
          description: "Gidning barcha turlariga kelgan buyurtmalar: kim, qachon, nechta kishi",
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: "Buyurtmalar ro'yxati",
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/guide/bookings/{id}/status': {
        patch: {
          tags: ['Guide'],
          summary: 'Buyurtma statusini yangilash (Gid)',
          description: "Faqat o'zining turlaridagi buyurtmalarni yangilashi mumkin. COMPLETED faqat CONFIRMEDdan o'tkaziladi.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
              description: 'Booking ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['CONFIRMED', 'COMPLETED', 'CANCELLED'],
                      example: 'CONFIRMED',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Status yangilandi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Booking status updated to CONFIRMED' },
                      data: { $ref: '#/components/schemas/Booking' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
            409: {
              description: 'Noto\'g\'ri holat o\'tish',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            422: { $ref: '#/components/responses/ValidationFailed' },
          },
        },
      },

      // ─── ADMIN ────────────────────────────────────────────────────────────────
      '/admin/experiences': {
        post: {
          tags: ['Admin'],
          summary: "Yangi tur qo'shish (Admin)",
          description: "Yangi Experience va unga mos mavjud sanalarni yaratish",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'price', 'duration', 'meetingPoint', 'images', 'guideId'],
                  properties: {
                    title: { type: 'string', minLength: 5, example: 'Registon maydoni sayohati' },
                    description: { type: 'string', minLength: 20, example: "Samarqandning eng go'zal joyi..." },
                    city: { type: 'string', default: 'Samarqand', example: 'Samarqand' },
                    price: { type: 'number', minimum: 0, example: 150000 },
                    duration: { type: 'string', example: '4 soat' },
                    meetingPoint: { type: 'string', example: 'Registon, sharq darvoza' },
                    images: {
                      type: 'array',
                      items: { type: 'string', format: 'uri' },
                      minItems: 1,
                      example: ['https://example.com/img1.jpg'],
                    },
                    guideId: { type: 'string', example: 'clxyz789ghi' },
                    availableDates: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          date: { type: 'string', format: 'date-time', example: '2026-09-20T09:00:00Z' },
                          slots: { type: 'integer', minimum: 1, maximum: 100, example: 12 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Tur yaratildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Experience created successfully' },
                      data: { $ref: '#/components/schemas/Experience' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationFailed' },
          },
        },
      },
      '/admin/bookings': {
        get: {
          tags: ['Admin'],
          summary: "Barcha buyurtmalar (Admin)",
          description: "Platformadagi barcha buyurtmalar, status bo'yicha filter imkoni bilan",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'status',
              schema: {
                type: 'string',
                enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
              },
              description: "Status bo'yicha filter (ixtiyoriy)",
            },
          ],
          responses: {
            200: {
              description: "Barcha buyurtmalar",
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/admin/commissions': {
        get: {
          tags: ['Admin'],
          summary: 'Komissiya hisoboti (Admin)',
          description: `
Har bir gid uchun komissiya hisoboti:
- **Umumiy daromad** — barcha to'langan buyurtmalarning jami summasi
- **Platforma komissiyasi** — standart ${env.commissionRate * 100}%
- **Gidga to'lov** — komissiyadan keyingi xolda

Shuningdek, umumiy platforma statistikasi ham qaytariladi.
          `,
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Komissiya hisoboti',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          platformStats: {
                            type: 'object',
                            properties: {
                              totalUsers: { type: 'integer', example: 45 },
                              totalExperiences: { type: 'integer', example: 8 },
                              totalBookings: { type: 'integer', example: 120 },
                              totalRevenue: { type: 'number', example: 18000000 },
                              platformCommission: { type: 'number', example: 2700000 },
                              commissionRate: { type: 'number', example: 0.15 },
                            },
                          },
                          commissionByGuide: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/CommissionReport' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
