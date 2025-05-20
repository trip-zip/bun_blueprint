import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card } from './components/ui/card';

export function APITester() {
	const [name, setName] = useState('');
	const [greeting, setGreeting] = useState('');
	const [healthStatus, setHealthStatus] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const fetchHealth = async () => {
		try {
			const response = await fetch('/api/healthcheck');
			const data = await response.json();
			setHealthStatus(data.status || 'unknown');
		} catch (error) {
			console.error('Error fetching health status:', error);
			setHealthStatus('error');
		}
	};

	useEffect(() => {
		fetchHealth();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await fetch(`/api/hello/${name}`);
			const data = await response.json();
			setGreeting(data.message);
		} catch (error) {
			console.error('Error fetching greeting:', error);
			setGreeting('Error fetching greeting');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="p-6 max-w-md mx-auto mt-8">
			<h2 className="text-xl font-bold mb-4">API Tester</h2>

			<div className="mb-4">
				<p>
					API Health:{' '}
					<span
						className={
							healthStatus === 'healthy' ? 'text-green-500' : 'text-red-500'
						}
					>
						{healthStatus}
					</span>
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<Input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Enter your name"
						className="w-full"
					/>
				</div>

				<Button type="submit" disabled={isLoading}>
					{isLoading ? 'Loading...' : 'Get Greeting'}
				</Button>
			</form>

			{greeting && (
				<div className="mt-4 p-3 bg-gray-100 rounded">
					<p>{greeting}</p>
				</div>
			)}
		</Card>
	);
}

export default APITester;
