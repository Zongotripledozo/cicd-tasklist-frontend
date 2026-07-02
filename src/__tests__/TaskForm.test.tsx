import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
	it('shows a validation error when the title is empty', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();

		render(<TaskForm onSubmit={onSubmit} />);

		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('submits trimmed values and clears the form in create mode', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();

		render(<TaskForm onSubmit={onSubmit} />);

		await user.type(screen.getByLabelText('Titre'), '  Préparer le compte rendu  ');
		await user.type(screen.getByLabelText('Description'), '  Valider les points clés  ');
		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(onSubmit).toHaveBeenCalledWith({
			title: 'Préparer le compte rendu',
			description: 'Valider les points clés',
		});
		expect(screen.getByLabelText('Titre')).toHaveValue('');
		expect(screen.getByLabelText('Description')).toHaveValue('');
	});

	it('supports edit mode and cancel action', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		const onCancel = vi.fn();

		render(
			<TaskForm
				onSubmit={onSubmit}
				initialValues={{ title: 'Relire le document', description: 'Corriger les fautes' }}
				onCancel={onCancel}
				mode="edit"
			/>
		);

		expect(screen.getByRole('heading', { name: 'Modifier la tâche' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Annuler' }));

		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onSubmit).not.toHaveBeenCalled();
	});
});