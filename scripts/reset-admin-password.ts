import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
const email = process.env.RESET_ADMIN_EMAIL;
const newPassword = process.env.RESET_ADMIN_PASSWORD;

if (!DATABASE_URL || !email || !newPassword || newPassword.length < 12) {
  throw new Error('Defina DATABASE_URL, RESET_ADMIN_EMAIL e RESET_ADMIN_PASSWORD (minimo 12 caracteres)');
}

const sql = neon(DATABASE_URL);

async function run() {
  const users = await sql`SELECT id, email, name, is_admin FROM profiles WHERE email = ${email}`;
  
  if (users.length === 0) {
    console.log('Usuario não encontrado:', email);
    const admins = await sql`SELECT email, name FROM profiles WHERE is_admin = true`;
    console.log('Admins existentes:', admins.map((a: { email: string }) => a.email));
    return;
  }
  
  console.log('Usuario encontrado:', users[0].email);
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await sql`UPDATE profiles SET password_hash = ${hashedPassword}, updated_at = NOW() WHERE email = ${email}`;
  console.log('');
  console.log('=================================');
  console.log('  SENHA REDEFINIDA COM SUCESSO!');
  console.log('=================================');
  console.log('Email:', email);
  console.log('Nova senha:', newPassword);
  console.log('=================================');
}

run().catch(e => { console.error(e); process.exit(1); });
