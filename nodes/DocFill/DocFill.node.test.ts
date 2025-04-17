import { PDFDocument } from 'pdf-lib';
import { DocFill } from './DocFill.node';

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
describe('DocFill Node', () => {

  it('should throw for invalid field type', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    form.createTextField('Field1');
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
        { key: 'Field1', value: 'value', type: 'unknownType' },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocFill();
    const execMock = createExecuteFunctionsMock(inputItem, params);
    await expect(node.execute.call(execMock)).rejects.toThrow(/Invalid field type/);
  });

  it('should continue on fail for invalid field type', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    form.createTextField('Field1');
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
        { key: 'Field1', value: 'value', type: 'unknownType' },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocFill();
    const execMock = {
      ...createExecuteFunctionsMock(inputItem, params),
      continueOnFail: () => true,
    };
    // @ts-ignore
    const result = await node.execute.call(execMock);
    expect(result[0][0].json.error).toMatch(/Invalid field type/);
  });

  it('should process batch with valid and invalid configs', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    form.createTextField('Field1');
    form.createTextField('Field2');
    const pdfBytes = await pdfDoc.save();
    const binaryData = Buffer.from(pdfBytes);
    const inputItem1 = {
      binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } },
      json: {},
    };
    const inputItem2 = {
      binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } },
      json: {},
    };
    const params1: Record<string, any> = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([
        { key: 'Field1', value: 'John', type: 'textfield' },
      ]),
      maxPdfSize: 10,
    };
    const params2: Record<string, any> = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([
        { key: 'Field2', value: 'Doe', type: 'unknownType' },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocFill();
    const execMock = {
      getInputData: () => [inputItem1, inputItem2],
      getNodeParameter: (name: string, itemIndex: number) => (itemIndex === 0 ? params1[name] : params2[name]),
      helpers: {
        getBinaryDataBuffer: async (_itemIndex: number, _dataPropertyName: string) => binaryData,
        prepareBinaryData: async (buffer: Buffer, fileName: string, mimeType: string) => ({
          data: buffer,
          fileName,
          mimeType,
          size: buffer.length,
        }),
      },
      getNode: () => ({}),
      continueOnFail: () => true,
      prepareOutputData: (data: any) => data.map((item: any) => [item]),
    } as any;
    // @ts-ignore
    const result = await node.execute.call(execMock);
    expect(result.length).toBe(2);
    expect(result[0][0].binary).toBeDefined(); // valid
    expect(result[1][0].json.error).toMatch(/Invalid field type/); // invalid
  });

  it('should fill a checkbox in a PDF', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    const cb = form.createCheckBox('CheckField');
    cb.addToPage(pdfDoc.getPages()[0], { x: 50, y: 700 });
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
        { key: 'CheckField', value: 'true', type: 'checkbox' },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocFill();
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
    const outForm = outPdfDoc.getForm();
    const outField = outForm.getCheckBox('CheckField');
    expect(outField).toBeDefined();
    expect(outField.isChecked()).toBe(true);
  });

  it('should fill a dropdown in a PDF', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    const dd = form.createDropdown('DropField');
    dd.addOptions(['A', 'B', 'C']);
    dd.addToPage(pdfDoc.getPages()[0], { x: 50, y: 700 });
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
        { key: 'DropField', value: 'B', type: 'dropdown' },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocFill();
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
    const outForm = outPdfDoc.getForm();
    const outField = outForm.getDropdown('DropField');
    expect(outField).toBeDefined();
    expect(outField.getSelected()).toEqual(['B']);
  });

  it('should fill a radiogroup in a PDF', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    const radio = form.createRadioGroup('RadioField');
    radio.addOptionToPage('Yes', pdfDoc.getPages()[0], { x: 50, y: 700 });
    radio.addOptionToPage('No', pdfDoc.getPages()[0], { x: 100, y: 700 });
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
        { key: 'RadioField', value: 'Yes', type: 'radiogroup' },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocFill();
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
    const outForm = outPdfDoc.getForm();
    const outField = outForm.getRadioGroup('RadioField');
    expect(outField).toBeDefined();
    expect(outField.getSelected()).toBe('Yes');
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
      configurationJson: JSON.stringify([]),
      maxPdfSize: 1,
    };
    const node = new DocFill();
    const execMock = createExecuteFunctionsMock(inputItem, params);
    await expect(node.execute.call(execMock)).rejects.toThrow(/exceeds maximum allowed size/);
  });

  it('should throw if input is not a PDF', async () => {
    const inputItem = {
      binary: { data: { data: Buffer.from('notapdf'), mimeType: 'text/plain', size: 7 } },
      json: {},
    };
    const params = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([]),
      maxPdfSize: 10,
    };
    const node = new DocFill();
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
      configurationJson: JSON.stringify([]),
      maxPdfSize: 1,
    };
    const node = new DocFill();
    const execMock = createExecuteFunctionsMock(inputItem, params);
    await expect(node.execute.call(execMock)).rejects.toThrow(/exceeds maximum allowed size/);
  });

  // Prepare PDF with a text field
  it('should fill a text field in a PDF', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const form = pdfDoc.getForm();
    form.createTextField('NameField');
    const pdfBytes = await pdfDoc.save();    const binaryData = Buffer.from(pdfBytes);

    // n8n expects binary data under property 'data'
    const inputItem = {
      binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } },
      json: {},
    };
    const params = {
      dataPropertyName: 'data',
      dataPropertyNameOut: 'data',
      configurationJson: JSON.stringify([
        {
          key: 'NameField',
          value: 'John Doe',
          type: 'textfield',
        },
      ]),
      maxPdfSize: 10,
    };
    const node = new DocFill();
    const execMock = createExecuteFunctionsMock(inputItem, params);
    // @ts-ignore
    const result = await node.execute.call(execMock);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
});

