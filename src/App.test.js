import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders the clinic homepage and its appointment action', () => {
  render(<App />);

  expect(
    screen.getByRole('heading', { name: /expert care, made easier/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /book an appointment/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: /a care team that sees you/i })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: /book appointment online/i })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute(
    'href',
    '#services'
  );

  expect(
    screen.getByRole('button', { name: 'Open live chat from navigation' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Open live chat' })
  ).toBeInTheDocument();
});

test('opens AI chat, sends a message, and displays the assistant reply', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ reply: "You can book online." }),
  });

  try {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open live chat' }));

    expect(screen.getByRole('dialog', { name: /health plus ai live chat/i })).toBeInTheDocument();
    expect(screen.getByText(/not diagnosis or medical advice/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/message the health\+ assistant/i), {
      target: { value: 'How do I book?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({ method: 'POST' })
      );
    });
    expect(await screen.findByText('You can book online.')).toBeInTheDocument();
  } finally {
    global.fetch = originalFetch;
  }
});

test('shows setup guidance when the chat API returns an HTML page', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => 'text/html' },
    json: async () => {
      throw new SyntaxError("Unexpected token '<'");
    },
  });

  try {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open live chat' }));
    fireEvent.change(screen.getByLabelText(/message the health\+ assistant/i), {
      target: { value: 'How do I book?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent(/returned a web page instead of an API response/i);
    expect(screen.queryByText(/unexpected token/i)).not.toBeInTheDocument();
  } finally {
    global.fetch = originalFetch;
  }
});

test('shows clear setup steps when the provider key is missing', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    headers: { get: () => 'application/json' },
    json: async () => ({
      error:
        "AI chat isn't configured. Copy .env.example to .env, set AI_API_KEY to a valid provider key, then restart npm start.",
    }),
  });

  try {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open live chat' }));
    fireEvent.change(screen.getByLabelText(/message the health\+ assistant/i), {
      target: { value: 'How do I book?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /copy .env\.example to .env, set AI_API_KEY/i
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('opens the mobile navigation and exposes appointment booking', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));

  expect(
    screen.getByRole('link', { name: /book an appointment/i })
  ).toHaveAttribute('href', '/appointment');

  fireEvent.keyDown(window, { key: 'Escape' });

  const menuButton = screen.getByRole('button', {
    name: /open navigation menu/i,
  });
  expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  expect(menuButton).toHaveFocus();
  expect(
    screen.queryByRole('link', { name: /book an appointment/i })
  ).not.toBeInTheDocument();
});
