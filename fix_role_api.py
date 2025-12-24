#!/usr/bin/env python3
import re

file_path = 'apps/web/src/app/admin/roles/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace handleSubmit function
old_submit_pattern = r'const handleSubmit = \(e: React\.FormEvent\) => \{.*?setTimeout\(\(\) => \{.*?\}, 300\);\s*\};'
new_submit = '''const handleSubmit = async (e: React.FormEvent) => {
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
  };'''

# Use DOTALL flag to match across newlines
content = re.sub(old_submit_pattern, new_submit, content, flags=re.DOTALL)

# Replace handleDeleteRole function
old_delete_pattern = r'const handleDeleteRole = \(\) => \{.*?setTimeout\(\(\) => \{.*?\}, 300\);\s*\};'
new_delete = '''const handleDeleteRole = async () => {
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
  };'''

content = re.sub(old_delete_pattern, new_delete, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Successfully updated role management page to use real API calls!')




