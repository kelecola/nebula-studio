package base

type StatusCode int

const (
	Error              StatusCode = -1
	Success            StatusCode = 0
	AuthorizationError StatusCode = 401
)
