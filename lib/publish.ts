// lib/publish.ts
// Utilities for publishing and editing functionality

import type { ColorPalette, EditableElement } from '@/types/publish';

/**
 * Generate a unique slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

/**
 * Generate a random slug suffix to ensure uniqueness
 */
export function generateUniqueSuffix(): string {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Create a full unique slug
 */
export function createUniqueSlug(title: string): string {
  const baseSlug = generateSlug(title);
  const suffix = generateUniqueSuffix();
  return `${baseSlug}-${suffix}`;
}

/**
 * Validate a custom slug
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters' };
  }

  if (slug.length > 50) {
    return { valid: false, error: 'Slug must be less than 50 characters' };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Slug cannot start or end with a hyphen' };
  }

  // Reserved slugs
  const reserved = ['api', 'admin', 'www', 'app', 'dashboard', 'auth', 'login', 'signup'];
  if (reserved.includes(slug)) {
    return { valid: false, error: 'This slug is reserved and cannot be used' };
  }

  return { valid: true };
}

/**
 * Generate published URL from slug
 */
export function generatePublishedUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://wevibecode.ai';
  return `${base}/s/${slug}`;
}

/**
 * Extract color palette from HTML content
 * Extracts only the most common/important colors for editing (2-3 colors max)
 */
export function extractColorPalette(html: string): ColorPalette {
  const palette: ColorPalette = {};

  // Extract colors from style tags
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const matches = html.matchAll(styleRegex);

  for (const match of matches) {
    const css = match[1];

    // 1. First try to extract CSS custom properties (variables) - best method
    const varRegex = /--([\w-]+):\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\))/gi;
    const varMatches = css.matchAll(varRegex);

    for (const varMatch of varMatches) {
      const varName = varMatch[1];
      const value = varMatch[2].trim();
      palette[varName] = value;
    }

    // 2. If no CSS variables found, extract only unique color VALUES with context
    if (Object.keys(palette).length === 0) {
      const colorRegex = /(background-color|background|color|border-color):\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\))(?:\s|;|$)/gi;
      const colorMatches = css.matchAll(colorRegex);

      const uniqueColors = new Map<string, { value: string; property: string }>(); // value -> {value, property}

      for (const colorMatch of colorMatches) {
        const property = colorMatch[1];
        const value = colorMatch[2].trim();
        const normalizedValue = value.toLowerCase();

        // Skip common colors like white, black, transparent
        if (
          normalizedValue.includes('ffffff') ||
          normalizedValue.includes('fff') ||
          normalizedValue.includes('000000') ||
          normalizedValue.includes('000') ||
          normalizedValue.includes('transparent')
        ) {
          continue;
        }

        // Store only if we haven't seen this exact color
        if (!uniqueColors.has(normalizedValue)) {
          uniqueColors.set(normalizedValue, { value, property });
        }

        // Limit to 3 colors
        if (uniqueColors.size >= 3) break;
      }

      // Convert to palette with descriptive names
      const colorNames = ['Primary Color', 'Secondary Color', 'Accent Color'];
      let index = 0;

      for (const [_, colorData] of uniqueColors) {
        const name = colorNames[index] || `Color ${index + 1}`;
        palette[name] = colorData.value;
        index++;
      }
    }
  }

  // If we have CSS variables, rename them to be more user-friendly
  const renamedPalette: ColorPalette = {};
  for (const [key, value] of Object.entries(palette)) {
    let friendlyName = key;

    // Convert CSS variable names to friendly names
    if (key.includes('primary')) {
      friendlyName = 'Primary Color';
    } else if (key.includes('secondary')) {
      friendlyName = 'Secondary Color';
    } else if (key.includes('accent')) {
      friendlyName = 'Accent Color';
    } else if (key.includes('background')) {
      friendlyName = 'Background Color';
    } else if (key.includes('text') || key === 'color') {
      friendlyName = 'Text Color';
    } else if (key.includes('border')) {
      friendlyName = 'Border Color';
    } else if (key.includes('button')) {
      friendlyName = 'Button Color';
    } else if (key.includes('heading')) {
      friendlyName = 'Heading Color';
    } else {
      // Keep CSS variable name but make it prettier
      friendlyName = key
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    renamedPalette[friendlyName] = value;
  }

  return renamedPalette;
}

/**
 * Extract editable elements from HTML
 * Generates more specific selectors for reliable editing
 * Returns both elements and HTML with data attributes added
 */
