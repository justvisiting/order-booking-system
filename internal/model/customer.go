package model

import "time"

type Customer struct {
	ID        int64     `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	Phone     string    `db:"phone" json:"phone"`
	Email     string    `db:"email" json:"email,omitempty"`
	Address   string    `db:"address" json:"address,omitempty"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type CustomerInput struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Email   string `json:"email,omitempty"`
	Address string `json:"address,omitempty"`
}
