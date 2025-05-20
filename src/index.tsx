import { serve } from 'bun';
import { testConnection } from '../db';
import index from './index.html';
import { handleApiRequest } from './apiRoutes';

const serverOptions = {
	port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3000,

	//These will just be staticly served files
	routes: {
		'/': index,
	},

	// This handler will process anything not matched by routes, so api endpoints might be a good move
	async fetch(req: Request) {
		const url = new URL(req.url);

		if (url.pathname.startsWith('/api/')) {
			return handleApiRequest(req);
		}

		return new Response(index);
	},

	error(error: Error) {
		console.error('Server error:', error);
		return new Response(`Internal Server Error: ${error.message}`, {
			status: 500,
			headers: { 'Content-Type': 'text/plain' },
		});
	},

	development:
		process.env.NODE_ENV !== 'production'
			? {
					hmr: true,
					console: true,
				}
			: undefined,
};

const startServer = async () => {
	if (await testConnection()) {
		const server = serve(serverOptions);
		console.log(`🚀 Server listening on ${server.url}`);
		return server;
	}
	console.error('Database connection failed');
	process.exit(1);
};

if (import.meta.main) {
	startServer();
}

export { serverOptions, startServer };