export function extractEditableElements(html: string): EditableElement[] {
  const elements: EditableElement[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Select common editable elements
  const selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'button', 'a', 'span', 'li'];
  let globalIndex = 0;

  selectors.forEach((selector) => {
    const nodes = doc.querySelectorAll(selector);
    nodes.forEach((node, nodeIdx) => {
      const textContent = node.textContent?.trim();

      // Skip empty elements or elements that only contain other elements
      if (!textContent || textContent.length === 0) {
        return;
      }

      // Skip elements that are just containers (have significant child elements)
      const childElements = node.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, section');
      if (childElements.length > 0) {
        return;
      }

      // Add a unique data attribute to track this element
      const uniqueId = `editable-${globalIndex}`;
      (node as HTMLElement).setAttribute('data-editable-id', uniqueId);
      globalIndex++;

      // Create a more specific selector path using data attribute as primary
      const specificSelector = `[data-editable-id="${uniqueId}"]`;

      const element: EditableElement = {
        id: uniqueId,
        type: selector as any,
        content: textContent,
        selector: specificSelector,
        tag: selector,
      };
      elements.push(element);
    });
  });

  return elements;
}

/**
 * Extract editable elements and return modified HTML with data attributes
 * Use this to initialize editing with tracked elements
 */
export function extractEditableElementsWithHtml(html: string): { elements: EditableElement[]; html: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements: EditableElement[] = [];

  // Select common editable elements
  const selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'button', 'a', 'span', 'li'];
  let globalIndex = 0;

  selectors.forEach((selector) => {
    const nodes = doc.querySelectorAll(selector);
    nodes.forEach((node, nodeIdx) => {
      const textContent = node.textContent?.trim();

      // Skip empty elements or elements that only contain other elements
      if (!textContent || textContent.length === 0) {
        return;
      }

      // Skip elements that are just containers (have significant child elements)
      const childElements = node.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, section');
      if (childElements.length > 0) {
        return;
      }

      // Add a unique data attribute to track this element
      const uniqueId = `editable-${globalIndex}`;
      (node as HTMLElement).setAttribute('data-editable-id', uniqueId);
      globalIndex++;

      // Create a more specific selector path using data attribute as primary
      const specificSelector = `[data-editable-id="${uniqueId}"]`;

      const element: EditableElement = {
        id: uniqueId,
        type: selector as any,
        content: textContent,
        selector: specificSelector,
        tag: selector,
      };
      elements.push(element);
    });
  });

  return {
    elements,
    html: doc.documentElement.outerHTML,
  };
}

/**
 * Apply text edit to HTML
 * Uses selector to find element and replaces text content
 */
export function applyTextEdit(
  html: string,
  selector: string,
  oldText: string,
  newText: string
): string {
  // Use DOM manipulation for safe editing
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  try {
    // Use the data attribute selector to find the element
    const element = doc.querySelector(selector);

    if (element) {
      // Don't check oldText match - just replace the content
      // This allows editing to work even after previous edits
      element.textContent = newText;

      // Return the full HTML using outerHTML
      return doc.documentElement.outerHTML;
    } else {
      console.warn(`Element not found for selector: ${selector}`);
      return html;
    }
  } catch (error) {
    console.error('Error applying text edit:', error);
    return html; // Return original on error
  }
}

/**
 * Apply color edit to HTML
 * Replaces color in CSS - works for both CSS variables and direct color values
 */
export function applyColorEdit(
  html: string,
  cssKey: string,
  newColor: string
): string {
  // Get current palette to find the old color value
  const palette = extractColorPalette(html);
  const oldColor = palette[cssKey];

  if (!oldColor) {
    console.error(`Color not found for key: ${cssKey}`);
    return html;
  }

  console.log(`Replacing color: ${oldColor} -> ${newColor}`);

  // Escape special regex characters in the old color value
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedOldColor = escapeRegex(oldColor);

  // Replace ALL occurrences of the old color (case insensitive)
  const regex = new RegExp(escapedOldColor, 'gi');
  const newHtml = html.replace(regex, newColor);

  return newHtml;
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  // Basic sanitization - in production, use DOMPurify
  // This is a placeholder for now
  return html;
}

/**
 * Validate HTML structure
 */
export function validateHtml(html: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      errors.push('HTML parsing error: Invalid HTML structure');
    }

    // Check for required elements
    if (!doc.querySelector('html')) {
      errors.push('Missing <html> tag');
    }

    if (!doc.querySelector('body')) {
      errors.push('Missing <body> tag');
    }

  } catch (error: any) {
    errors.push(`Validation error: ${error.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate domain format
 */
export function validateDomain(domain: string): { valid: boolean; error?: string } {
  if (!domain || domain.length < 3) {
    return { valid: false, error: 'Domain must be at least 3 characters' };
  }

  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;

  if (!domainRegex.test(domain)) {
    return { valid: false, error: 'Invalid domain format' };
  }

  return { valid: true };
}

/**
 * Generate CNAME record value for custom domain
 */
export function generateCnameValue(baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'wevibecode.ai';
  return base.replace(/^https?:\/\//, '');
}
