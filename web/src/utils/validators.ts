import { formatBytes } from "./formatters";
/**
 * Validate NATS subject format
 */
export const validateSubject = (
  subject: string,
): { valid: boolean; error?: string } => {
  if (!subject || subject.trim() === "") {
    return { valid: false, error: "Subject is required" };
  }

  // Check for invalid characters
  const invalidChars = /[^\w.\-*>]/;
  if (invalidChars.test(subject)) {
    return { valid: false, error: "Subject contains invalid characters" };
  }

  // Check wildcard placement
  if (subject.includes(">")) {
    const parts = subject.split(".");
    const gtIndex = parts.findIndex((p) => p === ">");
    if (gtIndex !== -1 && gtIndex !== parts.length - 1) {
      return { valid: false, error: 'Wildcard ">" must be at the end' };
    }
  }

  return { valid: true };
};

/**
 * Validate JSON string
 */
export const validateJSON = (
  str: string,
): { valid: boolean; error?: string; parsed?: any } => {
  if (!str || str.trim() === "") {
    return { valid: false, error: "JSON is required" };
  }

  try {
    const parsed = JSON.parse(str);
    return { valid: true, parsed };
  } catch (err) {
    return { valid: false, error: "Invalid JSON format" };
  }
};

/**
 * Validate timeout value
 */
export const validateTimeout = (
  timeout: number,
): { valid: boolean; error?: string } => {
  if (isNaN(timeout)) {
    return { valid: false, error: "Timeout must be a number" };
  }

  if (timeout < 100) {
    return { valid: false, error: "Timeout must be at least 100ms" };
  }

  if (timeout > 60000) {
    return { valid: false, error: "Timeout cannot exceed 60000ms" };
  }

  return { valid: true };
};

/**
 * Validate payload size
 */
export const validatePayloadSize = (
  payload: string,
  maxSize: number = 10 * 1024 * 1024,
): { valid: boolean; error?: string } => {
  const size = new Blob([payload]).size;

  if (size > maxSize) {
    return {
      valid: false,
      error: `Payload exceeds maximum size of ${formatBytes(maxSize)}`,
    };
  }

  return { valid: true };
};

/**
 * Get API health status from error rate
 */
export const getHealthStatus = (
  totalRequests: number,
  errors: number,
): "success" | "warning" | "error" => {
  if (totalRequests === 0) return "success";

  const errorRate = (errors / totalRequests) * 100;

  if (errorRate > 5) return "error";
  if (errorRate > 1) return "warning";
  return "success";
};

/**
 * Get consumer health status from lag
 */
export const getConsumerStatus = (
  lag: number,
): "success" | "warning" | "error" => {
  if (lag > 10000) return "error";
  if (lag > 1000) return "warning";
  return "success";
};
