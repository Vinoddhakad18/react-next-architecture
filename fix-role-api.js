const fs = require('fs');
const path = 'apps/web/src/app/admin/roles/page.tsx';

let content = fs.readFileSync(path, 'utf8');

// Replace handleDeleteRole
const deleteRoleOld = `  const handleDeleteRole = () => {
    if (!roleToDelete) return;

    setDeletingRoleId(roleToDelete.id);
    setError(null);

    // Simulate async operation
    setTimeout(() => {
      setRoles((prev) => prev.filter((role) => role.id !== roleToDelete.id));
      handleCloseDeleteModal();
      setDeletingRoleId(null);
    }, 300);
  };`;

const deleteRoleNew = `  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    setDeletingRoleId(roleToDelete.id);
    setError(null);

    try {
      const response = await roleService.deleteRole(roleToDelete.id);
      if (response.success) {
        // Refresh the roles list
        await fetchRoles();
        handleCloseDeleteModal();
      } else {
        setError(response.error?.message || 'Failed to delete role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setDeletingRoleId(null);
    }
  };`;

content = content.replace(deleteRoleOld, deleteRoleNew);

// Replace handleSubmit
const submitOld = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Simulate async operation
    setTimeout(() => {
      if (isEditMode && editingRoleId !== null) {
        // Update existing role
        setRoles((prev) =>
          prev.map((role) =>
            role.id === editingRoleId
              ? {
                  ...role,
                  name: formData.name.trim(),
                  description: formData.description.trim(),
                  isActive: formData.is_active,
                  updatedAt: new Date().toISOString(),
                }
              : role
          )
        );
        handleCloseModal();
      } else {
        // Create new role
        const newRole: Role = {
          id: Math.max(...roles.map((r) => r.id), 0) + 1,
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: formData.is_active,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setRoles((prev) => [...prev, newRole]);
        handleCloseModal();
      }
      setIsSubmitting(false);
    }, 300);
  };`;

const submitNew = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditMode && editingRoleId !== null) {
        // Update existing role
        const response = await roleService.updateRole(editingRoleId, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.is_active,
        });
        
        if (response.success) {
          // Refresh the roles list
          await fetchRoles();
          handleCloseModal();
        } else {
          setSubmitError(response.error?.message || 'Failed to update role');
        }
      } else {
        // Create new role
        const response = await roleService.createRole({
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.is_active,
        });
        
        if (response.success) {
          // Refresh the roles list
          await fetchRoles();
          handleCloseModal();
        } else {
          setSubmitError(response.error?.message || 'Failed to create role');
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };`;

content = content.replace(submitOld, submitNew);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated role management API calls');

