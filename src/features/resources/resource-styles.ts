import {
  FileTextIcon,
  GlobeIcon,
  LinkIcon,
  NewspaperIcon,
  PlayCircleIcon,
  type LucideIcon,
} from 'lucide-react';
import type { ResourceType } from './types';

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  website: 'Website',
  article: 'Article',
  video: 'Video',
  document: 'Document',
  other: 'Other',
};

export const RESOURCE_TYPE_ICONS: Record<ResourceType, LucideIcon> = {
  website: GlobeIcon,
  article: NewspaperIcon,
  video: PlayCircleIcon,
  document: FileTextIcon,
  other: LinkIcon,
};

/**
 * Suggests a type from the address while you type it (you can still change
 * it): YouTube/Vimeo → video, .pdf/.docx → document.
 */
export function guessResourceType(url: string): ResourceType | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, '');
  if (/(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/.test(host)) return 'video';
  if (/\.(pdf|docx?|pptx?|xlsx?|odt)$/i.test(parsed.pathname)) {
    return 'document';
  }
  return null;
}
