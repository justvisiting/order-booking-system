package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"order-system/internal/model"
	"order-system/internal/repository"
	"order-system/internal/service"
)

type AdminHandler struct {
	productSvc   service.ProductService
	authSvc      service.AuthService
	customerRepo repository.CustomerRepository
}

func NewAdminHandler(productSvc service.ProductService, authSvc service.AuthService, customerRepo repository.CustomerRepository) *AdminHandler {
	return &AdminHandler{
		productSvc:   productSvc,
		authSvc:      authSvc,
		customerRepo: customerRepo,
	}
}

// CreateProduct handles POST /api/v1/admin/products
func (h *AdminHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req model.CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	product, err := h.productSvc.Create(r.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrCategoryNotFound) {
			writeError(w, http.StatusBadRequest, "category not found")
			return
		}
		logError(r.Context(), "failed to create product", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, product)
}

// UpdateProduct handles PUT /api/v1/admin/products/:id
func (h *AdminHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	var req model.UpdateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	product, err := h.productSvc.Update(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, service.ErrProductNotFound) {
			writeError(w, http.StatusNotFound, "product not found")
			return
		}
		if errors.Is(err, service.ErrCategoryNotFound) {
			writeError(w, http.StatusBadRequest, "category not found")
			return
		}
		logError(r.Context(), "failed to update product", err, "product_id", id)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, product)
}

// DeleteProduct handles DELETE /api/v1/admin/products/:id
func (h *AdminHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	if err := h.productSvc.SoftDelete(r.Context(), id); err != nil {
		if errors.Is(err, service.ErrProductNotFound) {
			writeError(w, http.StatusNotFound, "product not found")
			return
		}
		logError(r.Context(), "failed to delete product", err, "product_id", id)
		writeError(w, http.StatusInternalServerError, "failed to delete product")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "product deleted"})
}

// CreateCategory handles POST /api/v1/admin/categories
func (h *AdminHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req model.CreateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	cat, err := h.productSvc.CreateCategory(r.Context(), req)
	if err != nil {
		logError(r.Context(), "failed to create category", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, cat)
}

// UpdateCategory handles PUT /api/v1/admin/categories/:id
func (h *AdminHandler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid category id")
		return
	}

	var req model.UpdateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	cat, err := h.productSvc.UpdateCategory(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, service.ErrCategoryNotFound) {
			writeError(w, http.StatusNotFound, "category not found")
			return
		}
		logError(r.Context(), "failed to update category", err, "category_id", id)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, cat)
}

// ListCustomers handles GET /api/v1/admin/customers
func (h *AdminHandler) ListCustomers(w http.ResponseWriter, r *http.Request) {
	page := parseIntDefault(r.URL.Query().Get("page"), 1)
	perPage := parseIntDefault(r.URL.Query().Get("per_page"), 20)

	customers, total, err := h.customerRepo.List(r.Context(), page, perPage)
	if err != nil {
		logError(r.Context(), "failed to list customers", err)
		writeError(w, http.StatusInternalServerError, "failed to list customers")
		return
	}

	if customers == nil {
		customers = []model.Customer{}
	}

	writeJSON(w, http.StatusOK, model.PaginatedCustomers{
		Customers: customers,
		Total:     total,
		Page:      page,
		PerPage:   perPage,
	})
}

// CreateUser handles POST /api/v1/admin/users
func (h *AdminHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req model.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := h.authSvc.CreateUser(r.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrUsernameExists) {
			writeError(w, http.StatusConflict, "username already exists")
			return
		}
		if errors.Is(err, service.ErrInvalidRole) {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		logError(r.Context(), "failed to create user", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, user)
}

// CustomerHandler is an alias used in the handler for customer endpoints
type CustomerHandler struct {
	repo repository.CustomerRepository
}

func NewCustomerHandler(repo repository.CustomerRepository) *CustomerHandler {
	return &CustomerHandler{repo: repo}
}
