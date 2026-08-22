import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
const email = process.env.RESET_TEAM_EMAIL;
const newPassword = process.env.RESET_TEAM_PASSWORD;

if (!DATABASE_URL || !email || !newPassword || newPassword.length < 12) {
  throw new Error('Defina DATABASE_URL, RESET_TEAM_EMAIL e RESET_TEAM_PASSWORD (minimo 12 caracteres)');
}

const sql = neon(DATABASE_URL);

async function run() {
  // Verificar na tabela team_members
  const teamMembers = await sql`SELECT id, email, name, role FROM team_members WHERE email = ${email}`;
  
  if (teamMembers.length === 0) {
    console.log('Usuario NAO encontrado na tabela team_members');
    console.log('Listando todos os team_members:');
    const allMembers = await sql`SELECT email, name, role FROM team_members`;
    console.log(allMembers);
    return;
  }
  
  console.log('Usuario encontrado:', teamMembers[0]);
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await sql`UPDATE team_members SET password_hash = ${hashedPassword}, updated_at = NOW() WHERE email = ${email}`;
  console.log('Senha redefinida na tabela team_members!');
  console.log('Email:', email);
  console.log('Nova senha:', newPassword);
}

run().catch(e => { console.error(e); process.exit(1); });
