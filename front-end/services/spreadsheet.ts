/**
 * Spreadsheet import / export helpers.
 *
 * - Export: fetches CSV from backend and triggers a browser download (web)
 *   or opens a share sheet (native).
 * - Import: opens a file picker, uploads the selected CSV to the backend,
 *   and returns the result message.
 */

import { Platform, Alert } from 'react-native';
import api from './api';

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Download a CSV export from the server.
 * @param endpoint  e.g. "/export/ingredients"
 * @param filename  suggested filename, e.g. "ingredients.csv"
 */
export async function exportSpreadsheet(endpoint: string, filename: string): Promise<void> {
	try {
		const response = await api.get(endpoint, { responseType: 'blob' });

		if (Platform.OS === 'web') {
			// Create a Blob URL and trigger a download
			const blob = new Blob([response.data], { type: 'text/csv' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} else {
			// On native, use expo-file-system + expo-sharing (lazy imported)
			try {
				// @ts-ignore — these packages may not be installed; wrapped in try/catch
				const FileSystem = await import('expo-file-system');
				// @ts-ignore
				const Sharing = await import('expo-sharing'); // eslint-disable-line
				// @ts-ignore
				const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
				const filePath = `${cacheDir}${filename}`;

				// response.data is a Blob on native — read it as text
				const text: string = await new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onloadend = () => resolve(reader.result as string);
					reader.onerror = reject;
					reader.readAsText(response.data);
				});

				await FileSystem.writeAsStringAsync(filePath, text);
				await Sharing.shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: `Export ${filename}` });
			} catch {
				Alert.alert('Export Error', 'Sharing is not available on this device.');
			}
		}
	} catch (error: any) {
		const msg = error?.response?.data?.error || 'Export failed. Please try again.';
		Alert.alert('Export Error', msg);
		throw error;
	}
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

/**
 * Pick a CSV file and upload it to the server.
 * @param endpoint  e.g. "/import/ingredients"
 * @returns result message from the server, or null if the user cancelled.
 */
export async function importSpreadsheet(endpoint: string): Promise<string | null> {
	try {
		let file: File | null = null;

		if (Platform.OS === 'web') {
			// Use a hidden <input type="file"> element
			file = await new Promise<File | null>((resolve) => {
				const input = document.createElement('input');
				input.type = 'file';
				input.accept = '.csv,text/csv';
				input.onchange = () => {
					const selected = input.files?.[0] ?? null;
					resolve(selected);
				};
				// User cancelled
				input.addEventListener('cancel', () => resolve(null));
				input.click();
			});
		} else {
			// On native, use expo-document-picker (lazy imported)
			try {
				// @ts-ignore — expo-document-picker may not be installed; wrapped in try/catch
				const DocumentPicker = await import('expo-document-picker'); // eslint-disable-line
				const result = await DocumentPicker.getDocumentAsync({
					type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
					copyToCacheDirectory: true,
				});

				if (result.canceled || !result.assets?.length) {
					return null;
				}

				const asset = result.assets[0];
				const response = await fetch(asset.uri);
				const blob = await response.blob();
				file = new File([blob], asset.name || 'import.csv', { type: 'text/csv' });
			} catch {
				Alert.alert('Import Error', 'Document picker is not available on this device.');
				return null;
			}
		}

		if (!file) return null;

		const formData = new FormData();
		formData.append('file', file);

		const response = await api.post(endpoint, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});

		const msg = response.data?.msg || 'Import complete.';
		Alert.alert('Import Complete', msg);
		return msg;
	} catch (error: any) {
		const msg = error?.response?.data?.error || 'Import failed. Please try again.';
		Alert.alert('Import Error', msg);
		return null;
	}
}
