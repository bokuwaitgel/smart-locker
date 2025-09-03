# Container API Endpoints

## Authentication Required
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Public Endpoints (All authenticated users)
- `GET /containers` - Get all containers
- `GET /containers/stats` - Get container statistics
- `GET /containers/:id` - Get container by ID
- `GET /containers/board/:boardId` - Get container by board ID
- `GET /containers/:boardId/lockers` - Get all lockers in a container

### Admin Only Endpoints
- `POST /containers` - Create a new container
- `PUT /containers/:id` - Update a container
- `PUT /containers/:id/status` - Update container status
- `DELETE /containers/:id` - Delete a container

## Example Requests

### Create Container (Admin only)
```json
POST /containers
{
  "boardId": "BOARD_001",
  "location": "Main Entrance",
  "description": "Container near the main entrance"
}
```

### Update Container Status (Admin only)
```json
PUT /containers/1/status
{
  "status": "ACTIVE"
}
```

### Get Container Statistics
```json
GET /containers/stats
// Returns: total containers, active/inactive/maintenance counts, total lockers
```
