import { PDFDocument } from 'pdf-lib';
import { isPDFDocument, fillForm, DocFillConfig } from './DocFillUtils';

describe('DocFillUtils', () => {
  it('isPDFDocument returns true for PDFs', () => {
    expect(isPDFDocument({ mimeType: 'application/pdf' } as any)).toBe(true);
  });

  it('isPDFDocument returns false for non-PDFs', () => {
    expect(isPDFDocument({ mimeType: 'image/png' } as any)).toBe(false);
  });

  it('fillForm fills textfield', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    form.createTextField('tf');
    const config: DocFillConfig = { key: 'tf', value: 'abc', type: 'textfield' };
    const result = fillForm(form, config);
    expect(result.success).toBe(true);
    expect(result.errorMessage).toBe('');
    expect(form.getTextField('tf').getText()).toBe('abc');
  });

  it('fillForm fills checkbox true', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    const cb = form.createCheckBox('cb');
    cb.addToPage(pdfDoc.getPages()[0], { x: 50, y: 700 });
    const config: DocFillConfig = { key: 'cb', value: 'true', type: 'checkbox' };
    const result = fillForm(form, config);
    expect(result.success).toBe(true);
    expect(result.errorMessage).toBe('');
    const saved = await pdfDoc.save();
    const loaded = await PDFDocument.load(saved);
    const loadedForm = loaded.getForm();
    expect(loadedForm.getCheckBox('cb').isChecked()).toBe(true);
  });

  it('fillForm fills checkbox false', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    const cb = form.createCheckBox('cb');
    cb.addToPage(pdfDoc.getPages()[0], { x: 50, y: 700 });
    const config: DocFillConfig = { key: 'cb', value: 'no', type: 'checkbox' };
    const result = fillForm(form, config);
    expect(result.success).toBe(true);
    expect(result.errorMessage).toBe('');
    const saved = await pdfDoc.save();
    const loaded = await PDFDocument.load(saved);
    const loadedForm = loaded.getForm();
    expect(loadedForm.getCheckBox('cb').isChecked()).toBe(false);
  });

  it('fillForm fills dropdown', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    const dd = form.createDropdown('dd');
    dd.addOptions(['A', 'B']);
    const config: DocFillConfig = { key: 'dd', value: 'B', type: 'dropdown' };
    const result = fillForm(form, config);
    expect(result.success).toBe(true);
    expect(result.errorMessage).toBe('');
    expect(form.getDropdown('dd').getSelected()).toEqual(['B']);
  });

  it('fillForm fills radiogroup', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    const rg = form.createRadioGroup('rg');
    rg.addOptionToPage('Yes', pdfDoc.getPages()[0]);
    rg.addOptionToPage('No', pdfDoc.getPages()[0]);
    const config: DocFillConfig = { key: 'rg', value: 'Yes', type: 'radiogroup' };
    const result = fillForm(form, config);
    expect(result.success).toBe(true);
    expect(result.errorMessage).toBe('');
    expect(form.getRadioGroup('rg').getSelected()).toBe('Yes');
  });

  it('fillForm returns error for invalid type', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    const config: DocFillConfig = { key: 'foo', value: 'bar', type: 'invalid' as any };
    const result = fillForm(form, config);
    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/Invalid field type/);
  });
});
