# Locker API Endpoints

## Authentication Required
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Public Endpoints (All authenticated users)
- `GET /lockers` - Get all lockers
- `GET /lockers/stats` - Get locker statistics
- `GET /lockers/available` - Get all available lockers
- `GET /lockers/:id` - Get locker by ID
- `GET /lockers/number/:lockerNumber` - Get locker by locker number
- `GET /lockers/status/:lockerNumber` - Get locker status by locker number
- `GET /lockers/container/:boardId` - Get all lockers in a container

### Admin Only Endpoints
- `POST /lockers` - Create a new locker
- `PUT /lockers/:id` - Update a locker
- `PUT /lockers/:id/status` - Update locker status
- `PUT /lockers/bulk/status` - Bulk update locker statuses
- `DELETE /lockers/:id` - Delete a locker

## Example Requests

### Create Locker (Admin only)
```json
POST /lockers
{
  "boardId": "BOARD_001",
  "lockerNumber": "L001",
  "description": "Small locker for packages"
}
```

### Update Locker Status (Admin only)
```json
PUT /lockers/1/status
{
  "status": "AVAILABLE"
}
```

### Bulk Update Lockers (Admin only)
```json
PUT /lockers/bulk/status
{
  "lockerIds": [1, 2, 3, 4, 5],
  "status": "AVAILABLE"
}
```

### Get Available Lockers
```json
GET /lockers/available?boardId=BOARD_001
```

### Get Locker Statistics
```json
GET /lockers/stats
// Returns: total, available, occupied, pending, maintenance counts
```

### Get Lockers by Container
```json
GET /lockers/container/BOARD_001
// Returns all lockers in the specified container
```

## Status Values
- `AVAILABLE` - Locker is free to use
- `OCCUPIED` - Locker is currently in use
- `PENDING` - Locker is newly created, needs setup
- `MAINTENANCE` - Locker is under maintenance

## Query Parameters
- `boardId` - Filter results by container board ID
- `lockerNumber` - Specific locker number to query

## Error Responses
- `400` - Bad Request (validation errors, duplicate entries)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (locker/container doesn't exist)
