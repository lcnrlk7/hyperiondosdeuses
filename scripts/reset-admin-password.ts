import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_To8gys4jEZpb@ep-snowy-pine-ancq443l-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

const email = 'elicecontadodiscord@gmail.com';
const newPassword = 'Admin@123456';

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
