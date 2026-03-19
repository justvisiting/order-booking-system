package handler

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"order-system/internal/middleware"
)

func writeJSON(w http.ResponseWriter, code int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, code int, message string) {
	writeJSON(w, code, map[string]string{"error": message})
}

func logError(ctx context.Context, msg string, err error, extra ...any) {
	args := []any{"error", err, "request_id", middleware.GetRequestID(ctx)}
	args = append(args, extra...)
	slog.Error(msg, args...)
}

func parseID(s string) (int64, error) {
	return strconv.ParseInt(s, 10, 64)
}

func parseIntDefault(s string, def int) int {
	if s == "" {
		return def
	}
	v, err := strconv.Atoi(s)
	if err != nil || v < 1 {
		return def
	}
	return v
}
