import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'apps', 'web', 'src', 'app', 'admin', 'roles', 'page.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Replace handleSubmit function
const oldSubmit = `  const handleSubmit = (e: React.FormEvent) => {
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

const newSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditMode && editingRoleId !== null) {
        // Update existing role
        const result = await roleService.updateRole(editingRoleId, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          status: formData.is_active,
        });

        if (!result.success || result.error) {
          setSubmitError(result.error?.message || 'Failed to update role');
          setIsSubmitting(false);
          return;
        }

        // Refresh the roles list
        await fetchRoles();
        handleCloseModal();
      } else {
        // Create new role
        const result = await roleService.createRole({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          status: formData.is_active,
        });

        if (!result.success || result.error) {
          setSubmitError(result.error?.message || 'Failed to create role');
          setIsSubmitting(false);
          return;
        }

        // Refresh the roles list
        await fetchRoles();
        handleCloseModal();
      }
      setIsSubmitting(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };`;

content = content.replace(oldSubmit, newSubmit);

// Replace handleDeleteRole function
const oldDelete = `  const handleDeleteRole = () => {
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

const newDelete = `  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    setDeletingRoleId(roleToDelete.id);
    setError(null);

    try {
      const result = await roleService.deleteRole(roleToDelete.id);

      if (!result.success || result.error) {
        setError(result.error?.message || 'Failed to delete role');
        setDeletingRoleId(null);
        return;
      }

      // Refresh the roles list
      await fetchRoles();
      handleCloseDeleteModal();
      setDeletingRoleId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setDeletingRoleId(null);
    }
  };`;

content = content.replace(oldDelete, newDelete);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Successfully updated role management page to use real API calls!');

