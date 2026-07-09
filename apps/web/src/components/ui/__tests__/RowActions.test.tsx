import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RowActions } from '../RowActions';

const basePermissions = {
  edit: true,
  delete: true,
  approval: true,
  status: true,
};

describe('RowActions', () => {
  it('shows approve/reject only for pending rows when approval is granted', () => {
    render(
      <RowActions
        permissions={basePermissions}
        approvalStatus="pending"
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Approve' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeTruthy();
  });

  it('hides approve/reject when approval permission is denied', () => {
    render(
      <RowActions
        permissions={{ ...basePermissions, approval: false }}
        approvalStatus="pending"
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reject' })).toBeNull();
  });

  it('hides approve/reject when row is already approved', () => {
    render(
      <RowActions
        permissions={basePermissions}
        approvalStatus="approved"
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
  });

  it('shows approve/reject for draft rows when approval is granted', () => {
    render(
      <RowActions
        permissions={basePermissions}
        approvalStatus="draft"
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Approve' })).toBeTruthy();
  });

  it('hides edit and delete when approvalOnly is set', () => {
    render(
      <RowActions
        permissions={basePermissions}
        approvalStatus="pending"
        approvalOnly
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        onToggleStatus={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Approve' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Deactivate' })).toBeNull();
  });

  it('shows status toggle when status permission is granted', () => {
    render(
      <RowActions
        permissions={basePermissions}
        isActive={true}
        onToggleStatus={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeTruthy();
  });

  it('invokes approve handler on click', async () => {
    const user = userEvent.setup();
    const onApprove = jest.fn();

    render(
      <RowActions
        permissions={basePermissions}
        approvalStatus="pending"
        onApprove={onApprove}
        onReject={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });
});
