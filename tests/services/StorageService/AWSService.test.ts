import AWSService from '@/services/StorageService/AWSService'

jest.mock('@/libs/s3', () => ({
  s3: { send: jest.fn() }
}))

describe('AWSService', () => {
  it('uploads a valid jpeg file', async () => {
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    const result = await AWSService.uploadFile(file, 'images')
    expect(result).toContain('https://')
  })

  it('rejects invalid folder', async () => {
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    await expect(AWSService.uploadFile(file, 'not_allowed')).rejects.toThrow('INVALID_FOLDER_NAME')
  })
})
