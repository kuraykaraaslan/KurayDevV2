import { cosine } from '@/helpers/Cosine'

describe('cosine', () => {
  it('returns 0 for empty vectors', () => {
    expect(cosine([], [])).toBe(0)
  })

  it('returns 0 for vectors of different lengths', () => {
    expect(cosine([1, 2], [1])).toBe(0)
  })

  it('returns 1 for identical non-zero vectors', () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0)
  })

  it('returns 0 when both vectors are zero', () => {
    expect(cosine([0, 0], [0, 0])).toBe(0)
  })

  it('returns correct similarity for known vectors', () => {
    // cos([1,1], [1,0]) = 1/sqrt(2) ≈ 0.707
    expect(cosine([1, 1], [1, 0])).toBeCloseTo(0.7071, 4)
  })

  it('returns -1 for opposite vectors', () => {
    expect(cosine([1, 0], [-1, 0])).toBeCloseTo(-1)
  })
})
