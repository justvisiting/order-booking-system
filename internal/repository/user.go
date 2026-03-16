package repository

import (
	"context"

	"github.com/jmoiron/sqlx"
	"order-system/internal/model"
)

type UserRepository interface {
	GetByUsername(ctx context.Context, username string) (*model.User, error)
	GetByID(ctx context.Context, id int64) (*model.User, error)
	Create(ctx context.Context, user *model.User) (int64, error)
}

type userRepo struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) GetByUsername(ctx context.Context, username string) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u,
		`SELECT id, username, password_hash, role, is_active, created_at, updated_at FROM users WHERE username = ?`, username)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) GetByID(ctx context.Context, id int64) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u,
		`SELECT id, username, password_hash, role, is_active, created_at, updated_at FROM users WHERE id = ?`, id)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) Create(ctx context.Context, user *model.User) (int64, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, ?, true)`,
		user.Username, user.PasswordHash, user.Role)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}
