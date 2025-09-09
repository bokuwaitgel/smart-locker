# Payment API Endpoints

## Authentication Required
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## QPay Integration
This API integrates with QPay (Mongolian payment gateway) for processing payments.

## Endpoints

### Public Endpoints (All authenticated users)
- `GET /payments` - Get all payments
- `GET /payments/stats` - Get payment statistics
- `GET /payments/:id` - Get payment by ID
- `GET /payments/delivery/:deliveryId` - Get payments by delivery ID
- `GET /payments/history/user` - Get payment history for current user
- `GET /payments/check/:invoiceId` - Check payment status by invoice ID
- `POST /payments/verify/:paymentId/:deliveryId` - Verify payment (QPay callback)
- `GET /payments/verify/:paymentId/:deliveryId` - Legacy verify endpoint

### Admin Only Endpoints
- `POST /payments/invoice` - Create a payment invoice
- `POST /payments/create` - Create a payment (legacy)
- `GET /payments/history/all` - Get all payment history
- `DELETE /payments/:id/cancel` - Cancel a payment

## Example Requests

### Create Payment Invoice
```json
POST /payments/invoice
{
  "deliveryId": 123,
  "amount": 5000,
  "description": "Payment for smart locker service"
}
```

### Get Payment Statistics
```json
GET /payments/stats
// Returns: total payments, paid/unpaid/failed counts, total/paid amounts
```

### Verify Payment (QPay Callback)
```json
POST /payments/verify/123/456
// This is typically called by QPay when payment is completed
```

### Check Payment by Invoice ID
```json
GET /payments/check/invoice_123456789
// Returns payment details for the given invoice
```

### Cancel Payment (Admin only)
```json
DELETE /payments/123/cancel
// Only unpaid payments can be cancelled
```

## Payment Flow

1. **Create Invoice**: Client creates payment invoice with delivery details
2. **QPay Processing**: User is redirected to QPay for payment
3. **Payment Verification**: QPay calls verify endpoint when payment completes
4. **Status Update**: Payment and delivery status are updated
5. **SMS Notification**: User receives SMS with pickup code

## Payment Statuses
- `UNPAID` - Payment created but not yet paid
- `PAID` - Payment successfully completed
- `FAILED` - Payment failed or was cancelled

## Environment Variables Required
```env
QPAY_USERNAME=your_qpay_username
QPAY_PASSWORD=your_qpay_password
BASE_URL=http://localhost:3030/api
```

## Error Responses
- `400` - Bad Request (validation errors, duplicate payments)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (payment/delivery not found)
- `502` - Bad Gateway (QPay service error)

## QPay Integration Details

### Invoice Creation
- Creates invoice in QPay system
- Generates QR code for mobile payment
- Sets up callback URL for payment verification

### Token Management
- Automatically handles QPay authentication tokens
- Refreshes tokens when expired
- Stores tokens securely in database

### Payment Verification
- Checks payment status with QPay
- Updates local payment records
- Sends SMS notifications
- Updates delivery order status

## Security Features
- JWT authentication on all endpoints
- Role-based access control
- Input validation and sanitization
- Secure token storage
- Error handling without exposing sensitive data
