import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const users = [
  {
    email: 'manager.sales@nts.com',
    name: 'Manager Sales',
    phone: '0321-0001122',
    address: '45-C Sunset Blvd',
    emergency_contact_name: 'Sara Khan',
    emergency_contact_phone: '0301-5556677',
    employee_id: 'MS001',
    position: 'Sales Manager',
    role: 'manager',
    department: 'Sales',
    join_date: '2023-03-01',
    annual_salary: 120000.00,
    profile_photo: null,
    password: 'SecurePass456',  // PLAIN TEXT for seeding
    table: 'managers'  // Manager is still stored under employees
  }
];

async function seedUsers() {
  for (const user of users) {
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`❌ Auth error for ${user.email}:`, authError.message);
        continue;
      }

      const { error: dbError } = await supabase.from(user.table).insert({
        id: authUser.user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        employee_id: user.employee_id,
        position: user.position,
        role: user.role,
        department: user.department,
        join_date: user.join_date,
        annual_salary: user.annual_salary,
        leave_balance: 20,
        profile_photo: user.profile_photo,
        password: user.password
      });

      if (dbError) {
        console.error(`❌ DB insert error for ${user.email}:`, dbError.message);
      } else {
        console.log(`✅ Manager created for ${user.email}`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error for ${user.email}:`, err.message);
    }
  }
}

seedUsers();
INSERT INTO public.progress (task_id, user_id, progress_percent, comment)
VALUES
  (
    'a022f993-5c2c-41d5-b244-e99a66b0cc55',
    '38e51bf8-b41f-4b01-ae70-937c86b91082',
    40,
    'Initial setup completed, login working'
  ),
  (
    'f592bea5-1a5c-425e-8965-1d1cd3a2c5e8',
    '38e51bf8-b41f-4b01-ae70-937c86b91082',
    70,
    'Integrated with OAuth provider'
  );
