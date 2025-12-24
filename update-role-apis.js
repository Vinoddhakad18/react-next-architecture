const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps', 'web', 'src', 'app', 'admin', 'roles', 'page.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Fix handleDeleteRole
content = content.replace(
  /const handleDeleteRole = \(\) => \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?setRoles\(\(prev\) => prev\.filter\(\(role\) => role\.id !== roleToDelete\.id\)\);[\s\S]*?handleCloseDeleteModal\(\);[\s\S]*?setDeletingRoleId\(null\);[\s\S]*?\}, 300\);[\s\S]*?\};/,
  `const handleDeleteRole = async () => {
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
  };`
);

// Fix handleSubmit - replace the setTimeout block
const submitPattern = /setTimeout\(\(\) => \{[\s\S]*?if \(isEditMode && editingRoleId !== null\) \{[\s\S]*?\/\/ Update existing role[\s\S]*?setRoles\(\(prev\) =>[\s\S]*?prev\.map\(\(role\) =>[\s\S]*?role\.id === editingRoleId[\s\S]*?\? \{[\s\S]*?\.[\s\S]*?name: formData\.name\.trim\(\),[\s\S]*?description: formData\.description\.trim\(\),[\s\S]*?isActive: formData\.is_active,[\s\S]*?updatedAt: new Date\(\)\.toISOString\(\),[\s\S]*?\}[\s\S]*?: role[\s\S]*?\)[\s\S]*?\);[\s\S]*?handleCloseModal\(\);[\s\S]*?\} else \{[\s\S]*?\/\/ Create new role[\s\S]*?const newRole: Role = \{[\s\S]*?id: Math\.max\(\.\.\.roles\.map\(\(r\) => r\.id\), 0\) \+ 1,[\s\S]*?name: formData\.name\.trim\(\),[\s\S]*?description: formData\.description\.trim\(\),[\s\S]*?isActive: formData\.is_active,[\s\S]*?createdAt: new Date\(\)\.toISOString\(\),[\s\S]*?updatedAt: new Date\(\)\.toISOString\(\),[\s\S]*?\};[\s\S]*?setRoles\(\(prev\) => \[\.\.\.prev, newRole\]\);[\s\S]*?handleCloseModal\(\);[\s\S]*?\}[\s\S]*?setIsSubmitting\(false\);[\s\S]*?\}, 300\);/;

content = content.replace(submitPattern, `try {
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
    }`);

// Also update function signature
content = content.replace(
  /const handleSubmit = \(e: React\.FormEvent\) => \{/,
  'const handleSubmit = async (e: React.FormEvent) => {'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated role management API calls');




