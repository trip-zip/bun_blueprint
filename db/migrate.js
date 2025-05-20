import { sql, testConnection } from '../db.js';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const migrationDir = path.resolve('./db/migrations');
const templatePath = path.resolve('./db/migration_template');

async function initMigrationsTable() {
	try {
		await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT,
        run_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
		console.log('Migrations table initialized');
		return true;
	} catch (error) {
		console.error('Error initializing migrations table:', error);
		return false;
	}
}

async function getCompletedMigrations() {
	try {
		const completedMigrations = await sql`
      SELECT id FROM migrations ORDER BY id
    `;
		return completedMigrations.map((migration) => migration.id);
	} catch (error) {
		console.error('Error getting completed migrations:', error);
		throw error;
	}
}

async function getAllMigrations() {
	try {
		if (!fs.existsSync(migrationDir)) {
			fs.mkdirSync(migrationDir, { recursive: true });
		}

		const files = fs
			.readdirSync(migrationDir)
			.filter((file) => file.endsWith('.js'))
			.sort();

		const migrations = [];

		for (const file of files) {
			const match = file.match(/^migration_(\d{3})_(.+)\.js$/);
			if (match) {
				const id = Number.parseInt(match[1], 10);
				const name = match[2];

				const migrationPath = path.join(migrationDir, file);
				const migration = await import(migrationPath);

				migrations.push({
					id,
					name,
					up: migration.up,
					down: migration.down,
					file,
				});
			}
		}

		migrations.sort((a, b) => a.id - b.id);

		return migrations;
	} catch (error) {
		console.error('Error loading migrations:', error);
		throw error;
	}
}

async function getPendingMigrations() {
	const completedMigrationIds = await getCompletedMigrations();
	const allMigrations = await getAllMigrations();

	return allMigrations.filter(
		(migration) => !completedMigrationIds.includes(migration.id),
	);
}

async function createMigration(name) {
	try {
		const migrations = await getAllMigrations();
		const nextId =
			migrations.length > 0 ? migrations[migrations.length - 1].id + 1 : 1;

		const formattedId = String(nextId).padStart(3, '0');
		const safeName = name.replace(/\s+/g, '_').toLowerCase();
		const fileName = `migration_${formattedId}_${safeName}.js`;

		if (!fs.existsSync(migrationDir)) {
			fs.mkdirSync(migrationDir, { recursive: true });
		}

		let template;

		if (!fs.existsSync(templatePath)) {
			template = `/**
 * Migration: {{name}}
 * ID: {{id}}
 */

export async function up(sql) {
  // Write your up migration here
  await sql\`
    -- Your SQL code here
  \`
}

export async function down(sql) {
  // Write your down migration here
  await sql\`
    -- Your SQL code here
  \`
}
`;
			fs.writeFileSync(templatePath, template);
		} else {
			template = fs.readFileSync(templatePath, 'utf8');
		}

		const migrationContent = template
			.replace(/{{name}}/g, safeName)
			.replace(/{{id}}/g, nextId);

		const migrationPath = path.join(migrationDir, fileName);
		fs.writeFileSync(migrationPath, migrationContent);

		console.log(`Created new migration: ${fileName}`);

		return { id: nextId, name: safeName, path: migrationPath };
	} catch (error) {
		console.error('Error creating migration:', error);
		throw error;
	}
}

async function runMigrations() {
	try {
		const pendingMigrations = await getPendingMigrations();

		if (pendingMigrations.length === 0) {
			console.log('No migrations to run');
			return true;
		}

		console.log(`Running ${pendingMigrations.length} migration(s)...`);

		for (let i = 0; i < pendingMigrations.length; i++) {
			const migration = pendingMigrations[i];
			console.log(
				`Running migration ${migration.id}: ${migration.name} (${i + 1} of ${pendingMigrations.length})...`,
			);

			await migration.up(sql);

			await sql.begin(async (tx) => {
				await tx`
          INSERT INTO migrations (id, name)
          VALUES (${migration.id}, ${migration.name})
          `;
			});

			console.log(`Completed migration ${migration.id}: ${migration.name}`);
		}

		console.log('All migrations completed successfully!');
		return true;
	} catch (error) {
		console.error('Error running migrations:', error);
		return false;
	}
}

async function rollbackMigration() {
	try {
		const completedMigrationIds = await getCompletedMigrations();

		if (completedMigrationIds.length === 0) {
			console.log('No migrations to roll back');
			return true;
		}

		const lastMigrationId =
			completedMigrationIds[completedMigrationIds.length - 1];
		const allMigrations = await getAllMigrations();

		const lastMigration = allMigrations.find((m) => m.id === lastMigrationId);

		if (!lastMigration) {
			console.error(`Could not find migration with ID ${lastMigrationId}`);
			return false;
		}

		console.log(
			`Rolling back migration ${lastMigration.id}: ${lastMigration.name}...`,
		);

		await lastMigration.down(sql);

		await sql.begin(async (tx) => {
			await tx`
        DELETE FROM migrations
        WHERE id = ${lastMigration.id}
      `;
		});

		console.log(
			`Successfully rolled back migration ${lastMigration.id}: ${lastMigration.name}`,
		);
		return true;
	} catch (error) {
		console.error('Error rolling back migration:', error);
		return false;
	}
}

async function checkMigrations() {
	try {
		const allMigrations = await getAllMigrations();

		const idMap = new Map();
		for (const migration of allMigrations) {
			if (idMap.has(migration.id)) {
				console.error(`Duplicate migration ID found: ${migration.id}`);
				console.error(`  - ${idMap.get(migration.id).file}`);
				console.error(`  - ${migration.file}`);
				return false;
			}
			idMap.set(migration.id, migration);
		}

		if (allMigrations.length > 0) {
			for (let i = 0; i < allMigrations.length - 1; i++) {
				if (allMigrations[i + 1].id !== allMigrations[i].id + 1) {
					console.warn(
						`Non-sequential migration IDs found: ${allMigrations[i].id} -> ${allMigrations[i + 1].id}`,
					);
				}
			}
		}

		console.log('Migrations check passed!');
		return true;
	} catch (error) {
		console.error('Error checking migrations:', error);
		return false;
	}
}

async function main() {
	if (!(await testConnection())) {
		console.error('Failed to connect to the database');
		process.exit(1);
	}

	if (!(await initMigrationsTable())) {
		console.error('Failed to initialize migrations table');
		process.exit(1);
	}

	const command = process.argv[2] || 'up';

	let success = false;

	switch (command) {
		case 'create': {
			let migrationName = process.argv[3];

			if (!migrationName) {
				const readLn = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});

				migrationName = await new Promise((resolve) => {
					readLn.question('Enter name of migration (no spaces): ', (answer) => {
						resolve(answer.trim());
					});
				});

				readLn.close();

				if (!migrationName) {
					console.error('Migration name is required');
					process.exit(1);
				}
			}

			try {
				await createMigration(migrationName);
				success = true;
			} catch (error) {
				console.error('Error creating migration:', error);
				success = false;
			}
			break;
		}
		case 'up':
			success = await runMigrations();
			break;

		case 'down':
			success = await rollbackMigration();
			break;

		case 'check':
			success = await checkMigrations();
			break;

		default:
			console.error(`Unknown command: ${command}`);
			console.log('Available commands: create, up, down, check');
			process.exit(1);
	}

	process.exit(success ? 0 : 1);
}

main().catch((error) => {
	console.error('Unhandled error:', error);
	process.exit(1);
});
