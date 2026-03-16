package repository

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
	"order-system/internal/model"
)

type ProductRepository interface {
	ListActive(ctx context.Context) ([]model.Product, error)
	GetByID(ctx context.Context, id int64) (*model.Product, error)
	GetByIDs(ctx context.Context, ids []int64) ([]model.Product, error)
	Create(ctx context.Context, p *model.Product) (int64, error)
	Update(ctx context.Context, p *model.Product) error
	SoftDelete(ctx context.Context, id int64) error
	CreateCategory(ctx context.Context, c *model.Category) (int64, error)
	UpdateCategory(ctx context.Context, c *model.Category) error
	GetCategoryByID(ctx context.Context, id int64) (*model.Category, error)
}

type productRepo struct {
	db *sqlx.DB
}

func NewProductRepository(db *sqlx.DB) ProductRepository {
	return &productRepo{db: db}
}

func (r *productRepo) ListActive(ctx context.Context) ([]model.Product, error) {
	var products []model.Product
	query := `SELECT p.id, p.category_id, c.name AS category_name, p.name, p.description, p.price, p.unit, p.is_active, p.created_at, p.updated_at
		FROM products p
		JOIN categories c ON c.id = p.category_id
		WHERE p.is_active = true
		ORDER BY c.name, p.name`
	err := r.db.SelectContext(ctx, &products, query)
	return products, err
}

func (r *productRepo) GetByID(ctx context.Context, id int64) (*model.Product, error) {
	var p model.Product
	query := `SELECT p.id, p.category_id, c.name AS category_name, p.name, p.description, p.price, p.unit, p.is_active, p.created_at, p.updated_at
		FROM products p
		JOIN categories c ON c.id = p.category_id
		WHERE p.id = ?`
	err := r.db.GetContext(ctx, &p, query, id)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *productRepo) GetByIDs(ctx context.Context, ids []int64) ([]model.Product, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	query, args, err := sqlx.In(`SELECT id, category_id, name, description, price, unit, is_active, created_at, updated_at FROM products WHERE id IN (?) AND is_active = true`, ids)
	if err != nil {
		return nil, fmt.Errorf("building IN query: %w", err)
	}
	query = r.db.Rebind(query)
	var products []model.Product
	err = r.db.SelectContext(ctx, &products, query, args...)
	return products, err
}

func (r *productRepo) Create(ctx context.Context, p *model.Product) (int64, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO products (category_id, name, description, price, unit, is_active) VALUES (?, ?, ?, ?, ?, true)`,
		p.CategoryID, p.Name, p.Description, p.Price, p.Unit)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *productRepo) Update(ctx context.Context, p *model.Product) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE products SET category_id=?, name=?, description=?, price=?, unit=?, is_active=?, updated_at=NOW() WHERE id=?`,
		p.CategoryID, p.Name, p.Description, p.Price, p.Unit, p.IsActive, p.ID)
	return err
}

func (r *productRepo) SoftDelete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `UPDATE products SET is_active=false, updated_at=NOW() WHERE id=?`, id)
	return err
}

func (r *productRepo) CreateCategory(ctx context.Context, c *model.Category) (int64, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO categories (name, slug) VALUES (?, ?)`, c.Name, c.Slug)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *productRepo) UpdateCategory(ctx context.Context, c *model.Category) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE categories SET name=?, slug=?, updated_at=NOW() WHERE id=?`, c.Name, c.Slug, c.ID)
	return err
}

func (r *productRepo) GetCategoryByID(ctx context.Context, id int64) (*model.Category, error) {
	var c model.Category
	err := r.db.GetContext(ctx, &c, `SELECT id, name, slug, created_at, updated_at FROM categories WHERE id=?`, id)
	if err != nil {
		return nil, err
	}
	return &c, nil
}
