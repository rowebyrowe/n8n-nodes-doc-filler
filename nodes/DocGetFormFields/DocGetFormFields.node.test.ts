import { PDFDocument } from 'pdf-lib';
import { DocGetFormFields } from './DocGetFormFields.node';

// Minimal mock for n8n's IExecuteFunctions
function createExecuteFunctionsMock(binaryData: Buffer, mimeType = 'application/pdf') {
  return {
    getInputData: () => [{
      binary: { data: { data: binaryData, mimeType, size: binaryData.length } },
    }],
    getNodeParameter: (name: string) => (name === 'dataPropertyName' ? 'data' : 10),
    helpers: {
      getBinaryDataBuffer: async () => binaryData,
    },
    getNode: () => ({}),
    continueOnFail: () => false,
    prepareOutputData: (data: any) => [data],
  } as any;
}

jest.setTimeout(5000);
describe('DocGetFormFields Node', () => {
  it('should throw if binary data is missing', async () => {
    const node = new DocGetFormFields();
    const execMock = {
      getInputData: () => [{ binary: {} }],
      getNodeParameter: () => 'data',
      getNode: () => ({}),
      continueOnFail: () => false,
      prepareOutputData: (data: any) => [data],
    } as any;
    // @ts-ignore
    await expect(node.execute.call(execMock)).rejects.toThrow(/No binary data found/);
  });

  it('should throw if file is not a PDF', async () => {
    const node = new DocGetFormFields();
    const execMock = {
      getInputData: () => [{ binary: { data: { data: Buffer.from([]), mimeType: 'image/png', size: 10 } } }],
      getNodeParameter: () => 'data',
      getNode: () => ({}),
      continueOnFail: () => false,
      prepareOutputData: (data: any) => [data],
    } as any;
    // @ts-ignore
    await expect(node.execute.call(execMock)).rejects.toThrow(/should be a PDF file/);
  });

  it('should throw if binary data is too large', async () => {
    const node = new DocGetFormFields();
    const execMock = {
      getInputData: () => [{ binary: { data: { data: Buffer.from([]), mimeType: 'application/pdf', size: 11 * 1024 * 1024 } } }],
      getNodeParameter: (name: string) => (name === 'dataPropertyName' ? 'data' : 10),
      getNode: () => ({}),
      continueOnFail: () => false,
      prepareOutputData: (data: any) => [data],
    } as any;
    // @ts-ignore
    await expect(node.execute.call(execMock)).rejects.toThrow(/exceeds maximum allowed size/);
  });

  it('should throw if buffer is too large', async () => {
    const node = new DocGetFormFields();
    const execMock = {
      getInputData: () => [{ binary: { data: { data: Buffer.alloc(1), mimeType: 'application/pdf', size: 1 } } }],
      getNodeParameter: (name: string) => (name === 'dataPropertyName' ? 'data' : 0.000001), // 1 byte max
      getNode: () => ({}),
      helpers: { getBinaryDataBuffer: async () => Buffer.alloc(2) }, // 2 bytes
      continueOnFail: () => false,
      prepareOutputData: (data: any) => [data],
    } as any;
    // @ts-ignore
    await expect(node.execute.call(execMock)).rejects.toThrow(/exceeds maximum allowed size/);
  });

  it('should set itemIndex in error.context and rethrow if error.context does not exist', async () => {
    const node = new DocGetFormFields();
    const errorWithContext = new Error('test error') as any;
    const execMock = {
      getInputData: () => [{ binary: { data: { data: Buffer.from([]), mimeType: 'application/pdf', size: 10 } } }],
      getNodeParameter: () => 'data',
      getNode: () => ({}),
      continueOnFail: () => false,
      prepareOutputData: (data: any) => [data],
      helpers: {
        getBinaryDataBuffer: async () => { throw errorWithContext; }
      },
    } as any;
    // @ts-ignore
    await expect(node.execute.call(execMock)).rejects.toMatchObject({ context: { itemIndex: 0 } });
  });

  it('should continue on fail if continueOnFail is true', async () => {
    const node = new DocGetFormFields();
    const execMock = {
      getInputData: () => [{ binary: {} }],
      getNodeParameter: () => 'data',
      getNode: () => ({}),
      continueOnFail: () => true,
      prepareOutputData: (data: any) => [data],
    } as any;
    // @ts-ignore
    const result = await node.execute.call(execMock);
    expect(result[0][0].json.error).toMatch(/No binary data found/);
  });

  it('should handle multiple items', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    form.createTextField('Field1');
    const pdfBytes = await pdfDoc.save();
    const binaryData = Buffer.from(pdfBytes);
    const node = new DocGetFormFields();
    const execMock = {
      getInputData: () => [
        { binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } } },
        { binary: {} },
      ],
      getNodeParameter: () => 'data',
      getNode: () => ({}),
      helpers: { getBinaryDataBuffer: async () => binaryData },
      continueOnFail: () => true,
      prepareOutputData: (data: any) => data.map((item: any) => [item]),
    } as any;
    // @ts-ignore
    const result = await node.execute.call(execMock);
    expect(result.length).toBe(2);
    expect(result[0][0].json.totalFields).toBe(1);
    expect(result[1][0].json.error).toMatch(/No binary data found/);
  });

  it('should extract form fields from a PDF', async () => {
    // Create a PDF with a text field
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    form.createTextField('TestField');
    form.createCheckBox('Check1');
    form.createRadioGroup('Radio1');
    const pdfBytes = await pdfDoc.save();
    const binaryData = Buffer.from(pdfBytes);

    const node = new DocGetFormFields();
    const execMock = createExecuteFunctionsMock(binaryData);
    // @ts-ignore
    const result = await node.execute.call(execMock);
    const output = result[0][0].json;
    expect(output.totalFields).toBe(3);
    const fields = Array.isArray(output.fields) ? output.fields : [];
    expect(fields.map((f: any) => f.name)).toEqual(
      expect.arrayContaining(['TestField', 'Check1', 'Radio1'])
    );
  });
});
