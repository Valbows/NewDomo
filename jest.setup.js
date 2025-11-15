import '@testing-library/jest-dom'

// Mock Next.js Web API globals for API tests
global.Request = class Request {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.body = init.body || null
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'))
  }
  
  text() {
    return Promise.resolve(this.body || '')
  }
}

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = new Map(Object.entries(init?.headers || {}))
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'))
  }
  
  text() {
    return Promise.resolve(this.body || '')
  }
  
  static json(data) {
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: global.Request,
  NextResponse: {
    json: (data, init = {}) => {
      const response = new global.Response(JSON.stringify(data), {
        status: init.status || 200,
        statusText: init.statusText || 'OK',
        headers: { 
          'Content-Type': 'application/json', 
          ...init.headers 
        }
      });
      return response;
    },
    
    next: () => {
      return new global.Response(null, { status: 200 });
    },
    
    redirect: (url, status = 302) => {
      return new global.Response(null, {
        status,
        headers: { Location: url }
      });
    }
  },
}))

// Set test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SECRET_KEY = 'test-secret-key'
process.env.NODE_ENV = 'test'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/demos/test-demo/configure'
  },
}))

// Mock Next.js server components
jest.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
  }),
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        createSignedUrl: jest.fn(() => Promise.resolve({ data: { signedUrl: 'test-url' }, error: null })),
        upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    },
  },
}))

// Mock Supabase server utils
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  })),
}))

// Mock hooks
jest.mock('@/hooks/useDemosRealtime', () => ({
  useDemosRealtime: jest.fn(() => ({
    demos: [],
    loading: false,
    error: null,
  })),
}))

jest.mock('@/hooks/useCustomObjectives', () => ({
  useCustomObjectives: jest.fn(() => ({
    objectives: [],
    loading: false,
    error: null,
    createObjective: jest.fn(),
    updateObjective: jest.fn(),
    deleteObjective: jest.fn(),
    activateObjective: jest.fn(),
    refreshObjectives: jest.fn(),
  })),
}))

jest.mock('@/lib/tavus/objectives-manager', () => ({
  createObjectivesManager: jest.fn(() => ({
    getObjectives: jest.fn(() => Promise.resolve([])),
    setObjectives: jest.fn(() => Promise.resolve()),
  })),
}))

// Mock components
jest.mock('@/components/ObjectivesStatus', () => ({
  ObjectivesStatus: jest.fn(() => null),
}))

jest.mock('@/components/CustomObjectivesManager', () => ({
  CustomObjectivesManager: jest.fn(() => null),
}))

jest.mock('@/components/WebhookUrlDisplay', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

// Mock UUID
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader">Loading...</div>,
  AlertCircle: () => <div data-testid="alert">Alert</div>,
  Wand2: () => <div data-testid="wand">Wand</div>,
  Upload: () => <div data-testid="upload">Upload</div>,
  Play: () => <div data-testid="play">Play</div>,
  Trash2: () => <div data-testid="trash">Delete</div>,
  Plus: () => <div data-testid="plus">Plus</div>,
  FileText: () => <div data-testid="file">File</div>,
  Save: () => <div data-testid="save">Save</div>,
  BarChart3: () => <div data-testid="chart">Chart</div>,
  RefreshCw: () => <div data-testid="refresh">Refresh</div>,
}))

// Mock Next.js Response for API tests
global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = new Map(Object.entries(init?.headers || {}))
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body))
  }
  
  text() {
    return Promise.resolve(this.body)
  }
}

// Mock window.alert
global.alert = jest.fn()

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
)

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}