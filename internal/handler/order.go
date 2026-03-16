package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"order-system/internal/middleware"
	"order-system/internal/model"
	"order-system/internal/service"
)

type OrderHandler struct {
	svc service.OrderService
}

func NewOrderHandler(svc service.OrderService) *OrderHandler {
	return &OrderHandler{svc: svc}
}

// PlaceOrder handles POST /api/v1/orders (public)
func (h *OrderHandler) PlaceOrder(w http.ResponseWriter, r *http.Request) {
	var req model.PlaceOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	order, err := h.svc.PlaceOrder(r.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrEmptyOrder) ||
			errors.Is(err, service.ErrInvalidQuantity) ||
			errors.Is(err, service.ErrCustomerPhoneNeeded) {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, service.ErrProductUnavailable) {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to place order")
		return
	}

	writeJSON(w, http.StatusCreated, order)
}

// GetOrderStatus handles GET /api/v1/orders/:id?phone=xxx (public)
func (h *OrderHandler) GetOrderStatus(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid order id")
		return
	}

	phone := r.URL.Query().Get("phone")
	if phone == "" {
		writeError(w, http.StatusBadRequest, "phone query parameter is required")
		return
	}

	order, err := h.svc.GetByIDAndPhone(r.Context(), id, phone)
	if err != nil {
		if errors.Is(err, service.ErrOrderNotFound) {
			writeError(w, http.StatusNotFound, "order not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to get order")
		return
	}

	writeJSON(w, http.StatusOK, order)
}

// CustomerOrders handles GET /api/v1/customers/:phone/orders (public)
func (h *OrderHandler) CustomerOrders(w http.ResponseWriter, r *http.Request) {
	phone := chi.URLParam(r, "phone")
	if phone == "" {
		writeError(w, http.StatusBadRequest, "phone is required")
		return
	}

	page := parseIntDefault(r.URL.Query().Get("page"), 1)
	perPage := parseIntDefault(r.URL.Query().Get("per_page"), 20)

	orders, total, err := h.svc.ListByCustomerPhone(r.Context(), phone, page, perPage)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list orders")
		return
	}

	if orders == nil {
		orders = []model.Order{}
	}

	writeJSON(w, http.StatusOK, model.PaginatedOrders{
		Orders:  orders,
		Total:   total,
		Page:    page,
		PerPage: perPage,
	})
}

// DashboardListOrders handles GET /api/v1/dashboard/orders (auth required)
func (h *OrderHandler) DashboardListOrders(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := model.OrderFilter{
		Page:    parseIntDefault(q.Get("page"), 1),
		PerPage: parseIntDefault(q.Get("per_page"), 20),
	}

	if s := q.Get("status"); s != "" {
		status := model.OrderStatus(s)
		filter.Status = &status
	}

	orders, total, err := h.svc.ListFiltered(r.Context(), filter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list orders")
		return
	}

	if orders == nil {
		orders = []model.Order{}
	}

	writeJSON(w, http.StatusOK, model.PaginatedOrders{
		Orders:  orders,
		Total:   total,
		Page:    filter.Page,
		PerPage: filter.PerPage,
	})
}

// DashboardGetOrder handles GET /api/v1/dashboard/orders/:id (auth required)
func (h *OrderHandler) DashboardGetOrder(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid order id")
		return
	}

	order, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrOrderNotFound) {
			writeError(w, http.StatusNotFound, "order not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to get order")
		return
	}

	writeJSON(w, http.StatusOK, order)
}

// UpdateStatus handles PATCH /api/v1/dashboard/orders/:id/status (auth required)
func (h *OrderHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid order id")
		return
	}

	var req model.UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Status == "" {
		writeError(w, http.StatusBadRequest, "status is required")
		return
	}

	uid := middleware.GetUserID(r.Context())

	order, err := h.svc.UpdateStatus(r.Context(), id, req, uid)
	if err != nil {
		if errors.Is(err, service.ErrOrderNotFound) {
			writeError(w, http.StatusNotFound, "order not found")
			return
		}
		if errors.Is(err, service.ErrInvalidTransition) {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to update status")
		return
	}

	writeJSON(w, http.StatusOK, order)
}