it('should fill a dropdown in a PDF', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage();
  const form = pdfDoc.getForm();
  const dd = form.createDropdown('DropField');
  dd.addOptions(['A', 'B', 'C']);
  dd.addToPage(pdfDoc.getPages()[0], { x: 50, y: 700 });
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
      { key: 'DropField', value: 'B', type: 'dropdown' },
    ]),
    maxPdfSize: 10,
  };
  const node = new DocFill();
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
  const outForm = outPdfDoc.getForm();
  const outField = outForm.getDropdown('DropField');
  expect(outField).toBeDefined();
  expect(outField.getSelected()).toEqual(['B']);
});

it('should fill a radiogroup in a PDF', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage();
  const form = pdfDoc.getForm();
  const radio = form.createRadioGroup('RadioField');
  radio.addOptionToPage('Yes', pdfDoc.getPages()[0], { x: 50, y: 700 });
  radio.addOptionToPage('No', pdfDoc.getPages()[0], { x: 100, y: 700 });
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
      { key: 'RadioField', value: 'Yes', type: 'radiogroup' },
    ]),
    maxPdfSize: 10,
  };
  const node = new DocFill();
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
  const outForm = outPdfDoc.getForm();
  const outField = outForm.getRadioGroup('RadioField');
  expect(outField).toBeDefined();
  expect(outField.getSelected()).toBe('Yes');
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
    configurationJson: JSON.stringify([]),
    maxPdfSize: 1,
  };
  const node = new DocFill();
  const execMock = createExecuteFunctionsMock(inputItem, params);
  await expect(node.execute.call(execMock)).rejects.toThrow(/exceeds maximum allowed size/);
});

it('should throw if input is not a PDF', async () => {
  const inputItem = {
    binary: { data: { data: Buffer.from('notapdf'), mimeType: 'text/plain', size: 7 } },
    json: {},
  };
  const params = {
    dataPropertyName: 'data',
    dataPropertyNameOut: 'data',
    configurationJson: JSON.stringify([]),
    maxPdfSize: 10,
  };
  const node = new DocFill();
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
    configurationJson: JSON.stringify([]),
    maxPdfSize: 1,
  };
  const node = new DocFill();
  const execMock = createExecuteFunctionsMock(inputItem, params);
  await expect(node.execute.call(execMock)).rejects.toThrow(/exceeds maximum allowed size/);
});

// Prepare PDF with a text field
it('should fill a text field in a PDF', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage();
  const form = pdfDoc.getForm();
  form.createTextField('NameField');
  const pdfBytes = await pdfDoc.save();
  const binaryData = Buffer.from(pdfBytes);

  // n8n expects binary data under property 'data'
  const inputItem = {
    binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } },
    json: {},
  };
  const params = {
    dataPropertyName: 'data',
    dataPropertyNameOut: 'data',
    configurationJson: JSON.stringify([
      {
        key: 'NameField',
        value: 'John Doe',
        type: 'textfield',
      },
    ]),
    maxPdfSize: 10,
  };
  const node = new DocFill();
  const execMock = createExecuteFunctionsMock(inputItem, params);
  // @ts-ignore
  const result = await node.execute.call(execMock);
  expect(result).toBeDefined();
  expect(Array.isArray(result)).toBe(true);
  expect(result[0]).toBeDefined();
  expect(Array.isArray(result[0])).toBe(true);
  expect(result[0][0]).toBeDefined();
  const binary = result[0]?.[0]?.binary;
  const outputData = binary?.data;
  if (!outputData) {
    fail('Output binary data is missing');
    return;
  }
  if (!(Buffer.isBuffer(outputData) || (outputData.data && Buffer.isBuffer(outputData.data)))) {
    fail('Output binary data is not a Buffer');
    return;
  }
});

it('should throw if configurationJson is invalid JSON', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage();
  const form = pdfDoc.getForm();
  form.createTextField('Field1');
  const pdfBytes = await pdfDoc.save();
  const binaryData = Buffer.from(pdfBytes);
  const inputItem = {
    binary: { data: { data: binaryData, mimeType: 'application/pdf', size: binaryData.length } },
    json: {},
  };
  const params = {
    dataPropertyName: 'data',
    dataPropertyNameOut: 'data',
    configurationJson: '{invalidJson:}',
    maxPdfSize: 10,
  };
  const node = new DocFill();
  const execMock = createExecuteFunctionsMock(inputItem, params);
  await expect(node.execute.call(execMock)).rejects.toThrow(/Expected property name or '}' in JSON at position 1/);
});

it('should set itemIndex in error.context if present', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage();
  const form = pdfDoc.getForm();
  form.createTextField('Field1');
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
      { key: 'Field1', value: 'value', type: 'unknownType' },
    ]),
    maxPdfSize: 10,
  };
  const node = new DocFill();
  // Patch fillForm to throw an error with context
  const originalFillForm = require('./DocFillUtils').fillForm;
  require('./DocFillUtils').fillForm = () => { const err: any = new Error('err'); err.context = {}; throw err; };
  const execMock = createExecuteFunctionsMock(inputItem, params);
  await expect(node.execute.call(execMock)).rejects.toMatchObject({ context: { itemIndex: 0 } });
  require('./DocFillUtils').fillForm = originalFillForm;
});

it('should throw error when continueOnFail is false', async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage();
  const form = pdfDoc.getForm();
  form.createTextField('Field1');
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
      { key: 'Field1', value: 'value', type: 'unknownType' },
    ]),
    maxPdfSize: 10,
  };
  const node = new DocFill();
  const execMock = createExecuteFunctionsMock(inputItem, params);
  await expect(node.execute.call(execMock)).rejects.toThrow(/Invalid field type/);
});

});

