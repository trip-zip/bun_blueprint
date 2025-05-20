import { SQL } from 'bun';

const db = new SQL({
	url: Bun.env.DATABASE_URL,
	tls: false,
	idleTimeout: 30,
	connectionTimeout: 15,
	bigint: true,
	onconnect: (client) => {},
	onclose: (client) => {
		console.log('Database connection closed');
	},
});

async function testConnection() {
	try {
		const result = await db`SELECT 1 as connected`;
		return true;
	} catch (error) {
		console.error('Database connection failed:', error.message);
		return false;
	}
}

export { db as sql, testConnection };
