import {
	matchPath,
	jsonResponse,
	errorResponse,
	parseJsonBody,
} from '../utils/route_handling';
import {
	readDbFile,
	writeDbFile,
	generateId,
} from '../db/db_utils';

// Define the path to the accounts data file
const ACCOUNTS_FILE = 'db/accounts.json';
// Define the path to the users data file
const USERS_FILE = 'db/users.json';
// Define the path to the posts data file
const POSTS_FILE = 'db/posts.json';

// Define the structure of an Account
interface Account {
	id: string;
	name: string;
	// Add other account-specific fields here if needed
	// For example: balance?: number;
}

// Define the structure of a User
interface User {
	id: string;
	username: string;
	email: string;
	accountId: string;
}

// Define the structure of a Post
interface Post {
	id: string;
	title: string;
	content: string;
	userId: string;
}

type Handler = (
	req: Request,
	params: Record<string, string>,
) => Promise<Response> | Response;

interface Route {
	pattern: string;
	handlers: {
		[method: string]: Handler;
	};
}

const apiRoutes: Route[] = [
	{
		pattern: '/api',
		handlers: {
			GET: () => jsonResponse({ message: 'API is running!' }),
		},
	},
	{
		pattern: '/api/healthcheck',
		handlers: {
			GET: () => jsonResponse({ status: 'healthy' }),
		},
	},
	{
		pattern: '/api/hello',
		handlers: {
			GET: () => jsonResponse({ message: 'Hello, world!' }),
			POST: async (req) => {
				const body = await parseJsonBody(req);
				return jsonResponse({
					message: `Hello, ${body?.name || 'anonymous'}!`,
					received: body,
				});
			},
		},
	},
	{
		pattern: '/api/hello/:name',
		handlers: {
			GET: (req, params) => {
				return jsonResponse({ message: `Hello, ${params.name}!` });
			},
		},
	},
	// Routes for /api/accounts
	{
		pattern: '/api/accounts',
		handlers: {
			// GET /api/accounts - Retrieve all accounts
			GET: async () => {
				const accounts = await readDbFile(ACCOUNTS_FILE);
				return jsonResponse(accounts);
			},
			// POST /api/accounts - Create a new account
			POST: async (req) => {
				const body = await parseJsonBody(req);
				if (!body || typeof body.name !== 'string') {
					return errorResponse(
						'Invalid account data: name is required and must be a string.',
						400,
					);
				}
				const newAccount: Account = {
					id: generateId(),
					name: body.name,
					// Initialize other fields if necessary
				};
				const accounts = await readDbFile(ACCOUNTS_FILE);
				accounts.push(newAccount);
				await writeDbFile(ACCOUNTS_FILE, accounts);
				return jsonResponse(newAccount, 201);
			},
		},
	},
	// Routes for /api/accounts/:id
	{
		pattern: '/api/accounts/:id',
		handlers: {
			// GET /api/accounts/:id - Retrieve a specific account by ID
			GET: async (req, params) => {
				const accounts = (await readDbFile(ACCOUNTS_FILE)) as Account[];
				const account = accounts.find((acc) => acc.id === params.id);
				if (account) {
					return jsonResponse(account);
				}
				return errorResponse('Account not found', 404);
			},
			// PUT /api/accounts/:id - Update a specific account by ID
			PUT: async (req, params) => {
				const body = await parseJsonBody(req);
				if (!body || typeof body.name !== 'string') {
					return errorResponse(
						'Invalid account data: name is required and must be a string.',
						400,
					);
				}
				const accounts = (await readDbFile(ACCOUNTS_FILE)) as Account[];
				const accountIndex = accounts.findIndex(
					(acc) => acc.id === params.id,
				);
				if (accountIndex !== -1) {
					accounts[accountIndex] = {
						...accounts[accountIndex],
						name: body.name,
						// Update other fields as necessary
					};
					await writeDbFile(ACCOUNTS_FILE, accounts);
					return jsonResponse(accounts[accountIndex]);
				}
				return errorResponse('Account not found', 404);
			},
			// DELETE /api/accounts/:id - Delete a specific account by ID
			DELETE: async (req, params) => {
				const accounts = (await readDbFile(ACCOUNTS_FILE)) as Account[];
				const initialLength = accounts.length;
				const filteredAccounts = accounts.filter(
					(acc) => acc.id !== params.id,
				);
				if (filteredAccounts.length < initialLength) {
					await writeDbFile(ACCOUNTS_FILE, filteredAccounts);
					return new Response(null, { status: 204 }); // No Content
				}
				return errorResponse('Account not found', 404);
			},
		},
	},
	// Routes for /api/users
	{
		pattern: '/api/users',
		handlers: {
			// GET /api/users - Retrieve all users
			GET: async () => {
				const users = await readDbFile(USERS_FILE);
				return jsonResponse(users);
			},
			// POST /api/users - Create a new user
			POST: async (req) => {
				const body = await parseJsonBody(req);
				if (
					!body ||
					typeof body.username !== 'string' ||
					typeof body.email !== 'string' ||
					typeof body.accountId !== 'string'
				) {
					return errorResponse(
						'Invalid user data: username, email, and accountId are required.',
						400,
					);
				}

				// Bonus Validation: Check if accountId exists
				const accounts = (await readDbFile(ACCOUNTS_FILE)) as Account[];
				const accountExists = accounts.some(
					(acc) => acc.id === body.accountId,
				);
				if (!accountExists) {
					return errorResponse(
						`Account with id ${body.accountId} not found.`,
						400, // Or 404, 400 seems more appropriate for invalid input
					);
				}

				const newUser: User = {
					id: generateId(),
					username: body.username,
					email: body.email,
					accountId: body.accountId,
				};
				const users = await readDbFile(USERS_FILE);
				users.push(newUser);
				await writeDbFile(USERS_FILE, users);
				return jsonResponse(newUser, 201);
			},
		},
	},
	// Routes for /api/users/:id
	{
		pattern: '/api/users/:id',
		handlers: {
			// GET /api/users/:id - Retrieve a specific user by ID
			GET: async (req, params) => {
				const users = (await readDbFile(USERS_FILE)) as User[];
				const user = users.find((u) => u.id === params.id);
				if (user) {
					return jsonResponse(user);
				}
				return errorResponse('User not found', 404);
			},
			// PUT /api/users/:id - Update a specific user by ID
			PUT: async (req, params) => {
				const body = await parseJsonBody(req);
				if (
					!body ||
					(typeof body.username !== 'string' &&
						typeof body.email !== 'string')
				) {
					return errorResponse(
						'Invalid user data: username or email must be provided for update.',
						400,
					);
				}

				const users = (await readDbFile(USERS_FILE)) as User[];
				const userIndex = users.findIndex((u) => u.id === params.id);

				if (userIndex !== -1) {
					const updatedUser = { ...users[userIndex] };
					if (typeof body.username === 'string') {
						updatedUser.username = body.username;
					}
					if (typeof body.email === 'string') {
						updatedUser.email = body.email;
					}
					// accountId and id are not updated
					users[userIndex] = updatedUser;
					await writeDbFile(USERS_FILE, users);
					return jsonResponse(updatedUser);
				}
				return errorResponse('User not found', 404);
			},
			// DELETE /api/users/:id - Delete a specific user by ID
			DELETE: async (req, params) => {
				const users = (await readDbFile(USERS_FILE)) as User[];
				const initialLength = users.length;
				const filteredUsers = users.filter((u) => u.id !== params.id);

				if (filteredUsers.length < initialLength) {
					await writeDbFile(USERS_FILE, filteredUsers);
					return new Response(null, { status: 204 }); // No Content
				}
				return errorResponse('User not found', 404);
			},
		},
	},
	// Route for /api/accounts/:accountId/users
	{
		pattern: '/api/accounts/:accountId/users',
		handlers: {
			// GET /api/accounts/:accountId/users - Retrieve all users for a specific account
			GET: async (req, params) => {
				const users = (await readDbFile(USERS_FILE)) as User[];
				const accountUsers = users.filter(
					(user) => user.accountId === params.accountId,
				);
				return jsonResponse(accountUsers);
			},
		},
	},
	// Routes for /api/posts
	{
		pattern: '/api/posts',
		handlers: {
			// GET /api/posts - Retrieve all posts
			GET: async () => {
				const posts = await readDbFile(POSTS_FILE);
				return jsonResponse(posts);
			},
			// POST /api/posts - Create a new post
			POST: async (req) => {
				const body = await parseJsonBody(req);
				if (
					!body ||
					typeof body.title !== 'string' ||
					typeof body.content !== 'string' ||
					typeof body.userId !== 'string'
				) {
					return errorResponse(
						'Invalid post data: title, content, and userId are required.',
						400,
					);
				}

				// Bonus Validation: Check if userId exists
				const users = (await readDbFile(USERS_FILE)) as User[];
				const userExists = users.some((user) => user.id === body.userId);
				if (!userExists) {
					return errorResponse(
						`User with id ${body.userId} not found. Cannot create post.`,
						400, // Or 404; 400 implies bad request due to invalid foreign key
					);
				}

				const newPost: Post = {
					id: generateId(),
					title: body.title,
					content: body.content,
					userId: body.userId,
				};
				const posts = await readDbFile(POSTS_FILE);
				posts.push(newPost);
				await writeDbFile(POSTS_FILE, posts);
				return jsonResponse(newPost, 201);
			},
		},
	},
	// Routes for /api/posts/:id
	{
		pattern: '/api/posts/:id',
		handlers: {
			// GET /api/posts/:id - Retrieve a specific post by ID
			GET: async (req, params) => {
				const posts = (await readDbFile(POSTS_FILE)) as Post[];
				const post = posts.find((p) => p.id === params.id);
				if (post) {
					return jsonResponse(post);
				}
				return errorResponse('Post not found', 404);
			},
			// PUT /api/posts/:id - Update a specific post by ID
			PUT: async (req, params) => {
				const body = await parseJsonBody(req);
				if (
					!body ||
					(typeof body.title !== 'string' &&
						typeof body.content !== 'string')
				) {
					return errorResponse(
						'Invalid post data: title or content must be provided for update.',
						400,
					);
				}

				const posts = (await readDbFile(POSTS_FILE)) as Post[];
				const postIndex = posts.findIndex((p) => p.id === params.id);

				if (postIndex !== -1) {
					const updatedPost = { ...posts[postIndex] };
					if (typeof body.title === 'string') {
						updatedPost.title = body.title;
					}
					if (typeof body.content === 'string') {
						updatedPost.content = body.content;
					}
					// userId and id are not updated
					posts[postIndex] = updatedPost;
					await writeDbFile(POSTS_FILE, posts);
					return jsonResponse(updatedPost);
				}
				return errorResponse('Post not found', 404);
			},
			// DELETE /api/posts/:id - Delete a specific post by ID
			DELETE: async (req, params) => {
				const posts = (await readDbFile(POSTS_FILE)) as Post[];
				const initialLength = posts.length;
				const filteredPosts = posts.filter((p) => p.id !== params.id);

				if (filteredPosts.length < initialLength) {
					await writeDbFile(POSTS_FILE, filteredPosts);
					return new Response(null, { status: 204 }); // No Content
				}
				return errorResponse('Post not found', 404);
			},
		},
	},
	// Route for /api/users/:userId/posts
	{
		pattern: '/api/users/:userId/posts',
		handlers: {
			// GET /api/users/:userId/posts - Retrieve all posts for a specific user
			GET: async (req, params) => {
				const posts = (await readDbFile(POSTS_FILE)) as Post[];
				const userPosts = posts.filter(
					(post) => post.userId === params.userId,
				);
				return jsonResponse(userPosts);
			},
		},
	},
];

const handleApiRequest = async (req: Request): Promise<Response> => {
	const url = new URL(req.url);
	const path = url.pathname;
	const method = req.method;

	for (const route of apiRoutes) {
		const params = matchPath(route.pattern, path);

		if (params !== null) {
			const handler = route.handlers[method];

			if (handler) {
				try {
					return await handler(req, params);
				} catch (error) {
					console.error(`Error handling ${method} ${path}:`, error);
					return errorResponse('Internal Server Error', 500);
				}
			}
			return new Response('Method not allowed', {
				status: 405,
				headers: {
					Allow: Object.keys(route.handlers).join(', '),
					'Content-Type': 'text/plain',
				},
			});
		}
	}

	return new Response('API Endpoint Not Found', {
		status: 404,
		headers: {
			'Content-Type': 'text/plain',
		},
	});
};

export { handleApiRequest, apiRoutes };
