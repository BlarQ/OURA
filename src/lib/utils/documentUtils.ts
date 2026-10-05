export type DocumentCategory = 'pdf' | 'office' | 'text' | 'archive' | 'generic';

export interface DocumentMetadata {
  category: DocumentCategory;
  label: string;
  extension: string;
  isPreviewable: boolean;
  mimeTypeGuess?: string;
}

/**
 * Extracts clean lowercase file extension from URL or filename.
 */
export function getDocumentExtension(urlOrFileName: string): string {
  if (!urlOrFileName) return '';
  const clean = urlOrFileName.split('?')[0].split('#')[0];
  const parts = clean.split('.');
  if (parts.length <= 1) return '';
  return (parts.pop() || '').toLowerCase();
}

/**
 * Categorizes and identifies document details based on filename or URL.
 */
export function getDocumentMetadata(urlOrFileName: string): DocumentMetadata {
  const ext = getDocumentExtension(urlOrFileName);

  if (ext === 'pdf') {
    return {
      category: 'pdf',
      label: 'PDF Document',
      extension: 'PDF',
      isPreviewable: true,
      mimeTypeGuess: 'application/pdf',
    };
  }

  if (['doc', 'docx'].includes(ext)) {
    return {
      category: 'office',
      label: 'Word Document',
      extension: ext.toUpperCase(),
      isPreviewable: true,
      mimeTypeGuess: 'application/msword',
    };
  }

  if (['xls', 'xlsx'].includes(ext)) {
    return {
      category: 'office',
      label: 'Excel Spreadsheet',
      extension: ext.toUpperCase(),
      isPreviewable: true,
      mimeTypeGuess: 'application/vnd.ms-excel',
    };
  }

  if (['ppt', 'pptx'].includes(ext)) {
    return {
      category: 'office',
      label: 'PowerPoint Slide',
      extension: ext.toUpperCase(),
      isPreviewable: true,
      mimeTypeGuess: 'application/vnd.ms-powerpoint',
    };
  }

  if (['txt', 'log', 'md', 'json', 'yaml', 'yml', 'xml', 'csv', 'sql', 'sh', 'bat', 'conf', 'ini', 'env', 'py', 'js', 'ts'].includes(ext)) {
    let label = 'Text Document';
    if (ext === 'csv') label = 'CSV Data Sheet';
    else if (ext === 'md') label = 'Markdown Notes';
    else if (ext === 'json') label = 'JSON Configuration';
    else if (['yaml', 'yml'].includes(ext)) label = 'YAML Config';
    else if (ext === 'log') label = 'Log File';
    else if (ext === 'sql') label = 'SQL Script';

    return {
      category: 'text',
      label,
      extension: ext.toUpperCase(),
      isPreviewable: true,
      mimeTypeGuess: 'text/plain',
    };
  }

  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
    return {
      category: 'archive',
      label: 'Archive Package',
      extension: ext.toUpperCase(),
      isPreviewable: false,
      mimeTypeGuess: 'application/zip',
    };
  }

  return {
    category: 'generic',
    label: ext ? `${ext.toUpperCase()} File` : 'Document File',
    extension: ext ? ext.toUpperCase() : 'DOC',
    isPreviewable: false,
  };
}

/**
 * Checks if a given media URL is a document format.
 */
export function isDocumentUrl(url: string | null): boolean {
  if (!url) return false;
  const ext = getDocumentExtension(url);
  const docExtensions = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'txt',
    'csv',
    'log',
    'md',
    'json',
    'yaml',
    'yml',
    'xml',
    'sql',
    'sh',
    'bat',
    'conf',
    'ini',
    'rtf',
    'odt',
    'zip',
    'tar',
    'gz',
  ];
  return docExtensions.includes(ext);
}

/**
 * Returns a human-friendly display name from URL or step title.
 */
export function formatDocumentName(url: string, explicitName?: string, stepTitle?: string): string {
  if (explicitName && explicitName !== 'Attachment Synced' && explicitName.trim()) {
    return explicitName;
  }
  if (!url) return stepTitle || 'Document Attachment';
  try {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const rawFileName = cleanUrl.split('/').pop();
    if (rawFileName) {
      // Decode URI components in filename
      const decoded = decodeURIComponent(rawFileName);
      // If it has format media_12345.pdf or doc_12345_xyz.pdf, provide a nice name
      if (decoded.startsWith('doc_') || decoded.startsWith('media_')) {
        const ext = getDocumentExtension(decoded);
        return stepTitle ? `${stepTitle}.${ext}` : decoded;
      }
      return decoded;
    }
  } catch {
    // Fallback
  }
  return stepTitle || 'Document Attachment';
}
