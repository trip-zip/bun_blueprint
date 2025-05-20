import {
	matchPath,
	jsonResponse,
	errorResponse,
	parseJsonBody,
} from '../utils/route_handling';

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
