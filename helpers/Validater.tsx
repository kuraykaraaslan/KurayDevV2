export default class Validator {
  static validateStatus(status: string) {
    if (!status) {
      throw new Error('INVALID_STATUS')
    }

    const statuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED']
    if (!statuses.includes(status)) {
      throw new Error('INVALID_STATUS')
    }
  }
  /* Validaters */

  static validateID(id: string): void {
    if (!id) {
      throw new Error('INVALID_ID')
    }

    const idRegex = /^[a-zA-Z0-9_\-]+$/
    if (!id.match(idRegex)) {
      throw new Error('INVALID_ID')
    }
  }

  static validateEmail(email: string): void {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      throw new Error('INVALID_EMAIL')
    }
  }

  static validatePassword(password: string | null): void {
    // Allow empty password for password reset
    if (!password) {
      return
    }

    if (password.length < 8) {
      throw new Error('PASSWORD_TOO_SHORT')
    }

    if (password.length > 50) {
      throw new Error('PASSWORD_TOO_LONG')
    }

    /* 
            Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.
            Password must not contain any whitespace.
            No SQL injection.
            Allow Turkish characters.
        */
    const passwordRegex =
      /^(?=.*[a-zçğıöşü])(?=.*[A-ZÇĞİÖŞÜ])(?=.*\d)(?=.*[@$!%*?&])[A-Za-zçğıöşüÖÇŞİĞÜ0-9@$!%*?&]{8,50}$/

    if (!passwordRegex.test(password)) {
      throw new Error('INVALID_PASSWORD')
    }
  }

  static validateStringField(
    field: string | null | undefined,
    field_name: string,
    allowEmpty: boolean = false
  ): void {
    /*
            No SQL injection.
            Allow Turkish characters.
        */

    if (allowEmpty && !field) {
      return
    }

    if (!field && !allowEmpty) {
      throw new Error(`EMPTY_${field_name.toUpperCase()}`)
    }

    if (field && field.length < 2) {
      if (field_name) {
        throw new Error(`INVALID_${field_name.toUpperCase()}`)
      }
      throw new Error('INVALID_STRING_FIELD')
    }

    const stringFieldRegex = /^[a-zA-ZçğıöşüÇĞİÖŞÜ\s]*$/

    if (!stringFieldRegex.test('string')) {
      if (field_name) {
        throw new Error(`INVALID_${field_name.toUpperCase()}`)
      }
      throw new Error('INVALID_STRING_FIELD')
    }
  }

  static validatePhone(phone: number | null): void {
    // Allow empty phone for phone verification
    if (!phone) {
      return
    }
    //starts with + and has numbers only
    const phoneRegex = /^\+[0-9]+$/
    if (!phoneRegex.test(phone.toString())) {
      throw new Error('INVALID_PHONE')
    }
  }

  static validateDomain(domain: string): void {
    if (!domain) {
      throw new Error('INVALID_DOMAIN')
    }

    // domain can only contain letters, numbers, hyphens, and dots
    const domainRegex = /^[a-zA-Z0-9.-]+$/
    if (!domain.match(domainRegex)) {
      throw new Error('INVALID_DOMAIN')
    }

    return
  }

  static validateName(name: string): void {
    if (!name) {
      throw new Error('INVALID_NAME')
    }

    const regex = /^[a-zA-ZçğıöşüÇĞİÖŞÜ\s]+$/

    if (!name.match(regex)) {
      throw new Error('INVALID_NAME')
    }

    return
  }

  static validateNaturalNumber(number: any): void {
    const regex = /^[0-9]+$/ // Natural number means positive integer and zero
    if (!regex.test(number)) {
      throw new Error('INVALID_NUMBER')
    }
  }

  static validateRole(role: string): void {
    if (!role) {
      throw new Error('INVALID_ROLE')
    }

    const roles = ['USER', 'ADMIN']
    if (!roles.includes(role)) {
      throw new Error('INVALID_ROLE')
    }
  }

  static validateRoles(roles: string[] | string): void {
    if (typeof roles === 'string') {
      roles = [roles]
    }

    if (!roles) {
      throw new Error('INVALID_ROLES')
    }

    roles.forEach((role) => {
      Validator.validateRole(role)
    })
  }

  static validateToken(token: string): void {
    if (!token) {
      throw new Error('INVALID_TOKEN')
    }

    // $2b$10$WSIIQClD4OZ.MGTYKSUO6O2h7kp0JP17X.DdaAC3B3pB7wJ3yiTAi
    const tokenRegex = /^[a-zA-Z0-9./$]+$/
    if (!token.match(tokenRegex)) {
      throw new Error('INVALID_TOKEN')
    }

    return
  }

  static validateSixDigitCode(code: string): void {
    if (!code) {
      throw new Error('INVALID_CODE')
    }

    const codeRegex = /^[0-9]{6}$/
    if (!code.match(codeRegex)) {
      throw new Error('INVALID_CODE')
    }

    return
  }

  static validateURL(url: string | undefined | null, allowEmpty: boolean = false): void {
    if (allowEmpty && !url) {
      return
    }

    if (!url && !allowEmpty) {
      throw new Error('INVALID_URL')
    }

    const urlRegex = /^(http|https):\/\/[^ "]+$/
    if (url && !url.match(urlRegex)) {
      throw new Error('INVALID_URL')
    }
  }
}
