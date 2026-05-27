import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlaceDeclarationStep from './PlaceDeclarationStep';
import { isValidAlpha3, type ContinentCode } from '@/lib/dna-place';

/**
 * End-to-end-style test for the Step 7 (Place) flow. We mount the real
 * PlaceDeclarationStep component, drive both selects via user events, and
 * assert the value that would be persisted to profiles.country is the same
 * alpha-3 code accepted by isValidAlpha3 (and therefore by the DB CHECK
 * constraint profiles_country_alpha3_check).
 */
function Harness({ onSubmit }: { onSubmit: (country: string) => void }) {
  const [continent, setContinent] = useState<ContinentCode | ''>('');
  const [country, setCountry] = useState('');
  const canSubmit = !!continent && isValidAlpha3(country);
  return (
    <div>
      <PlaceDeclarationStep
        continent={continent}
        country={country}
        onContinentChange={setContinent}
        onCountryChange={setCountry}
      />
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit(country)}
      >
        Submit
      </button>
    </div>
  );
}

describe('PlaceDeclarationStep (Step 7 wizard flow)', () => {
  it('populates countries after selecting a continent, then submits a valid alpha-3', () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    const continentSelect = screen.getByLabelText(/continent/i) as HTMLSelectElement;
    const countrySelect = screen.getByLabelText(/country/i) as HTMLSelectElement;
    const submit = screen.getByRole('button', { name: /submit/i });

    // 1. Submit is gated until a country is chosen.
    expect(submit).toBeDisabled();

    // 2. Country dropdown is empty / disabled until a continent is selected.
    expect(countrySelect).toBeDisabled();

    // 3. Select North America - dropdown must populate (the original bug).
    fireEvent.change(continentSelect, { target: { value: 'NA' } });
    expect(countrySelect).not.toBeDisabled();
    const naOptions = Array.from(countrySelect.options)
      .map((o) => o.value)
      .filter((v) => v.length > 0);
    expect(naOptions.length).toBeGreaterThan(0);
    expect(naOptions).toContain('USA');

    // 4. Pick a country - submit becomes enabled.
    fireEvent.change(countrySelect, { target: { value: 'USA' } });
    expect(submit).not.toBeDisabled();

    // 5. Submit - the value that would be written to profiles.country is
    //    a strict 3-letter ISO alpha-3 code.
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const saved = onSubmit.mock.calls[0][0] as string;
    expect(saved).toBe('USA');
    expect(saved).toMatch(/^[A-Z]{3}$/);
    expect(isValidAlpha3(saved)).toBe(true);
  });

  it('resets the country when continent changes (prevents stale alpha-3)', () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    const continentSelect = screen.getByLabelText(/continent/i) as HTMLSelectElement;
    const countrySelect = screen.getByLabelText(/country/i) as HTMLSelectElement;
    const submit = screen.getByRole('button', { name: /submit/i });

    fireEvent.change(continentSelect, { target: { value: 'AF' } });
    fireEvent.change(countrySelect, { target: { value: 'GHA' } });
    expect(submit).not.toBeDisabled();

    fireEvent.change(continentSelect, { target: { value: 'EU' } });
    expect(countrySelect.value).toBe('');
    expect(submit).toBeDisabled();
  });
});
