/**
 * Format bytes to human-readable string (KB, MB, GB)
 */
export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const threshold = 1024;
  const index = Math.floor(Math.log(bytes) / Math.log(threshold));

  const value = bytes / Math.pow(threshold, index);
  const unit = units[index];

  // Format with appropriate precision
  if (index === 0) return `${bytes} B`;
  return `${value.toFixed(1)} ${unit}`;
};

/**
 * Format Unix timestamp to localized time string
 */
export const formatTimestamp = (
  timestamp: number,
  options?: {
    time?: boolean;
    date?: boolean;
    relative?: boolean;
  },
): string => {
  const date = new Date(timestamp * 1000);

  if (options?.relative) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
  }

  if (options?.date && !options?.time) {
    return date.toLocaleDateString();
  }

  if (options?.time && !options?.date) {
    return date.toLocaleTimeString();
  }

  return date.toLocaleString();
};

/**
 * Format number with locale-specific thousand separators
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Format message format type to display string
 */
export const formatMessageFormat = (format: string): string => {
  return format.toUpperCase();
};

/**
 * Detect message format from data string
 */
export const detectMessageFormat = (
  data: string,
): "json" | "binary" | "text" => {
  // Try to parse as JSON
  try {
    JSON.parse(data);
    return "json";
  } catch {
    return detectBinaryOrText(data)
  }
};

const detectBinaryOrText = (data: string): "binary" | "text" => {
  // Check for binary/non-printable characters
  for (let i = 0; i < Math.min(100, data.length); i++) {
    const code = data.charCodeAt(i);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      return "binary";
    }
  }

  return "text";
};

/**
 * Convert string to hex representation
 */
export const toHexString = (str: string): string => {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const hex = str.charCodeAt(i).toString(16).padStart(4, "0");
    result += hex + " ";
    if ((i + 1) % 16 === 0) result += "\n";
  }
  return result.trim();
};

/**
 * Format JSON with pretty printing
 */
export const formatJSON = (data: string): string => {
  try {
    const parsed = JSON.parse(data);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return data;
  }
};

/**
 * Truncate string to max length with ellipsis
 */
export const truncate = (str: string, maxLength: number = 100): string => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
};
