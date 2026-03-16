package model

import "time"

type OrderStatus string

const (
	OrderStatusPending    OrderStatus = "pending"
	OrderStatusConfirmed  OrderStatus = "confirmed"
	OrderStatusDispatched OrderStatus = "dispatched"
	OrderStatusDelivered  OrderStatus = "delivered"
	OrderStatusCancelled  OrderStatus = "cancelled"
)

// ValidTransitions defines allowed status transitions.
var ValidTransitions = map[OrderStatus][]OrderStatus{
	OrderStatusPending:    {OrderStatusConfirmed, OrderStatusCancelled},
	OrderStatusConfirmed:  {OrderStatusDispatched, OrderStatusCancelled},
	OrderStatusDispatched: {OrderStatusDelivered, OrderStatusCancelled},
	OrderStatusDelivered:  {},
	OrderStatusCancelled:  {},
}

func IsValidTransition(from, to OrderStatus) bool {
	allowed, ok := ValidTransitions[from]
	if !ok {
		return false
	}
	for _, s := range allowed {
		if s == to {
			return true
		}
	}
	return false
}

type Order struct {
	ID          int64       `db:"id" json:"id"`
	OrderNumber string      `db:"order_number" json:"order_number"`
	CustomerID  int64       `db:"customer_id" json:"customer_id"`
	Status      OrderStatus `db:"status" json:"status"`
	TotalAmount float64     `db:"total_amount" json:"total_amount"`
	Notes       string      `db:"notes" json:"notes,omitempty"`
	CreatedAt   time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time   `db:"updated_at" json:"updated_at"`

	// Joined fields
	CustomerName  string `db:"customer_name" json:"customer_name,omitempty"`
	CustomerPhone string `db:"customer_phone" json:"customer_phone,omitempty"`

	Items []OrderItem `db:"-" json:"items,omitempty"`
}

type OrderItem struct {
	ID          int64   `db:"id" json:"id"`
	OrderID     int64   `db:"order_id" json:"order_id"`
	ProductID   int64   `db:"product_id" json:"product_id"`
	ProductName string  `db:"product_name" json:"product_name"`
	Quantity    int     `db:"quantity" json:"quantity"`
	UnitPrice   float64 `db:"unit_price" json:"unit_price"`
	Subtotal    float64 `db:"subtotal" json:"subtotal"`
}

type OrderStatusLog struct {
	ID        int64       `db:"id" json:"id"`
	OrderID   int64       `db:"order_id" json:"order_id"`
	Status    OrderStatus `db:"status" json:"status"`
	ChangedBy *int64      `db:"changed_by" json:"changed_by,omitempty"`
	Note      string      `db:"note" json:"note,omitempty"`
	CreatedAt time.Time   `db:"created_at" json:"created_at"`
}

type PlaceOrderRequest struct {
	Customer CustomerInput        `json:"customer"`
	Items    []PlaceOrderItemInput `json:"items"`
	Notes    string               `json:"notes,omitempty"`
}

type PlaceOrderItemInput struct {
	ProductID int64 `json:"product_id"`
	Quantity  int   `json:"quantity"`
}

type UpdateStatusRequest struct {
	Status OrderStatus `json:"status"`
	Note   string      `json:"note,omitempty"`
}

type OrderFilter struct {
	Status     *OrderStatus
	CustomerID *int64
	DateFrom   *time.Time
	DateTo     *time.Time
	Page       int
	PerPage    int
}

type PaginatedOrders struct {
	Orders []Order `json:"orders"`
	Total  int     `json:"total"`
	Page   int     `json:"page"`
	PerPage int    `json:"per_page"`
}

type PaginatedCustomers struct {
	Customers []Customer `json:"customers"`
	Total     int        `json:"total"`
	Page      int        `json:"page"`
	PerPage   int        `json:"per_page"`
}
