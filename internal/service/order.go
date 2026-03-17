package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"order-system/internal/model"
	"order-system/internal/repository"
	"order-system/internal/ws"
)

var (
	ErrOrderNotFound       = errors.New("order not found")
	ErrInvalidTransition   = errors.New("invalid status transition")
	ErrEmptyOrder          = errors.New("order must have at least one item")
	ErrInvalidQuantity     = errors.New("quantity must be positive")
	ErrProductUnavailable  = errors.New("one or more products are unavailable")
	ErrCustomerPhoneNeeded = errors.New("customer phone is required")
)

type OrderService interface {
	PlaceOrder(ctx context.Context, req model.PlaceOrderRequest) (*model.Order, error)
	GetByID(ctx context.Context, id int64) (*model.Order, error)
	GetByIDAndPhone(ctx context.Context, id int64, phone string) (*model.Order, error)
	ListByCustomerPhone(ctx context.Context, phone string, page, perPage int) ([]model.Order, int, error)
	ListFiltered(ctx context.Context, filter model.OrderFilter) ([]model.Order, int, error)
	UpdateStatus(ctx context.Context, orderID int64, req model.UpdateStatusRequest, userID int64) (*model.Order, error)
}

type orderService struct {
	orderRepo    repository.OrderRepository
	productRepo  repository.ProductRepository
	customerRepo repository.CustomerRepository
	hub          *ws.Hub
}

func NewOrderService(
	orderRepo repository.OrderRepository,
	productRepo repository.ProductRepository,
	customerRepo repository.CustomerRepository,
	hub *ws.Hub,
) OrderService {
	return &orderService{
		orderRepo:    orderRepo,
		productRepo:  productRepo,
		customerRepo: customerRepo,
		hub:          hub,
	}
}

func (s *orderService) PlaceOrder(ctx context.Context, req model.PlaceOrderRequest) (*model.Order, error) {
	if len(req.Items) == 0 {
		return nil, ErrEmptyOrder
	}
	if req.Customer.Phone == "" {
		return nil, ErrCustomerPhoneNeeded
	}
	if req.Customer.Name == "" {
		return nil, errors.New("customer name is required")
	}

	// Collect product IDs and validate quantities
	productIDs := make([]int64, 0, len(req.Items))
	for _, item := range req.Items {
		if item.Quantity <= 0 {
			return nil, ErrInvalidQuantity
		}
		productIDs = append(productIDs, item.ProductID)
	}

	// Fetch products server-side for price lookup
	products, err := s.productRepo.GetByIDs(ctx, productIDs)
	if err != nil {
		return nil, fmt.Errorf("fetching products: %w", err)
	}

	productMap := make(map[int64]model.Product)
	for _, p := range products {
		productMap[p.ID] = p
	}

	// Validate all requested products exist and are active
	for _, item := range req.Items {
		if _, ok := productMap[item.ProductID]; !ok {
			return nil, ErrProductUnavailable
		}
	}

	// Begin transaction
	tx, err := s.orderRepo.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("beginning transaction: %w", err)
	}
	defer tx.Rollback()

	// Upsert customer
	customerID, err := s.customerRepo.Upsert(ctx, tx, &req.Customer)
	if err != nil {
		return nil, fmt.Errorf("upserting customer: %w", err)
	}

	// Generate order number
	orderNumber, err := s.orderRepo.GetNextOrderNumber(ctx, tx)
	if err != nil {
		return nil, fmt.Errorf("generating order number: %w", err)
	}

	// Calculate total and build items
	var totalAmount float64
	orderItems := make([]model.OrderItem, 0, len(req.Items))
	for _, item := range req.Items {
		product := productMap[item.ProductID]
		subtotal := product.Price * float64(item.Quantity)
		totalAmount += subtotal
		orderItems = append(orderItems, model.OrderItem{
			ProductID:   item.ProductID,
			ProductName: product.Name,
			Quantity:    item.Quantity,
			UnitPrice:   product.Price,
			Subtotal:    subtotal,
		})
	}

	// Create order
	order := &model.Order{
		OrderNumber:     orderNumber,
		CustomerID:      customerID,
		Status:          model.OrderStatusPending,
		TotalAmount:     totalAmount,
		Notes:           req.Notes,
		DeliveryAddress: req.DeliveryAddress,
	}
	orderID, err := s.orderRepo.Create(ctx, tx, order)
	if err != nil {
		return nil, fmt.Errorf("creating order: %w", err)
	}
	order.ID = orderID

	// Set order ID on items and create them
	for i := range orderItems {
		orderItems[i].OrderID = orderID
	}
	if err := s.orderRepo.CreateItems(ctx, tx, orderItems); err != nil {
		return nil, fmt.Errorf("creating order items: %w", err)
	}

	// Create status log
	statusLog := &model.OrderStatusLog{
		OrderID: orderID,
		Status:  model.OrderStatusPending,
		Note:    "Order placed",
	}
	if err := s.orderRepo.CreateStatusLog(ctx, tx, statusLog); err != nil {
		return nil, fmt.Errorf("creating status log: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("committing transaction: %w", err)
	}

	order.Items = orderItems
	order.CustomerName = req.Customer.Name
	order.CustomerPhone = req.Customer.Phone

	// Broadcast to WebSocket
	if s.hub != nil {
		s.hub.Broadcast(ws.Message{
			Type: "new_order",
			Data: order,
		})
	}

	return order, nil
}

