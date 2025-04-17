import { PDFDocument } from 'pdf-lib';
import { DocCreateField } from './DocCreateField.node';

function createExecuteFunctionsMock(inputItem: any, params: Record<string, any> = {}) {
  return {
    getInputData: () => [inputItem],
    getNodeParameter: (name: string) => params[name],
    helpers: {
      getBinaryDataBuffer: async () => inputItem.binary.data.data,
      prepareBinaryData: async (buffer: Buffer, fileName: string, mimeType: string) => ({
        data: buffer,
        fileName,
        mimeType,
        size: buffer.length,
      }),
    },
    getNode: () => ({}),
    continueOnFail: () => false,
    prepareOutputData: (data: any) => [data],
  } as any;
}

jest.setTimeout(5000);
describe('DocCreateField Node', () => {

  it('should throw if input is not a PDF', async () => {
    const inputItem = {
      binary: { data: { data: Buffer.from('notapdf'), mimeType: 'text/plain', size: 7 } },
      json: {},
    };
    const params = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([
        { value: 'Test', page: 0, options: { x: 10, y: 10 } },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocCreateField();
    const execMock = createExecuteFunctionsMock(inputItem, params);
    await expect(node.execute.call(execMock)).rejects.toThrow(/should be a PDF file/);
  });

  it('should throw if PDF is too large', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const pdfBytes = await pdfDoc.save();
    const binaryData = Buffer.from(pdfBytes);
    const inputItem = {
      binary: { data: { data: binaryData, mimeType: 'application/pdf', size: 50 * 1024 * 1024 } },
      json: {},
    };
    const params = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([
        { text: 'Test', page: 0, options: { x: 10, y: 10 } },
      ]),
      maxPdfSize: 1,
    };
    const node = new DocCreateField();
    const execMock = createExecuteFunctionsMock(inputItem, params);
    await expect(node.execute.call(execMock)).rejects.toThrow(/exceeds maximum allowed size/);
  });

  it('should throw if config page index is invalid', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const pdfBytes = await pdfDoc.save();
    const binaryData = Buffer.from(pdfBytes);
    const inputItem = {
      binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } },
      json: {},
    };
    const params = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([
        { value: 'Test', page: 5, options: { x: 10, y: 10 } },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocCreateField();
    const execMock = createExecuteFunctionsMock(inputItem, params);
    await expect(node.execute.call(execMock)).rejects.toThrow(/index/);
  });

  it('should add text to a blank PDF', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([400, 400]);
    const pdfBytes = await pdfDoc.save();
    const binaryData = Buffer.from(pdfBytes);
    const inputItem = {
      binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } },
      json: {},
    };
    const params = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([
        { value: 'Hello', page: 0, options: { x: 10, y: 10 } },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocCreateField();
    const execMock = createExecuteFunctionsMock(inputItem, params);
    const result = await node.execute.call(execMock);
    expect(Array.isArray(result[0])).toBe(true);
    expect(result[0][0]).toBeDefined();
    const binary = result[0]?.[0]?.binary;
    const outputData = binary?.data;
    let outputBinary: Buffer;
    if (!outputData) fail('Output binary data is missing');
    if (Buffer.isBuffer(outputData)) outputBinary = outputData;
    else if (outputData.data && Buffer.isBuffer(outputData.data)) outputBinary = outputData.data;
    else { fail('Output binary data is not a Buffer'); return; }
    const outPdfDoc = await PDFDocument.load(outputBinary);
    const pages = outPdfDoc.getPages();
    expect(pages).toBeDefined();
    expect(pages.length).toBe(1);
  });

  it('should throw if PDF is too large', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const pdfBytes = await pdfDoc.save();
    const binaryData = Buffer.from(pdfBytes);
    const inputItem = {
      binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } },
      json: {},
    };
    const params = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([
        { value: 'Test', page: 0, options: { x: 10, y: 10 } },
      ]),
      maxPdfSize: 0.00001,
    };
    const node = new DocCreateField();
    const execMock = createExecuteFunctionsMock(inputItem, params);
    await expect(node.execute.call(execMock)).rejects.toThrow(/exceeds maximum allowed size/);
  });

  it('should add multiple text fields to different pages', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([400, 400]);
    pdfDoc.addPage([400, 400]);
    const pdfBytes = await pdfDoc.save();
    const binaryData = Buffer.from(pdfBytes);
    const inputItem = {
      binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } },
      json: {},
    };
    const params = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([
        { value: 'First', page: 0, options: { x: 10, y: 10 } },
        { value: 'Second', page: 1, options: { x: 10, y: 10 } },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocCreateField();
    const execMock = createExecuteFunctionsMock(inputItem, params);
    const result = await node.execute.call(execMock);
    expect(Array.isArray(result[0])).toBe(true);
    expect(result[0][0]).toBeDefined();
    const binary = result[0]?.[0]?.binary;
    const outputData = binary?.data;
    let outputBinary: Buffer;
    if (!outputData) fail('Output binary data is missing');
    if (Buffer.isBuffer(outputData)) outputBinary = outputData;
    else if (outputData.data && Buffer.isBuffer(outputData.data)) outputBinary = outputData.data;
    else { fail('Output binary data is not a Buffer'); return; }
    const outPdfDoc = await PDFDocument.load(outputBinary);
    const pages = outPdfDoc.getPages();
    expect(pages.length).toBe(2);
    // Not verifying actual text rendering (pdf-lib limitation), but PDF is valid
  });

  it('should throw if config is missing required text property', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([400, 400]);
    const pdfBytes = await pdfDoc.save();
    const binaryData = Buffer.from(pdfBytes);
    const inputItem = {
      binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } },
      json: {},
    };
    const params = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([
        { page: 0, options: { x: 10, y: 10 } },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocCreateField();
    const execMock = createExecuteFunctionsMock(inputItem, params);
    await expect(node.execute.call(execMock)).rejects.toThrow(/text/);
  });

  it('should throw if page index is negative', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([400, 400]);
    const pdfBytes = await pdfDoc.save();
    const binaryData = Buffer.from(pdfBytes);
    const inputItem = {
      binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } },
      json: {},
    };
    const params = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([
        { value: 'Test', page: -1, options: { x: 10, y: 10 } },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocCreateField();
    const execMock = createExecuteFunctionsMock(inputItem, params);
    await expect(node.execute.call(execMock)).rejects.toThrow(/index/);
  });

  it('should push error to items when continueOnFail is true', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([400, 400]);
    const pdfBytes = await pdfDoc.save();
    const binaryData = Buffer.from(pdfBytes);
    const inputItem = {
      binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } },
      json: { test: 'val' },
    };
    const params = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([
        { value: 'Test', page: 999, options: { x: 10, y: 10 } }, // invalid page index to force error
      ]),
      maxPdfSize: 10,
    };
    const node = new DocCreateField();
    const execMock = {
      ...createExecuteFunctionsMock(inputItem, params),
      continueOnFail: () => true,
      getInputData: () => [inputItem],
    };
    // @ts-ignore
    const result = await node.execute.call(execMock);
    expect(result[0][0].json).toHaveProperty('test', 'val');
    expect(result[0][0]).toHaveProperty('error');
    expect(result[0][0]).toHaveProperty('pairedItem', 0);
  });
});
