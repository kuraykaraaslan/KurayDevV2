import { User, Session } from '@prisma/client'

// Session with user
export default interface SessionWithUser extends Omit<Session, 'createdAt' | 'updatedAt'> {
    user: Pick<User, 'userId' | 'email' | 'name' | 'phone' | 'role' | 'image'>

}