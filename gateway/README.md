# Chat Service

This gateway proxies requests to the User, Chat, and Notification microservices.

## API Endpoints

All endpoints are accessible via the Chat base URL (e.g., `http://localhost:8080` or through nginx at `http://localhost:85/api`).

### User Service (Auth)
- `POST   /api/auth/login`         → User login
- `POST   /api/auth/register`      → User registration
- `GET    /api/auth/profile`       → Get user profile
- `GET    /api/auth/me`            → Get user profile
- `GET    /api/auth/all`            → Get users

- (Other user-related endpoints as defined in user-service)

### Chat Service (Messages)
- `POST   /api/messages/send`      → Send a message
- `GET    /api/messages/history`   → Get message history
- (Other chat/message endpoints as defined in chat-service)

### Notification Service
- `POST   /api/notifications/send` → Send a notification
- `GET    /api/notifications/list` → List notifications
- (Other notification endpoints as defined in notification-service)

## Usage Example

```
POST http://localhost:8080/api/auth/login
POST http://localhost:8080/api/messages/send
GET  http://localhost:8080/api/notifications/list
```

> Note: The exact endpoints available depend on the routes defined in each microservice. 