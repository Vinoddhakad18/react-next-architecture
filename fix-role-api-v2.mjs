import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'apps', 'web', 'src', 'app', 'admin', 'roles', 'page.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Replace handleSubmit - match more flexibly
const submitRegex = /const handleSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?\}, 300\);\s*\};/;

const newSubmit = `const handleSubmit = async (e: React.FormEvent) => {
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

if (submitRegex.test(content)) {
  content = content.replace(submitRegex, newSubmit);
  console.log('✅ Replaced handleSubmit function');
} else {
  console.log('❌ Could not find handleSubmit function to replace');
}

// Replace handleDeleteRole
const deleteRegex = /const handleDeleteRole = \(\) => \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?\}, 300\);\s*\};/;

const newDelete = `const handleDeleteRole = async () => {
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

if (deleteRegex.test(content)) {
  content = content.replace(deleteRegex, newDelete);
  console.log('✅ Replaced handleDeleteRole function');
} else {
  console.log('❌ Could not find handleDeleteRole function to replace');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Successfully updated role management page to use real API calls!');




