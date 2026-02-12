import ProjectService from '@/services/ProjectService'

describe('ProjectService', () => {
  it('exports methods and is usable and should be defined', () => {
    expect(ProjectService).toBeDefined()
    const props = Object.getOwnPropertyNames(ProjectService)
    const hasStatic = props.some((p) => typeof (ProjectService as any)[p] === 'function')
    expect(hasStatic).toBe(true)
  })
})
