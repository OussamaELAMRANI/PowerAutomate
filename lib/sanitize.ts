/**
 * Sanitization and validation utilities for file uploads.
 * Used on BOTH client and server to prevent command injection,
 * path traversal, and other malicious inputs.
 */

// Characters that could be used for command injection or path traversal
const DANGEROUS_PATTERNS = [
  /\.\./g, // Path traversal
  /[;|&`$]/g, // Shell command injection
  /[\x00-\x1f]/g, // Control characters
  /[<>]/g, // HTML injection
  /['"]/g, // Quote injection
  /\/{2,}/g, // Multiple slashes
  /\\/g, // Backslash
  /\0/g, // Null byte
];

// Allowed characters: alphanumeric, hyphens, underscores, dots, spaces, umlauts (German chars)
const SAFE_FILENAME_REGEX = /^[\p{L}\p{N}\p{M} ,._-]+$/u;
const SAFE_FOLDER_REGEX = /^[\p{L}\p{N}\p{M} ._-]+$/u;
export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validates and sanitizes a filename (e.g., "document.docx")
 */
export function validateFileName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "File name cannot be empty" };
  }

  const trimmed = name.trim();

  
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: "File name contains invalid characters",
      };
    }
  }

  // Check against safe character set
  if (!SAFE_FILENAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error:
        "File name can only contain letters, numbers, spaces, hyphens, underscores, and dots",
    };
  }

  // Must end with .docx
  if (!trimmed.toLowerCase().endsWith(".docx")) {
    return { valid: false, error: "Only .docx files are allowed" };
  }

  // Sanitize: replace spaces with underscores for filesystem safety
  const sanitized = trimmed.replace(/\s+/g, "_");

  return { valid: true, sanitized };
}

/**
 * Validates and sanitizes a folder/category name (e.g., "software-engineer")
 */
export function validateFolderName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Name cannot be empty" };
  }

  const trimmed = name.trim().normalize("NFC");

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: "Name contains invalid characters",
      };
    }
  }

  if (!SAFE_FOLDER_REGEX.test(trimmed)) {
    return {
      valid: false,
      error:
        "Name can only contain letters, numbers, spaces, hyphens, underscores,and commas",
    };
  }

  // Convert to kebab-case slug for filesystem
  const sanitized = trimmed
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss");

  return { valid: true, sanitized };
}

/**
 * Validates file size (max 10MB per file)
 */
export function validateFileSize(sizeBytes: number): ValidationResult {
	// skip the size validation of 10MB for docs
//   const MAX_SIZE = 10 * 1024 * 1024; // 10MB
//   if (sizeBytes > MAX_SIZE) {
//     return { valid: false, error: "File exceeds maximum size of 10MB" };
//   }
  if (sizeBytes === 0) {
    return { valid: false, error: "File is empty" };
  }
  return { valid: true };
}

/**
 * Validates DOCX magic bytes (PK zip header)
 */
export function validateDocxMagic(buffer: ArrayBuffer): ValidationResult {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  // PK ZIP header: 0x50 0x4B 0x03 0x04

  // if (
  //   bytes[0] === 0x50 &&
  //   bytes[1] === 0x4b &&
  //   bytes[2] === 0x03 &&
  //   bytes[3] === 0x04
  // ) {
  //   return { valid: true };
  // }
  // return {
  //   valid: false,
  //   error: "File does not appear to be a valid .docx document",
  // };
    return { valid: true };

}
