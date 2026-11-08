import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { TagInput } from './tag-input';

function Harness({ initial = [] as string[] }) {
  const [tags, setTags] = useState(initial);
  return (
    <>
      <label htmlFor="tags">Tags</label>
      <TagInput
        id="tags"
        value={tags}
        onChange={setTags}
        suggestions={['design']}
      />
      <output data-testid="value">{JSON.stringify(tags)}</output>
    </>
  );
}

const value = () =>
  JSON.parse(screen.getByTestId('value').textContent ?? '[]') as string[];

describe('TagInput', () => {
  it('adds tags on Enter and comma, tidying spaces', async () => {
    render(<Harness />);
    const input = screen.getByLabelText('Tags');

    await userEvent.type(input, '  web   design {Enter}mobile,');

    expect(value()).toEqual(['web design', 'mobile']);
    expect(input).toHaveValue('');
  });

  it('refuses duplicates (any capitalisation) and odd characters, with a message', async () => {
    render(<Harness initial={['Design']} />);
    const input = screen.getByLabelText('Tags');

    await userEvent.type(input, 'design{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent(
      '"design" is already added',
    );

    await userEvent.clear(input);
    await userEvent.type(input, 'a/b{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('Tags can use letters');
    expect(value()).toEqual(['Design']);
  });

  it('removes the last tag with Backspace in an empty box, or a tag by its button', async () => {
    render(<Harness initial={['one', 'two', 'three']} />);

    await userEvent.type(screen.getByLabelText('Tags'), '{Backspace}');
    expect(value()).toEqual(['one', 'two']);

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove tag one' }),
    );
    expect(value()).toEqual(['two']);
  });

  it('adds what was typed when leaving the field', async () => {
    render(<Harness />);

    await userEvent.type(screen.getByLabelText('Tags'), 'health');
    await userEvent.tab();

    expect(value()).toEqual(['health']);
  });
});
