import * as fs from 'fs/promises';

/**
 * Reads a JSON file asynchronously, parses its content into an array,
 * and returns the array. Handles potential errors by logging them and
 * returning an empty array.
 *
 * @param filePath The path to the JSON file.
 * @returns A promise that resolves to an array of any type, or an empty array in case of an error.
 */
export async function readDbFile(filePath: string): Promise<any[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as any[];
  } catch (error) {
    console.error(`Error reading or parsing file at ${filePath}:`, error);
    return [];
  }
}

/**
 * Serializes the data array to a JSON string and writes it to the file asynchronously.
 * Handles potential errors during writing.
 *
 * @param filePath The path to the JSON file.
 * @param data The array of data to write.
 * @returns A promise that resolves when the file has been written.
 */
export async function writeDbFile(filePath: string, data: any[]): Promise<void> {
  try {
    const jsonData = JSON.stringify(data, null, 2); // Using null, 2 for pretty printing
    await fs.writeFile(filePath, jsonData, 'utf-8');
  } catch (error) {
    console.error(`Error writing file at ${filePath}:`, error);
    // Optionally, rethrow the error or handle it as per application needs
  }
}

/**
 * Generates a simple unique ID based on the current timestamp.
 *
 * @returns A string representing the unique ID.
 */
export function generateId(): string {
  return Date.now().toString();
}
