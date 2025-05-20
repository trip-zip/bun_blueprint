import { expect, test, describe } from 'bun:test'
import { matchPath } from './utils.js'

describe('matchPath function', () => {
  test('matches exact static paths', () => {
    expect(matchPath('/', '/')).toEqual({})
    expect(matchPath('/users', '/users')).toEqual({})
    expect(matchPath('/api/status', '/api/status')).toEqual({})
  })

  test('returns null for non-matching static paths', () => {
    expect(matchPath('/users', '/')).toBeNull()
    expect(matchPath('/', '/users')).toBeNull()
    expect(matchPath('/api/users', '/api/status')).toBeNull()
    expect(matchPath('/api/status', '/api')).toBeNull()
  })

  test('extracts single parameter from path', () => {
    expect(matchPath('/users/:userId', '/users/123')).toEqual({ userId: '123' })
    expect(matchPath('/api/:version', '/api/v1')).toEqual({ version: 'v1' })
    expect(matchPath('/:section', '/dashboard')).toEqual({
      section: 'dashboard',
    })
  })

  test('extracts multiple parameters from path', () => {
    expect(
      matchPath('/users/:userId/posts/:postId', '/users/123/posts/456'),
    ).toEqual({
      userId: '123',
      postId: '456',
    })

    expect(matchPath('/:org/:repo/:issue', '/facebook/react/issues')).toEqual({
      org: 'facebook',
      repo: 'react',
      issue: 'issues',
    })
  })

  test('handles parameters at different positions', () => {
    expect(matchPath('/:resource/create', '/posts/create')).toEqual({
      resource: 'posts',
    })

    expect(matchPath('/api/:version/:resource', '/api/v2/users')).toEqual({
      version: 'v2',
      resource: 'users',
    })

    expect(
      matchPath('/:org/:repo/settings', '/microsoft/typescript/settings'),
    ).toEqual({
      org: 'microsoft',
      repo: 'typescript',
    })
  })

  test('handles special characters in parameters', () => {
    expect(matchPath('/users/:userId', '/users/user@example.com')).toEqual({
      userId: 'user@example.com',
    })

    expect(matchPath('/files/:filename', '/files/report-2023.pdf')).toEqual({
      filename: 'report-2023.pdf',
    })

    expect(matchPath('/search/:query', '/search/react+hooks')).toEqual({
      query: 'react+hooks',
    })
  })

  test('handles numeric and UUID-like parameters', () => {
    expect(matchPath('/posts/:postId', '/posts/12345')).toEqual({
      postId: '12345',
    })

    expect(
      matchPath(
        '/users/:userId',
        '/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      ),
    ).toEqual({
      userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    })
  })

  test('returns null for paths with different segment counts', () => {
    expect(matchPath('/users/:userId', '/users')).toBeNull()
    expect(matchPath('/users', '/users/123')).toBeNull()
    expect(matchPath('/api/users/:userId', '/api/users/123/posts')).toBeNull()
    expect(matchPath('/api/users/:userId/posts', '/api/users')).toBeNull()
  })

  test('handles empty segments correctly', () => {
    expect(matchPath('/users/:/posts', '/users//posts')).toEqual({ '': '' })
    expect(matchPath('//', '//')).toEqual({})
  })

  test('matches routes from our application', () => {
    expect(matchPath('/', '/')).toEqual({})
    expect(matchPath('/units', '/units')).toEqual({})
    expect(matchPath('/units/:unitId', '/units/123')).toEqual({ unitId: '123' })
  })
})
