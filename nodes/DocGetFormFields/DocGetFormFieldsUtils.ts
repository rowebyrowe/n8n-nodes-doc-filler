import { IBinaryData } from 'n8n-workflow';

export function isPdfDocument(binaryData: IBinaryData): boolean {
	return binaryData.mimeType === 'application/pdf';
}
