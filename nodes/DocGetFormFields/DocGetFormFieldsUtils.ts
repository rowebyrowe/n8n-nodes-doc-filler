import { IBinaryData } from 'n8n-workflow';

export function isPDFDocument(binaryData: IBinaryData): boolean {
	return binaryData.mimeType === 'application/pdf';
}
