import { isPdfDocument } from './DocGetFormFieldsUtils';

describe('DocGetFormFieldsUtils', () => {
  it('isPdfDocument returns true for PDFs', () => {
    expect(isPdfDocument({ mimeType: 'application/pdf' } as any)).toBe(true);
  });

  it('isPdfDocument returns false for non-PDFs', () => {
    expect(isPdfDocument({ mimeType: 'image/png' } as any)).toBe(false);
  });
});
