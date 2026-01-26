// types/publish.ts
// TypeScript interfaces for publishing and editing functionality

export interface PublishOptions {
  previewId: string;
  publishType: 'subdomain' | 'custom';
  customDomain?: string;
  slug?: string;
}

export interface PublishedSite {
  id: string;
  slug: string | null;
  custom_domain: string | null;
  published_url: string | null;
  is_published: boolean;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface EditTextOptions {
  previewId: string;
  selector: string;
  oldText: string;
  newText: string;
  language?: string; // For auto-translation
}

export interface EditColorOptions {
  previewId: string;
  cssVariable: string;
  oldColor: string;
  newColor: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  suggestions?: string[];
}

export interface DomainVerificationResult {
  verified: boolean;
  cnameRecord?: string;
  expectedValue?: string;
  actualValue?: string;
  error?: string;
}

export interface EditHistory {
  id: string;
  preview_id: string;
  edit_type: 'text' | 'color';
  edit_data: Record<string, any>;
  created_at: string;
  user_id: string;
}

// Color palette extracted from generated HTML
export interface ColorPalette {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
  [key: string]: string | undefined;
}

// Editable element detected in HTML
export interface EditableElement {
  id: string;
  type: 'heading' | 'paragraph' | 'button' | 'link';
  content: string;
  selector: string;
  tag: string;
  section?: string; // Which section this element belongs to (hero, about, services, etc.)
  sectionLabel?: string; // Human-readable section name
}
