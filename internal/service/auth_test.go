package service

import (
	"context"
	"testing"
	"time"

	"order-system/internal/config"
	"order-system/internal/model"
)

// mockUserRepo implements repository.UserRepository for testing
type mockUserRepo struct {
	users    map[string]*model.User
	usersMap map[int64]*model.User
	nextID   int64
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{
		users:    make(map[string]*model.User),
		usersMap: make(map[int64]*model.User),
		nextID:   1,
	}
}

func (m *mockUserRepo) GetByUsername(ctx context.Context, username string) (*model.User, error) {
	u, ok := m.users[username]
	if !ok {
		return nil, errNotFound
	}
	return u, nil
}

func (m *mockUserRepo) GetByID(ctx context.Context, id int64) (*model.User, error) {
	u, ok := m.usersMap[id]
	if !ok {
		return nil, errNotFound
	}
	return u, nil
}

func (m *mockUserRepo) Create(ctx context.Context, user *model.User) (int64, error) {
	id := m.nextID
	m.nextID++
	user.ID = id
	user.IsActive = true
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	m.users[user.Username] = user
	m.usersMap[id] = user
	return id, nil
}

var testJWTConfig = config.JWTConfig{
	Secret: "test-secret-key",
	Expiry: time.Hour,
}

func TestAuthService_CreateUser(t *testing.T) {
	repo := newMockUserRepo()
	svc := NewAuthService(repo, testJWTConfig)

	user, err := svc.CreateUser(context.Background(), model.CreateUserRequest{
		Username: "testuser",
		Password: "password123",
		Role:     model.UserRoleStaff,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if user.ID == 0 {
		t.Error("expected non-zero user ID")
	}
	if user.Username != "testuser" {
		t.Errorf("expected username testuser, got %s", user.Username)
	}
	if user.Role != model.UserRoleStaff {
		t.Errorf("expected role staff, got %s", user.Role)
	}
}

func TestAuthService_CreateUser_DuplicateUsername(t *testing.T) {
	repo := newMockUserRepo()
	svc := NewAuthService(repo, testJWTConfig)

	_, err := svc.CreateUser(context.Background(), model.CreateUserRequest{
		Username: "testuser",
		Password: "password123",
		Role:     model.UserRoleStaff,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	_, err = svc.CreateUser(context.Background(), model.CreateUserRequest{
		Username: "testuser",
		Password: "password456",
		Role:     model.UserRoleStaff,
	})
	if err != ErrUsernameExists {
		t.Errorf("expected ErrUsernameExists, got %v", err)
	}
}

func TestAuthService_CreateUser_InvalidRole(t *testing.T) {
	repo := newMockUserRepo()
	svc := NewAuthService(repo, testJWTConfig)

	_, err := svc.CreateUser(context.Background(), model.CreateUserRequest{
		Username: "testuser",
		Password: "password123",
		Role:     "superadmin",
	})
	if err != ErrInvalidRole {
		t.Errorf("expected ErrInvalidRole, got %v", err)
	}
}

func TestAuthService_LoginAndValidateToken(t *testing.T) {
	repo := newMockUserRepo()
	svc := NewAuthService(repo, testJWTConfig)

	// Create user first
	_, err := svc.CreateUser(context.Background(), model.CreateUserRequest{
		Username: "admin",
		Password: "admin123",
		Role:     model.UserRoleAdmin,
	})
	if err != nil {
		t.Fatalf("unexpected error creating user: %v", err)
	}

	// Login
	resp, err := svc.Login(context.Background(), model.LoginRequest{
		Username: "admin",
		Password: "admin123",
	})
	if err != nil {
		t.Fatalf("unexpected error logging in: %v", err)
	}
	if resp.Token == "" {
		t.Error("expected non-empty token")
	}

	// Validate token
	claims, err := svc.ValidateToken(resp.Token)
	if err != nil {
		t.Fatalf("unexpected error validating token: %v", err)
	}
	if claims.Username != "admin" {
		t.Errorf("expected username admin, got %s", claims.Username)
	}
	if claims.Role != model.UserRoleAdmin {
		t.Errorf("expected role admin, got %s", claims.Role)
	}
}

func TestAuthService_Login_InvalidCredentials(t *testing.T) {
	repo := newMockUserRepo()
	svc := NewAuthService(repo, testJWTConfig)

	_, err := svc.Login(context.Background(), model.LoginRequest{
		Username: "nonexistent",
		Password: "password",
	})
	if err != ErrInvalidCredentials {
		t.Errorf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestAuthService_Login_WrongPassword(t *testing.T) {
	repo := newMockUserRepo()
	svc := NewAuthService(repo, testJWTConfig)

	_, _ = svc.CreateUser(context.Background(), model.CreateUserRequest{
		Username: "user1",
		Password: "correct",
		Role:     model.UserRoleStaff,
	})

	_, err := svc.Login(context.Background(), model.LoginRequest{
		Username: "user1",
		Password: "wrong",
	})
	if err != ErrInvalidCredentials {
		t.Errorf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestAuthService_ValidateToken_Invalid(t *testing.T) {
	repo := newMockUserRepo()
	svc := NewAuthService(repo, testJWTConfig)

	_, err := svc.ValidateToken("invalid.token.here")
	if err == nil {
		t.Error("expected error for invalid token")
	}
}
