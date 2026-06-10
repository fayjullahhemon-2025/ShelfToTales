import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import DashboardPage from './page';
import { socialService, dashboardService } from '../lib/api';

vi.mock('../lib/api', () => ({
    dashboardService: {
        getDashboard: vi.fn(),
    },
    socialService: {
        getFeed: vi.fn(),
        getFollowing: vi.fn(),
    },
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock LofiContext
vi.mock('../contexts/LofiContext', () => ({
    useLofi: () => ({
        isPlaying: false,
        currentTime: 0,
        duration: 180,
        volume: 0.5,
        currentTrack: { title: "Autumn Rainfall", artist: "Lofi Girl & Study Beats", coverUrl: "" },
        ambientStates: {
            rain: { active: false, volume: 0.5 },
            cafe: { active: false, volume: 0.5 },
            fire: { active: false, volume: 0.5 },
            nature: { active: false, volume: 0.5 },
        },
        ambientSounds: [
            { id: 'rain', name: 'Rain', icon: 'fa-cloud-showers-heavy' },
            { id: 'cafe', name: 'Cafe', icon: 'fa-mug-hot' },
            { id: 'fire', name: 'Fire', icon: 'fa-fire' },
            { id: 'nature', name: 'Nature', icon: 'fa-leaf' }
        ],
        nextTrack: vi.fn(),
        prevTrack: vi.fn(),
        togglePlay: vi.fn(),
        setVolume: vi.fn(),
        seek: vi.fn(),
        toggleAmbient: vi.fn(),
        setAmbientVolume: vi.fn()
    }),
}));

describe('Dashboard Feed Spoiler Rendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        dashboardService.getDashboard.mockResolvedValue({ data: { currentStreak: 5, yearGoal: 10, completedBooksCount: 2 } });
        socialService.getFollowing.mockResolvedValue({ data: { content: [] } });
    });

    test('blurs spoiler review comment and reveals it when clicked', async () => {
        const mockFeed = [
            {
                id: 101,
                activityType: 'POSTED_REVIEW',
                createdAt: '2026-06-10T08:00:00Z',
                user: { fullName: 'Alice Smith', email: 'alice@example.com' },
                metadata: JSON.stringify({
                    bookTitle: 'The Hobbit',
                    reviewComment: 'Amazing ending, Frodo dies!',
                    rating: 5,
                    isSpoiler: true
                })
            }
        ];
        socialService.getFeed.mockResolvedValue({ data: mockFeed });

        render(<DashboardPage />);

        // Wait for feed to load and display Alice's activity
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        // Check if "Spoiler Warning" is displayed
        const spoilerWarning = screen.getByText(/Spoiler Warning/i);
        expect(spoilerWarning).toBeInTheDocument();

        // Check if the review comment wrapper is blurred
        const commentText = screen.getByText('Amazing ending, Frodo dies!');
        expect(commentText.parentElement.style.filter).toBe('blur(5px)');

        // Click overlay warning to reveal spoiler
        fireEvent.click(spoilerWarning);

        // Verify the blur is gone
        await waitFor(() => {
            expect(commentText.parentElement.style.filter).toBe('none');
        });
    });
});
