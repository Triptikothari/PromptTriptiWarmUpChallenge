import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock the fetch API
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ 
        language: 'English', 
        learning_pace: 'Moderate Pace', 
        depth_preference: 'Surface-Level', 
        history: [] 
    }),
  })
);

describe('App Component', () => {
    it('renders the sidebar title "NeuLearn AI"', () => {
        render(<App />);
        const titleElement = screen.getByText(/NeuLearn AI/i);
        expect(titleElement).toBeInTheDocument();
    });

    it('renders the main content header', () => {
        render(<App />);
        const headerElement = screen.getByText(/Learn New Concepts/i);
        expect(headerElement).toBeInTheDocument();
    });

    it('displays the behavioral insights card', () => {
        render(<App />);
        expect(screen.getByText(/Behavioral Insights/i)).toBeInTheDocument();
        expect(screen.getByText(/Moderate Pace/i)).toBeInTheDocument();
    });

    it('renders the input field for chat', () => {
        render(<App />);
        const inputElement = screen.getByPlaceholderText(/Ask me anything/i);
        expect(inputElement).toBeInTheDocument();
    });
});
