# n8n-nodes-doc-filler

**n8n-nodes-doc-filler** is a custom node package for [n8n](https://n8n.io/) derived from [n8n-nodes-doc-fill](https://github.com/romanmuzikantov/n8n-nodes-doc-fill) that allows you to programmatically extract PDF form field info, fill PDF forms, and add text to PDFs from your n8n workflows. It contains three nodes:

* **Doc Get Form Fields** – Analyze a PDF and extract information about all form fields present in the document.
* **Doc Fill** – Retrieve and fill PDF form fields based on provided keys and values.
* **Doc Create Field** – Add custom text at specified coordinates on a PDF page.

---

## Requirements

- [n8n](https://n8n.io/) (Tested with version 1.0.0 and later)
- Node.js >= 18.x

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for bug fixes, feature requests, or improvements.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE.md) for details.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

---

## Doc Get Form Fields

The **Doc Get Form Fields** node analyzes a PDF file and extracts information about all form fields present in the document.

### Parameters

- **Property Name**: The name of the binary property containing the PDF file to analyze (default: `data`).
- **Max PDF Size**: Maximum allowed size of the PDF file in MB (default: 10).

### Output

The node outputs a JSON object with:
- `totalFields`: The total number of form fields detected in the PDF.
- `fields`: An array of objects, each containing:
  - `name`: The field's name.
  - `type`: The type of the field (e.g., textfield, checkbox, radiogroup, dropdown).

### Example Output

```json
{
  "totalFields": 2,
  "fields": [
    { "name": "firstName", "type": "textfield" },
    { "name": "acceptTerms", "type": "checkbox" }
  ]
}
```

## Doc Fill

Doc Fill takes a PDF as input and 4 parameters: Property Name, Property Name Out, Configuration JSON, Max PDF Size.

* **Property Name**: The internal name representing the PDF file given as input (default: 'data').
* **Property Name Out**: The internal name you want to give to the output PDF file (default: 'data').
* **Configuration JSON**: A JSON following the structure given below to specify which fields you want to change.
* **Max PDF Size**: Maximum allowed size of the PDF file in MB (default: 10).

### Configuration JSON structure

This is the base structure to configure one field, Configuration JSON is expecting an array of this structure.

```typescript
interface DocFillConfig {
    key: string;
    value: string;
    type: 'textfield' | 'checkbox' | 'dropdown' | 'radiogroup';
}
```

* key: The key to find and retrieve the field in the PDF Form.
* value: The value you want to insert for the retrieved field (must be 'true' (check) or 'false' (uncheck) for checkbox field type).
* type: The type of field you want to retrieve (can be 'textfield', 'checkbox', 'dropdown' or 'radiogroup').

### Example

```JSON
[
  {
    "key": "keyOfMyTextField",
    "value": "John Doe",
    "type": "textfield"
  },
  {
    "key": "keyOfMyCheckbox",
    "value": "true",
    "type": "checkbox"
  }
]
```

## Doc Create Field

Doc Create Field takes a PDF as input and 4 parameters: Property Name, Property Name Out, Configuration JSON, Max PDF Size.

* **Property Name**: The internal name representing the PDF file given as input (default: 'data').
* **Property Name Out**: The internal name you want to give to the output PDF file (default: 'data').
* **Configuration JSON**: A JSON following the structure given below to specify the text you want to draw and how/where you want to draw it.
* **Max PDF Size**: Maximum allowed size of the PDF file in MB (default: 10).

### Configuration JSON structure

This is the base structure to draw one text, Configuration JSON is expecting an array of this structure.

```typescript
interface DocCreateFieldConfig {
    page: number,
    value: string;
    options: {
        x: number,
        y: number,
        size: number | undefined,
        opacity: number | undefined,
        colorRed: number | undefined,
        colorGreen: number | undefined,
        colorBlue: number | undefined,
    }
}
```

* page: The page in the PDF on which you want to draw your text.
* value: The text you want to draw.
* options.x: Position on the x axis where you want to start drawing the text.
* options.y: Position on the y axis where you want to start drawing the text.
* options.size: Size of the text you want to draw. (optional, default is 24)
* options.opacity: Opacity of the text you want to draw, must be between 0 and 1. (optional, default is 1)
* options.colorRed: Red value of the RGB color representation. (optional, default is 0)
* options.colorGreen: Green value of the RGB color representation. (optional, default is 0)
* options.colorBlue: Blue value of the RGB color representation. (optional, default is 0)

### Example

```JSON
[
  {
    "page": 0,
    "value": "this is a test!",
    "options": {
      "x": 300,
      "y": 30,
      "size": 12
    }
  }
]
```