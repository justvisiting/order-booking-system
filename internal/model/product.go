package model

import "time"

type Category struct {
	ID        int64     `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	Slug      string    `db:"slug" json:"slug"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type Product struct {
	ID           int64     `db:"id" json:"id"`
	CategoryID   int64     `db:"category_id" json:"category_id"`
	CategoryName string    `db:"category_name" json:"category_name,omitempty"`
	Name         string    `db:"name" json:"name"`
	Description  string    `db:"description" json:"description"`
	Price        float64   `db:"price" json:"price"`
	Unit         string    `db:"unit" json:"unit"`
	IsActive     bool      `db:"is_active" json:"is_active"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type CreateProductRequest struct {
	CategoryID  int64   `json:"category_id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Unit        string  `json:"unit"`
}

type UpdateProductRequest struct {
	CategoryID  *int64   `json:"category_id,omitempty"`
	Name        *string  `json:"name,omitempty"`
	Description *string  `json:"description,omitempty"`
	Price       *float64 `json:"price,omitempty"`
	Unit        *string  `json:"unit,omitempty"`
	IsActive    *bool    `json:"is_active,omitempty"`
}

type CreateCategoryRequest struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type UpdateCategoryRequest struct {
	Name *string `json:"name,omitempty"`
	Slug *string `json:"slug,omitempty"`
}
