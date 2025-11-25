# Testing Setup Guide

## Installation

To get started with testing, install the required dependencies:

### Using Jest (Recommended for Next.js)

```bash
pnpm add -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Using Vitest (Alternative)

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

## Configuration Files

### Jest
- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Setup file for global test configuration

### Scripts
Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Test Structure

```
src/
├── components/
│   ├── __tests__/
│   │   └── ComponentName.test.tsx
│   └── ComponentName.tsx
├── hooks/
│   ├── __tests__/
│   │   └── useHookName.test.ts
│   └── useHookName.ts
├── lib/
│   ├── __tests__/
│   │   └── utility.test.ts
│   └── utility.ts
└── services/
    ├── __tests__/
    │   └── service.test.ts
    └── service.ts
```

## Writing Tests

### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Hook Tests
```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should update value', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.updateValue('new value');
    });

    expect(result.current.value).toBe('new value');
  });
});
```

### API/Service Tests
```typescript
import { apiService } from '../apiService';

describe('apiService', () => {
  it('should fetch data', async () => {
    const data = await apiService.getData();
    expect(data).toBeDefined();
  });
});
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Best Practices

1. **Naming**: Use descriptive test names that explain what is being tested
2. **Isolation**: Each test should be independent and not rely on others
3. **Cleanup**: Clean up after tests (e.g., clear mocks, reset state)
4. **Coverage**: Aim for high test coverage but focus on critical paths
5. **Mocking**: Mock external dependencies and API calls
6. **Assertions**: Use clear and specific assertions

## Example Tests

Example test files have been created in:
- `src/hooks/__tests__/` - Hook tests
- `src/lib/__tests__/` - Utility/API tests
- `src/components/__tests__/` - Component tests

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
