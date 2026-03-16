package repository

import (
	"context"

	"github.com/jmoiron/sqlx"
	"order-system/internal/model"
)

type CustomerRepository interface {
	Upsert(ctx context.Context, tx *sqlx.Tx, c *model.CustomerInput) (int64, error)
	GetByPhone(ctx context.Context, phone string) (*model.Customer, error)
	GetByID(ctx context.Context, id int64) (*model.Customer, error)
	List(ctx context.Context, page, perPage int) ([]model.Customer, int, error)
}

type customerRepo struct {
	db *sqlx.DB
}

func NewCustomerRepository(db *sqlx.DB) CustomerRepository {
	return &customerRepo{db: db}
}

func (r *customerRepo) Upsert(ctx context.Context, tx *sqlx.Tx, c *model.CustomerInput) (int64, error) {
	query := `INSERT INTO customers (name, phone, email, address)
		VALUES (?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), address=VALUES(address), updated_at=NOW()`

	var res interface {
		LastInsertId() (int64, error)
	}
	var err error

	if tx != nil {
		res, err = tx.ExecContext(ctx, query, c.Name, c.Phone, c.Email, c.Address)
	} else {
		res, err = r.db.ExecContext(ctx, query, c.Name, c.Phone, c.Email, c.Address)
	}
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	// If ON DUPLICATE KEY UPDATE fires, LastInsertId returns 0.
	// We need to look up the actual ID.
	if id == 0 {
		var cust model.Customer
		selectQuery := `SELECT id FROM customers WHERE phone = ?`
		if tx != nil {
			err = tx.GetContext(ctx, &cust, selectQuery, c.Phone)
		} else {
			err = r.db.GetContext(ctx, &cust, selectQuery, c.Phone)
		}
		if err != nil {
			return 0, err
		}
		id = cust.ID
	}

	return id, nil
}

func (r *customerRepo) GetByPhone(ctx context.Context, phone string) (*model.Customer, error) {
	var c model.Customer
	err := r.db.GetContext(ctx, &c,
		`SELECT id, name, phone, email, address, created_at, updated_at FROM customers WHERE phone = ?`, phone)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *customerRepo) GetByID(ctx context.Context, id int64) (*model.Customer, error) {
	var c model.Customer
	err := r.db.GetContext(ctx, &c,
		`SELECT id, name, phone, email, address, created_at, updated_at FROM customers WHERE id = ?`, id)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *customerRepo) List(ctx context.Context, page, perPage int) ([]model.Customer, int, error) {
	var total int
	err := r.db.GetContext(ctx, &total, `SELECT COUNT(*) FROM customers`)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	var customers []model.Customer
	err = r.db.SelectContext(ctx, &customers,
		`SELECT id, name, phone, email, address, created_at, updated_at FROM customers ORDER BY name LIMIT ? OFFSET ?`,
		perPage, offset)
	if err != nil {
		return nil, 0, err
	}
	return customers, total, nil
}
