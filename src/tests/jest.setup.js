// Add Jest extended matchers
import '@testing-library/jest-dom';

// Mock the next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    route: '/',
    pathname: '',
    query: {},
    asPath: '',
    push: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
    beforePopState: jest.fn(() => null),
    prefetch: jest.fn(() => null),
  })),
}));

// Mock next/image because it's not compatible with Jest
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// Mock the createClient function for Supabase
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({ data: { user: null }, error: null })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({ data: [], error: null })),
          })),
          limit: jest.fn(() => ({ data: [], error: null })),
          or: jest.fn(() => ({
            order: jest.fn(() => ({ data: [], error: null })),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => ({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ data: {}, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ data: {}, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({ data: {}, error: null })),
      })),
    })),
  })),
})); 