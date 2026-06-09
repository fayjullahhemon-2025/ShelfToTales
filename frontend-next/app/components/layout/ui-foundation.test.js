import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../styles/ui-foundation.css';

describe('UI foundation surface primitives', () => {
  test('renders stt-surface and raised variant', () => {
    render(
      <div>
        <div data-testid="surface" className="stt-surface">surface</div>
        <div data-testid="surface-raised" className="stt-surface stt-surface--raised">raised</div>
      </div>
    );

    expect(screen.getByTestId('surface')).toBeInTheDocument();
    expect(screen.getByTestId('surface-raised')).toBeInTheDocument();
  });
});
