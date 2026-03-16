package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	"order-system/internal/model"
)

type OrderRepository interface {
	Create(ctx context.Context, tx *sqlx.Tx, order *model.Order) (int64, error)
	CreateItems(ctx context.Context, tx *sqlx.Tx, items []model.OrderItem) error
	CreateStatusLog(ctx context.Context, tx *sqlx.Tx, log *model.OrderStatusLog) error
	GetByID(ctx context.Context, id int64) (*model.Order, error)
	GetItemsByOrderID(ctx context.Context, orderID int64) ([]model.OrderItem, error)
	GetByIDAndPhone(ctx context.Context, id int64, phone string) (*model.Order, error)
	ListByCustomerPhone(ctx context.Context, phone string, page, perPage int) ([]model.Order, int, error)
	ListFiltered(ctx context.Context, filter model.OrderFilter) ([]model.Order, int, error)
	UpdateStatus(ctx context.Context, id int64, status model.OrderStatus) error
	GetNextOrderNumber(ctx context.Context, tx *sqlx.Tx) (string, error)
	BeginTx(ctx context.Context) (*sqlx.Tx, error)
}

type orderRepo struct {
	db *sqlx.DB
}

func NewOrderRepository(db *sqlx.DB) OrderRepository {
	return &orderRepo{db: db}
}

func (r *orderRepo) BeginTx(ctx context.Context) (*sqlx.Tx, error) {
	return r.db.BeginTxx(ctx, nil)
}

func (r *orderRepo) GetNextOrderNumber(ctx context.Context, tx *sqlx.Tx) (string, error) {
	dateStr := time.Now().Format("20060102")
	pattern := fmt.Sprintf("ORD-%s-%%", dateStr)

	var count int
	query := `SELECT COUNT(*) FROM orders WHERE order_number LIKE ?`
	var err error
	if tx != nil {
		err = tx.GetContext(ctx, &count, query, pattern)
	} else {
		err = r.db.GetContext(ctx, &count, query, pattern)
	}
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("ORD-%s-%03d", dateStr, count+1), nil
}

func (r *orderRepo) Create(ctx context.Context, tx *sqlx.Tx, order *model.Order) (int64, error) {
	query := `INSERT INTO orders (order_number, customer_id, status, total_amount, notes) VALUES (?, ?, ?, ?, ?)`
	var res interface {
		LastInsertId() (int64, error)
	}
	var err error
	if tx != nil {
		res, err = tx.ExecContext(ctx, query, order.OrderNumber, order.CustomerID, order.Status, order.TotalAmount, order.Notes)
	} else {
		res, err = r.db.ExecContext(ctx, query, order.OrderNumber, order.CustomerID, order.Status, order.TotalAmount, order.Notes)
	}
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *orderRepo) CreateItems(ctx context.Context, tx *sqlx.Tx, items []model.OrderItem) error {
	query := `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)`
	for _, item := range items {
		if tx != nil {
			_, err := tx.ExecContext(ctx, query, item.OrderID, item.ProductID, item.ProductName, item.Quantity, item.UnitPrice, item.Subtotal)
			if err != nil {
				return err
			}
		} else {
			_, err := r.db.ExecContext(ctx, query, item.OrderID, item.ProductID, item.ProductName, item.Quantity, item.UnitPrice, item.Subtotal)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (r *orderRepo) CreateStatusLog(ctx context.Context, tx *sqlx.Tx, log *model.OrderStatusLog) error {
	query := `INSERT INTO order_status_log (order_id, status, changed_by, note) VALUES (?, ?, ?, ?)`
	if tx != nil {
		_, err := tx.ExecContext(ctx, query, log.OrderID, log.Status, log.ChangedBy, log.Note)
		return err
	}
	_, err := r.db.ExecContext(ctx, query, log.OrderID, log.Status, log.ChangedBy, log.Note)
	return err
}

func (r *orderRepo) GetByID(ctx context.Context, id int64) (*model.Order, error) {
	var order model.Order
	query := `SELECT o.id, o.order_number, o.customer_id, o.status, o.total_amount, o.notes, o.created_at, o.updated_at,
		c.name AS customer_name, c.phone AS customer_phone
		FROM orders o
		JOIN customers c ON c.id = o.customer_id
		WHERE o.id = ?`
	err := r.db.GetContext(ctx, &order, query, id)
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *orderRepo) GetItemsByOrderID(ctx context.Context, orderID int64) ([]model.OrderItem, error) {
	var items []model.OrderItem
	err := r.db.SelectContext(ctx, &items,
		`SELECT id, order_id, product_id, product_name, quantity, unit_price, subtotal FROM order_items WHERE order_id = ?`, orderID)
	return items, err
}

func (r *orderRepo) GetByIDAndPhone(ctx context.Context, id int64, phone string) (*model.Order, error) {
	var order model.Order
	query := `SELECT o.id, o.order_number, o.customer_id, o.status, o.total_amount, o.notes, o.created_at, o.updated_at,
		c.name AS customer_name, c.phone AS customer_phone
		FROM orders o
		JOIN customers c ON c.id = o.customer_id
		WHERE o.id = ? AND c.phone = ?`
	err := r.db.GetContext(ctx, &order, query, id, phone)
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *orderRepo) ListByCustomerPhone(ctx context.Context, phone string, page, perPage int) ([]model.Order, int, error) {
	var total int
	err := r.db.GetContext(ctx, &total,
		`SELECT COUNT(*) FROM orders o JOIN customers c ON c.id = o.customer_id WHERE c.phone = ?`, phone)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	var orders []model.Order
	err = r.db.SelectContext(ctx, &orders,
		`SELECT o.id, o.order_number, o.customer_id, o.status, o.total_amount, o.notes, o.created_at, o.updated_at,
			c.name AS customer_name, c.phone AS customer_phone
		FROM orders o
		JOIN customers c ON c.id = o.customer_id
		WHERE c.phone = ?
		ORDER BY o.created_at DESC
		LIMIT ? OFFSET ?`, phone, perPage, offset)
	return orders, total, err
}

func (r *orderRepo) ListFiltered(ctx context.Context, filter model.OrderFilter) ([]model.Order, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}

	if filter.Status != nil {
		where = append(where, "o.status = ?")
		args = append(args, *filter.Status)
	}
	if filter.CustomerID != nil {
		where = append(where, "o.customer_id = ?")
		args = append(args, *filter.CustomerID)
	}
	if filter.DateFrom != nil {
		where = append(where, "o.created_at >= ?")
		args = append(args, *filter.DateFrom)
	}
	if filter.DateTo != nil {
		where = append(where, "o.created_at <= ?")
		args = append(args, *filter.DateTo)
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM orders o JOIN customers c ON c.id = o.customer_id WHERE %s`, whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.PerPage
	selectArgs := append(args, filter.PerPage, offset)
	selectQuery := fmt.Sprintf(`SELECT o.id, o.order_number, o.customer_id, o.status, o.total_amount, o.notes, o.created_at, o.updated_at,
		c.name AS customer_name, c.phone AS customer_phone
		FROM orders o
		JOIN customers c ON c.id = o.customer_id
		WHERE %s
		ORDER BY o.created_at DESC
		LIMIT ? OFFSET ?`, whereClause)

	var orders []model.Order
	err = r.db.SelectContext(ctx, &orders, selectQuery, selectArgs...)
	return orders, total, err
}

func (r *orderRepo) UpdateStatus(ctx context.Context, id int64, status model.OrderStatus) error {
	_, err := r.db.ExecContext(ctx, `UPDATE orders SET status=?, updated_at=NOW() WHERE id=?`, status, id)
	return err
}
