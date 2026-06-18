package dto

import "time"

type KVBucketInfo struct {
	Name       string `json:"name"`
	BucketName string `json:"bucket_name"`
	Values     uint64 `json:"values"`
	Bytes      uint64 `json:"bytes"`
}

type KVBucketCreateResponse struct {
	Name    string `json:"name"`
	Values  uint64 `json:"values"`
	History uint8  `json:"history"`
}

type KVBucketDeleteResponse struct {
	Message string `json:"message"`
	Name    string `json:"name"`
}

type KVKeyEntry struct {
	Key      string    `json:"key"`
	Value    string    `json:"value"`
	Revision uint64    `json:"revision"`
	Created  time.Time `json:"created"`
}

type KVKeyHistoryEntry struct {
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	Revision  uint64    `json:"revision"`
	Created   time.Time `json:"created"`
	Operation string    `json:"operation"`
}

type KVKeyPutResponse struct {
	Message string `json:"message"`
	Key     string `json:"key"`
}

type KVKeyDeleteResponse struct {
	Message string `json:"message"`
	Key     string `json:"key"`
}

type KVPurgeResponse struct {
	Message string `json:"message"`
	Name    string `json:"name"`
}
