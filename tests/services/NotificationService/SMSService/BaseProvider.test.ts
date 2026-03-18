import BaseProvider from '@/services/NotificationService/SMSService/BaseProvider'

class ConcreteProvider extends BaseProvider {}

describe('BaseProvider', () => {
  it('throws "not implemented" when sendShortMessage is called without override', () => {
    const provider = new ConcreteProvider()
    expect(() => provider.sendShortMessage('+1234567890', 'Hello')).toThrow('sendShortMessage method not implemented')
  })
})
