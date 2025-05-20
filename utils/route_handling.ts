export const matchPath = (pattern, path) => {
	const patternSegments = pattern.split('/');
	const pathSegments = path.split('/');

	if (patternSegments.length !== pathSegments.length) {
		return null;
	}

	const params = {};
	for (let i = 0; i < patternSegments.length; i++) {
		const patternSegment = patternSegments[i];
		const pathSegment = pathSegments[i];

		if (patternSegment.startsWith(':')) {
			const paramName = patternSegment.slice(1);
			params[paramName] = pathSegment;
		} else if (patternSegment !== pathSegment) {
			return null;
		}
	}

	return params;
};

export const parseJsonBody = async (req) => {
	try {
		return await req.json();
	} catch (error) {
		return null;
	}
};

export const jsonResponse = (data, status = 200) => {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const errorResponse = (message, status = 400) => {
	return jsonResponse({ error: message }, status);
};

export const saveRequestFiles = async (req) => {
	try {
		// TODO: Implement file upload handling for Bun
		// This is a placeholder for the multipart form data parsing
		// Bun doesn't have built-in multipart form handling like fastify to my knowledge

		const formData = await req.formData();
		const files = [];

		for (const [fieldname, value] of formData.entries()) {
			if (value instanceof File) {
				const filepath = `/tmp/${value.name}`;
				files.push({
					fieldname,
					filepath,
					filename: value.name,
					encoding: 'utf-8',
					mimetype: value.type,
					size: value.size,
				});
			}
		}

		return files;
	} catch (error) {
		console.error('Error saving request files:', error);
		throw error;
	}
};

export const formatToE123 = (phoneNumber) => {
	const digitsOnly = phoneNumber.replace(/\D/g, '');

	if (digitsOnly.length === 10) {
		return `+1${digitsOnly}`;
	} else if (digitsOnly.length > 10 && !phoneNumber.startsWith('+')) {
		return `+${digitsOnly}`;
	}

	return phoneNumber.startsWith('+') ? phoneNumber : `+${digitsOnly}`;
};