func (s *orderService) GetByID(ctx context.Context, id int64) (*model.Order, error) {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrOrderNotFound
		}
		return nil, err
	}
	items, err := s.orderRepo.GetItemsByOrderID(ctx, id)
	if err != nil {
		return nil, err
	}
	order.Items = items
	return order, nil
}

func (s *orderService) GetByIDAndPhone(ctx context.Context, id int64, phone string) (*model.Order, error) {
	if phone == "" {
		return nil, ErrCustomerPhoneNeeded
	}
	order, err := s.orderRepo.GetByIDAndPhone(ctx, id, phone)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrOrderNotFound
		}
		return nil, err
	}
	items, err := s.orderRepo.GetItemsByOrderID(ctx, id)
	if err != nil {
		return nil, err
	}
	order.Items = items
	return order, nil
}

func (s *orderService) ListByCustomerPhone(ctx context.Context, phone string, page, perPage int) ([]model.Order, int, error) {
	if phone == "" {
		return nil, 0, ErrCustomerPhoneNeeded
	}
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	return s.orderRepo.ListByCustomerPhone(ctx, phone, page, perPage)
}

func (s *orderService) ListFiltered(ctx context.Context, filter model.OrderFilter) ([]model.Order, int, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PerPage < 1 || filter.PerPage > 100 {
		filter.PerPage = 20
	}
	return s.orderRepo.ListFiltered(ctx, filter)
}

func (s *orderService) UpdateStatus(ctx context.Context, orderID int64, req model.UpdateStatusRequest, userID int64) (*model.Order, error) {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrOrderNotFound
		}
		return nil, err
	}

	if !model.IsValidTransition(order.Status, req.Status) {
		return nil, fmt.Errorf("%w: cannot transition from %s to %s", ErrInvalidTransition, order.Status, req.Status)
	}

	if err := s.orderRepo.UpdateStatus(ctx, orderID, req.Status); err != nil {
		return nil, err
	}

	statusLog := &model.OrderStatusLog{
		OrderID:   orderID,
		Status:    req.Status,
		ChangedBy: &userID,
		Note:      req.Note,
	}
	if err := s.orderRepo.CreateStatusLog(ctx, nil, statusLog); err != nil {
		return nil, err
	}

	order.Status = req.Status
	items, _ := s.orderRepo.GetItemsByOrderID(ctx, orderID)
	order.Items = items

	// Broadcast status change
	if s.hub != nil {
		s.hub.Broadcast(ws.Message{
			Type: "status_update",
			Data: order,
		})
	}

	return order, nil
}
