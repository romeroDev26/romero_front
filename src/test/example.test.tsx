import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('React Testing Library setup', () => {
  it('renders a simple component', () => {
    render(<div data-testid="hello">Hello Vitest</div>);
    expect(screen.getByTestId('hello')).toBeInTheDocument();
    expect(screen.getByText('Hello Vitest')).toBeInTheDocument();
  });
});
