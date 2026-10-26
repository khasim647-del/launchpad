import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AddBookmarkForm from './AddBookmarkForm.jsx'

function setup() {
  const onAdd = vi.fn()
  const onCancel = vi.fn()
  render(<AddBookmarkForm onAdd={onAdd} onCancel={onCancel} />)
  return { onAdd, onCancel, user: userEvent.setup() }
}

describe('AddBookmarkForm', () => {
  it('adds a bookmark with a cleaned-up address', async () => {
    const { onAdd, user } = setup()

    await user.type(screen.getByLabelText('Website name'), '  Netflix ')
    await user.type(screen.getByLabelText('Website URL'), 'netflix.com')
    await user.click(screen.getByRole('button', { name: 'Save bookmark' }))

    expect(onAdd).toHaveBeenCalledWith('Netflix', 'https://netflix.com/')
  })

  it('asks for a name when it is empty', async () => {
    const { onAdd, user } = setup()

    await user.type(screen.getByLabelText('Website URL'), 'netflix.com')
    await user.click(screen.getByRole('button', { name: 'Save bookmark' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a website name.')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('rejects an invalid address', async () => {
    const { onAdd, user } = setup()

    await user.type(screen.getByLabelText('Website name'), 'Test')
    await user.type(screen.getByLabelText('Website URL'), 'not-a-site')
    await user.click(screen.getByRole('button', { name: 'Save bookmark' }))

    expect(screen.getByRole('alert')).toHaveTextContent('valid website address')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const { onCancel, user } = setup()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalled()
  })
})
