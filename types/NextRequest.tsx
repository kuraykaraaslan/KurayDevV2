import { NextRequest as Org } from 'next/server';
import SessionWithUser from './SessionWithUser';

export default class NextRequest extends Org {
  // Add custom properties or methods here
  session?: SessionWithUser;

  constructor(req: NextRequest) {
    super(req);
  }

  customMethod() {
    console.log("This is a custom method");
  }
}
