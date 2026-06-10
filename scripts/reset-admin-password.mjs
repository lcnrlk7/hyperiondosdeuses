import bcrypt from 'bcryptjs';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não configurada');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

const email = 'elicecontadodiscord@gmail.com';
const newPassword = 'Admin@123456'; // Nova senha

async function resetPassword() {
  try {
    // Verificar se o usuario existe
    const users = await sql`
      SELECT id, email, name, is_admin 
      FROM profiles 
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      console.log('Usuario não encontrado:', email);
      console.log('\nUsuarios admin existentes:');
      const admins = await sql`
        SELECT email, name, is_admin 
        FROM profiles 
        WHERE is_admin = true
      `;
      admins.forEach(a => console.log(`  - ${a.email} (${a.name})`));
      await sql.end();
      return;
    }

    const user = users[0];
    console.log('Usuario encontrado:', user.email, '- Admin:', user.is_admin);

    // Gerar novo hash
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Atualizar senha
    await sql`
      UPDATE profiles 
      SET password_hash = ${hashedPassword}, updated_at = NOW()
      WHERE email = ${email}
    `;

    console.log('\n✅ Senha redefinida com sucesso!');
    console.log('Email:', email);
    console.log('Nova senha:', newPassword);
    
    await sql.end();
  } catch (error) {
    console.error('Erro:', error);
    await sql.end();
    process.exit(1);
  }
}

resetPassword();
