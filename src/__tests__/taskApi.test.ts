import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTasks, getTask, createTask, updateTask, deleteTask } from '../api/taskApi';

const mockTask = {
	id: 1,
	title: 'Test',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('taskApi', () => {
	it('getTasks returns array', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([mockTask]),
			})
		);

		const tasks = await getTasks();
		expect(tasks).toEqual([mockTask]);
		expect(fetch).toHaveBeenCalledWith('/api/tasks');
	});

	it('getTask returns a task and throws on HTTP error', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(mockTask),
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
					text: () => Promise.resolve('not found'),
				})
		);

		await expect(getTask(1)).resolves.toEqual(mockTask);
		await expect(getTask(99)).rejects.toThrow('HTTP 404: not found');
		expect(fetch).toHaveBeenNthCalledWith(1, '/api/tasks/1');
		expect(fetch).toHaveBeenNthCalledWith(2, '/api/tasks/99');
	});

	it('createTask returns a task and throws on HTTP error', async () => {
		const payload = {
			title: 'New task',
			description: 'Write tests',
		};

		vi.stubGlobal(
			'fetch',
			vi.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(mockTask),
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 400,
					text: () => Promise.resolve('bad request'),
				})
		);

		await expect(createTask(payload)).resolves.toEqual(mockTask);
		await expect(createTask(payload)).rejects.toThrow('HTTP 400: bad request');
		expect(fetch).toHaveBeenNthCalledWith(1, '/api/tasks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		expect(fetch).toHaveBeenNthCalledWith(2, '/api/tasks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
	});

	it('updateTask returns a task and throws on HTTP error', async () => {
		const payload = {
			title: 'Updated task',
			description: 'Updated description',
			completed: true,
		};

		vi.stubGlobal(
			'fetch',
			vi.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ ...mockTask, ...payload }),
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 500,
					text: () => Promise.resolve('server error'),
				})
		);

		await expect(updateTask(1, payload)).resolves.toEqual({ ...mockTask, ...payload });
		await expect(updateTask(1, payload)).rejects.toThrow('HTTP 500: server error');
		expect(fetch).toHaveBeenNthCalledWith(1, '/api/tasks/1', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		expect(fetch).toHaveBeenNthCalledWith(2, '/api/tasks/1', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
	});

	it('deleteTask completes and throws on HTTP error', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn()
				.mockResolvedValueOnce({
					ok: true,
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 403,
					text: () => Promise.resolve('forbidden'),
				})
		);

		await expect(deleteTask(3)).resolves.toBeUndefined();
		await expect(deleteTask(4)).rejects.toThrow('HTTP 403: forbidden');
		expect(fetch).toHaveBeenNthCalledWith(1, '/api/tasks/3', {
			method: 'DELETE',
		});
		expect(fetch).toHaveBeenNthCalledWith(2, '/api/tasks/4', {
			method: 'DELETE',
		});
	});
});
