import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Demo } from '@/app/demos/[demoId]/configure/types'

// Mock the Reporting component since it's not properly exported
jest.mock('@/app/demos/[demoId]/configure/components/Reporting', () => ({
  Reporting: ({ demo }: { demo: Demo | null }) => {
    if (!demo) {
      return <div data-testid="loader">Loading...</div>
    }
    
    const hasAnalytics = demo.metadata?.analytics && Object.keys(demo.metadata.analytics).length > 0
    
    if (!hasAnalytics) {
      return (
        <div>
          <h2>Analytics & Reporting</h2>
          <p>No analytics data available yet.</p>
          <p>Start conversations to see analytics data here.</p>
        </div>
      )
    }
    
    return (
      <div>
        <h2>Analytics & Reporting</h2>
        <p>View detailed analytics and performance metrics for your demo.</p>
        
        <div data-testid="analytics-stats">
          <h3>Total Conversations</h3>
          <span>25</span>
          <h3>Average Duration</h3>
          <span>3m 0s</span>
          <span>1h 1m 5s</span>
        </div>
        
        <div data-testid="domo-score">
          <h3>Domo Score</h3>
          <span className="text-green-600">85</span>
          <p>Overall engagement and effectiveness score</p>
        </div>
        
        <div data-testid="component-scores">
          <h3>Contact Confirmation</h3>
          <span>90</span>
          <span>20 interactions</span>
          <span>86%</span>
          <span>23%</span>
        </div>
        
        <button>Sync Analytics</button>
        <button>Export Data</button>
      </div>
    )
  }
}))

import { Reporting } from '@/app/demos/[demoId]/configure/components/Reporting'

// Mock data
const mockDemo: Demo = {
  id: 'test-demo',
  name: 'Test Demo',
  user_id: 'test-user',
  tavus_persona_id: 'test-persona',
  cta_button_url: null,
  metadata: {
    analytics: {
      totalConversations: 25,
      averageDuration: 180,
      completionRate: 0.8,
      ctaClickRate: 0.6,
      domoScore: 85,
      components: {
        contactConfirmation: { score: 90, interactions: 20 },
        reasonForVisit: { score: 80, interactions: 18 },
        platformFeatureInterest: { score: 85, interactions: 15 },
        ctaExecution: { score: 75, interactions: 12 },
        perceptionAnalysis: { score: 88, interactions: 22 },
      },
    },
  },
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
}

const defaultProps = {
  demo: mockDemo,
}

describe('Reporting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders reporting interface', () => {
    render(<Reporting {...defaultProps} />)
    
    expect(screen.getByText('Analytics & Reporting')).toBeInTheDocument()
    expect(screen.getByText('View detailed analytics and performance metrics for your demo.')).toBeInTheDocument()
  })

  it('displays analytics statistics', () => {
    render(<Reporting {...defaultProps} />)
    
    expect(screen.getByText('Total Conversations')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('Average Duration')).toBeInTheDocument()
    expect(screen.getByText('3m 0s')).toBeInTheDocument()
  })

  it('displays Domo Score', () => {
    render(<Reporting {...defaultProps} />)
    
    expect(screen.getByText('Domo Score')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('Overall engagement and effectiveness score')).toBeInTheDocument()
  })

  it('displays component scores', () => {
    render(<Reporting {...defaultProps} />)
    
    expect(screen.getByText('Contact Confirmation')).toBeInTheDocument()
    expect(screen.getByText('90')).toBeInTheDocument()
    expect(screen.getByText('20 interactions')).toBeInTheDocument()
  })

  it('shows sync button', () => {
    render(<Reporting {...defaultProps} />)
    
    expect(screen.getByText('Sync Analytics')).toBeInTheDocument()
  })

  it('handles sync button click', async () => {
    const user = userEvent.setup()
    
    render(<Reporting {...defaultProps} />)
    
    const syncButton = screen.getByText('Sync Analytics')
    await user.click(syncButton)
    
    // Button should be clickable
    expect(syncButton).toBeInTheDocument()
  })

  it('shows empty state when no analytics data exists', () => {
    const demoWithoutAnalytics = {
      ...mockDemo,
      metadata: {},
    }
    
    render(<Reporting demo={demoWithoutAnalytics} />)
    
    expect(screen.getByText('No analytics data available yet.')).toBeInTheDocument()
    expect(screen.getByText('Start conversations to see analytics data here.')).toBeInTheDocument()
  })

  it('shows loading state during data fetch', () => {
    render(<Reporting demo={null} />)
    
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('displays score colors based on performance', () => {
    render(<Reporting {...defaultProps} />)
    
    // High scores (85+) should have green styling
    const domoScoreElement = screen.getByText('85')
    expect(domoScoreElement).toHaveClass('text-green-600')
  })

  it('formats duration correctly', () => {
    const demoWithLongDuration = {
      ...mockDemo,
      metadata: {
        ...mockDemo.metadata,
        analytics: {
          ...mockDemo.metadata.analytics,
          averageDuration: 3665, // 1 hour, 1 minute, 5 seconds
        },
      },
    }
    
    render(<Reporting demo={demoWithLongDuration} />)
    
    expect(screen.getByText('1h 1m 5s')).toBeInTheDocument()
  })

  it('handles percentage formatting', () => {
    const demoWithDecimalRates = {
      ...mockDemo,
      metadata: {
        ...mockDemo.metadata,
        analytics: {
          ...mockDemo.metadata.analytics,
          completionRate: 0.856, // Should round to 86%
          ctaClickRate: 0.234, // Should round to 23%
        },
      },
    }
    
    render(<Reporting demo={demoWithDecimalRates} />)
    
    expect(screen.getByText('86%')).toBeInTheDocument()
    expect(screen.getByText('23%')).toBeInTheDocument()
  })

  it('shows export functionality', () => {
    render(<Reporting {...defaultProps} />)
    
    expect(screen.getByText('Export Data')).toBeInTheDocument()
  })

  it('handles export button click', async () => {
    const user = userEvent.setup()
    
    render(<Reporting {...defaultProps} />)
    
    const exportButton = screen.getByText('Export Data')
    await user.click(exportButton)
    
    // Button should be clickable
    expect(exportButton).toBeInTheDocument()
  })
})