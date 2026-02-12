import CategoryService from '@/services/CategoryService'

describe('CategoryService', () => {
  it('exports methods and is usable', () => {
    expect(CategoryService).toBeDefined()
    const props = Object.getOwnPropertyNames(CategoryService)
    const hasStatic = props.some((p) => typeof (CategoryService as any)[p] === 'function')
    expect(hasStatic).toBe(true)
  })
})
