import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as taskApi from '../api/taskApi';
import { useTasks } from '../hooks/useTasks';

vi.mock('../api/taskApi', () => ({
	getTasks: vi.fn(),
	createTask: vi.fn(),
	updateTask: vi.fn(),
	deleteTask: vi.fn(),
}));

const mockedTaskApi = vi.mocked(taskApi);

const initialTask = {
	id: 1,
	title: 'Tâche initiale',
	description: 'Description initiale',
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

const createdTask = {
	id: 2,
	title: 'Nouvelle tâche',
	description: 'Nouvelle description',
	completed: false,
	createdAt: '2026-01-16T10:00:00Z',
	updatedAt: '2026-01-16T10:00:00Z',
};

beforeEach(() => {
	vi.clearAllMocks();
	mockedTaskApi.getTasks.mockResolvedValue([initialTask]);
	mockedTaskApi.createTask.mockResolvedValue(createdTask);
	mockedTaskApi.updateTask.mockImplementation(async (id, payload) => ({
		...initialTask,
		id,
		title: payload.title ?? initialTask.title,
		description: payload.description === undefined ? initialTask.description : payload.description ?? null,
		completed: payload.completed ?? initialTask.completed,
		createdAt: initialTask.createdAt,
		updatedAt: '2026-01-17T10:00:00Z',
	}));
	mockedTaskApi.deleteTask.mockResolvedValue();
});

describe('useTasks', () => {
	it('loads tasks on mount and exposes a settled state', async () => {
		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.tasks).toEqual([initialTask]);
		expect(result.current.error).toBeNull();
		expect(mockedTaskApi.getTasks).toHaveBeenCalledTimes(1);
	});

	it('adds, updates, toggles and removes tasks through the API layer', async () => {
		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addTask({
				title: 'Nouvelle tâche',
				description: 'Nouvelle description',
			});
		});

		expect(result.current.tasks[0]).toEqual(createdTask);
		expect(mockedTaskApi.createTask).toHaveBeenCalledWith({
			title: 'Nouvelle tâche',
			description: 'Nouvelle description',
		});

		await act(async () => {
			await result.current.editTask(1, {
				title: 'Tâche mise à jour',
				description: 'Description mise à jour',
			});
		});

		expect(mockedTaskApi.updateTask).toHaveBeenCalledWith(1, {
			title: 'Tâche mise à jour',
			description: 'Description mise à jour',
		});
		expect(result.current.tasks.find((task) => task.id === 1)?.title).toBe('Tâche mise à jour');

		await act(async () => {
			await result.current.toggleComplete(1);
		});

		expect(mockedTaskApi.updateTask).toHaveBeenCalledWith(1, { completed: true });

		await act(async () => {
			await result.current.removeTask(2);
		});

		expect(mockedTaskApi.deleteTask).toHaveBeenCalledWith(2);
		expect(result.current.tasks.some((task) => task.id === 2)).toBe(false);
	});
});