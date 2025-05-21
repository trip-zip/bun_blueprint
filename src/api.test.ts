import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'bun:test';
import { handleApiRequest } from './apiRoutes';
import { readDbFile, writeDbFile } from '../db/db_utils';

const ACCOUNTS_FILE = 'db/accounts.json';
let originalAccountsData: any[] = []; // To store the original state of accounts.json

// Helper function to make requests to our API handler
async function makeRequest(path: string, method: string, body?: any) {
	const request = new Request(`http://localhost${path}`, {
		method,
		body: body ? JSON.stringify(body) : undefined,
		headers: body ? { 'Content-Type': 'application/json' } : undefined,
	});
	return handleApiRequest(request);
}

describe('Account API Endpoints', () => {
	beforeAll(async () => {
		// Save the original content of accounts.json
		try {
			originalAccountsData = await readDbFile(ACCOUNTS_FILE);
		} catch (e) {
			// If the file doesn't exist or is empty, it's fine, originalAccountsData will be []
			console.warn('Could not read original accounts.json, starting fresh. Error:', e)
			originalAccountsData = [];
		}
	});

	beforeEach(async () => {
		// Clear accounts.json before each test to ensure a clean state
		await writeDbFile(ACCOUNTS_FILE, []);
	});

	afterAll(async () => {
		// Restore the original content of accounts.json after all tests
		await writeDbFile(ACCOUNTS_FILE, originalAccountsData);
	});

	// Test suite for POST /api/accounts
	describe('POST /api/accounts', () => {
		it('should create a new account successfully (201)', async () => {
			const response = await makeRequest('/api/accounts', 'POST', { name: 'Test Account 1' });
			expect(response.status).toBe(201);
			const data = await response.json();
			expect(data.id).toBeString();
			expect(data.name).toBe('Test Account 1');

			// Verify it was written to the file
			const accountsInDb = await readDbFile(ACCOUNTS_FILE);
			expect(accountsInDb.length).toBe(1);
			expect(accountsInDb[0].name).toBe('Test Account 1');
		});

		it('should return 400 for missing name', async () => {
			const response = await makeRequest('/api/accounts', 'POST', {});
			expect(response.status).toBe(400);
			const error = await response.json();
			expect(error.error).toBe('Invalid account data: name is required and must be a string.');
		});
	});

	// Test suite for GET /api/accounts
	describe('GET /api/accounts', () => {
		it('should fetch all accounts (initially empty)', async () => {
			const response = await makeRequest('/api/accounts', 'GET');
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data).toBeArray();
			expect(data.length).toBe(0);
		});

		it('should fetch all accounts after creating one', async () => {
			await makeRequest('/api/accounts', 'POST', { name: 'Account A' });
			const response = await makeRequest('/api/accounts', 'GET');
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.length).toBe(1);
			expect(data[0].name).toBe('Account A');
		});
	});

	// Test suite for GET /api/accounts/:id
	describe('GET /api/accounts/:id', () => {
		it('should fetch an existing account by ID (200)', async () => {
			const createResponse = await makeRequest('/api/accounts', 'POST', { name: 'Fetch Me' });
			const newAccount = await createResponse.json();

			const response = await makeRequest(`/api/accounts/${newAccount.id}`, 'GET');
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.id).toBe(newAccount.id);
			expect(data.name).toBe('Fetch Me');
		});

		it('should return 404 for a non-existent account ID', async () => {
			const response = await makeRequest('/api/accounts/nonexistentid123', 'GET');
			expect(response.status).toBe(404);
			const error = await response.json();
			expect(error.error).toBe('Account not found');
		});
	});

	// Test suite for PUT /api/accounts/:id
	describe('PUT /api/accounts/:id', () => {
		it('should update an existing account successfully (200)', async () => {
			const createResponse = await makeRequest('/api/accounts', 'POST', { name: 'Original Name' });
			const newAccount = await createResponse.json();

			const updateResponse = await makeRequest(`/api/accounts/${newAccount.id}`, 'PUT', { name: 'Updated Name' });
			expect(updateResponse.status).toBe(200);
			const updatedData = await updateResponse.json();
			expect(updatedData.id).toBe(newAccount.id);
			expect(updatedData.name).toBe('Updated Name');

			// Verify in DB
			const accountsInDb = await readDbFile(ACCOUNTS_FILE);
			expect(accountsInDb[0].name).toBe('Updated Name');
		});

		it('should return 404 when trying to update a non-existent account', async () => {
			const response = await makeRequest('/api/accounts/nonexistentid456', 'PUT', { name: 'Ghost Name' });
			expect(response.status).toBe(404);
			const error = await response.json();
			expect(error.error).toBe('Account not found');
		});

		it('should return 400 for missing name on update', async () => {
			const createResponse = await makeRequest('/api/accounts', 'POST', { name: 'Valid Account' });
			const newAccount = await createResponse.json();

			const response = await makeRequest(`/api/accounts/${newAccount.id}`, 'PUT', {});
			expect(response.status).toBe(400);
			const error = await response.json();
			expect(error.error).toBe('Invalid account data: name is required and must be a string.');
		});
	});

	// Test suite for DELETE /api/accounts/:id
	describe('DELETE /api/accounts/:id', () => {
		it('should delete an existing account successfully (204)', async () => {
			const createResponse = await makeRequest('/api/accounts', 'POST', { name: 'To Be Deleted' });
			const newAccount = await createResponse.json();

			const deleteResponse = await makeRequest(`/api/accounts/${newAccount.id}`, 'DELETE');
			expect(deleteResponse.status).toBe(204);
			expect(await deleteResponse.text()).toBe(''); // No content

			// Verify it's removed from the DB
			const accountsInDb = await readDbFile(ACCOUNTS_FILE);
			expect(accountsInDb.length).toBe(0);
		});

		it('should return 404 when trying to delete a non-existent account', async () => {
			const response = await makeRequest('/api/accounts/nonexistentid789', 'DELETE');
			expect(response.status).toBe(404);
			const error = await response.json();
			expect(error.error).toBe('Account not found');
		});
	});
});
