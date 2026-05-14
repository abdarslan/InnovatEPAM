import bcrypt from 'bcryptjs'

const WORK_FACTOR = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, WORK_FACTOR)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
