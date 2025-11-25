/**
 * Example Component Test
 * Template for testing React components
 */

import { render, screen } from '@testing-library/react';

// Example component for demonstration
function ExampleComponent({ title }: { title: string }) {
  return <h1>{title}</h1>;
}

describe('ExampleComponent', () => {
  it('should render the title', () => {
    render(<ExampleComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(<ExampleComponent title="Snapshot Test" />);
    expect(container).toMatchSnapshot();
  });
});
