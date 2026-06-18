package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/getkin/kin-openapi/openapi2"
	"github.com/getkin/kin-openapi/openapi2conv"
	"github.com/getkin/kin-openapi/openapi3"
)

const (
	inputPath  = "api/swagger/swagger.json"
	jsonOutput = "api/swagger/openapi.json"
)

func main() {
	data, err := os.ReadFile(inputPath)
	if err != nil {
		fatalf("read %s: %v", inputPath, err)
	}

	var doc2 openapi2.T
	if err := json.Unmarshal(data, &doc2); err != nil {
		fatalf("parse %s: %v", inputPath, err)
	}

	doc3, err := openapi2conv.ToV3(&doc2)
	if err != nil {
		fatalf("convert to OpenAPI 3: %v", err)
	}
	doc3.OpenAPI = "3.1.0"
	doc3.JSONSchemaDialect = "https://json-schema.org/draft/2020-12/schema"
	doc3.Servers = openapi3.Servers{
		{URL: "/api"},
	}

	if err := doc3.Validate(context.Background()); err != nil {
		fatalf("validate OpenAPI 3.1 document: %v", err)
	}

	if err := writeJSON(jsonOutput, doc3); err != nil {
		fatalf("write %s: %v", jsonOutput, err)
	}

	fmt.Printf("Generated %s from %s\n", jsonOutput, inputPath)
}

func writeJSON(path string, doc *openapi3.T) error {
	data, err := json.MarshalIndent(doc, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	return os.WriteFile(path, data, 0o644)
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
