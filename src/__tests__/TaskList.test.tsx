import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskList } from '../components/TaskList';
import type { Task } from '../types/task';

const mockTasks: Task[] = [
	{
		id: 1,
		title: 'Première tâche',
		description: 'Description 1',
		completed: false,
		createdAt: '2026-01-15T10:00:00Z',
		updatedAt: '2026-01-15T10:00:00Z',
	},
	{
		id: 2,
		title: 'Deuxième tâche',
		description: null,
		completed: true,
		createdAt: '2026-01-16T10:00:00Z',
		updatedAt: '2026-01-16T10:00:00Z',
	},
];

describe('TaskList', () => {
	it('shows loading state', () => {
		render(
			<TaskList
				tasks={[]}
				loading={true}
				error={null}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.getByTestId('loading')).toBeInTheDocument();
		expect(screen.getByText('Chargement des tâches...')).toBeInTheDocument();
	});

	it('renders list of tasks', () => {
		render(
			<TaskList
				tasks={mockTasks}
				loading={false}
				error={null}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.getByTestId('task-list')).toBeInTheDocument();
		expect(screen.getByText('Première tâche')).toBeInTheDocument();
		expect(screen.getByText('Deuxième tâche')).toBeInTheDocument();
		expect(screen.getByText('2 tâches')).toBeInTheDocument();
	});

	it('shows error and empty states', () => {
		const { rerender } = render(
			<TaskList
				tasks={[]}
				loading={false}
				error={'Une erreur est survenue'}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);

		expect(screen.getByTestId('error')).toBeInTheDocument();
		expect(screen.getByText('Erreur : Une erreur est survenue')).toBeInTheDocument();

		rerender(
			<TaskList
				tasks={[]}
				loading={false}
				error={null}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);

		expect(screen.getByTestId('empty')).toBeInTheDocument();
		expect(screen.getByText('Aucune tâche')).toBeInTheDocument();
		expect(screen.getByText('Commencez par ajouter votre première tâche !')).toBeInTheDocument();
	});

	it('calls toggle, delete, and edit callbacks from task controls', async () => {
		const user = userEvent.setup();
		const onToggle = vi.fn();
		const onDelete = vi.fn();
		const onEdit = vi.fn();

		render(
			<TaskList
				tasks={[mockTasks[0]]}
				loading={false}
				error={null}
				onToggle={onToggle}
				onDelete={onDelete}
				onEdit={onEdit}
			/>
		);

		await user.click(screen.getByLabelText('Marquer "Première tâche" comme terminée'));
		expect(onToggle).toHaveBeenCalledWith(1);

		await user.click(screen.getByLabelText('Supprimer'));
		await user.click(screen.getByLabelText('Supprimer'));
		expect(onDelete).toHaveBeenCalledWith(1);

		await user.click(screen.getByLabelText('Modifier'));
		await user.clear(screen.getByLabelText('Modifier le titre'));
		await user.type(screen.getByLabelText('Modifier le titre'), 'Tâche modifiée');
		await user.clear(screen.getByLabelText('Modifier la description'));
		await user.type(screen.getByLabelText('Modifier la description'), 'Nouvelle description');
		await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onEdit).toHaveBeenCalledWith(1, {
			title: 'Tâche modifiée',
			description: 'Nouvelle description',
		});
	});
});
