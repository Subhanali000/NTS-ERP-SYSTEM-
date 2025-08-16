const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');

async function seedEmployee() {
  const hashedPassword = bcrypt.hashSync('password1234', 10);

  const employee = {
    email: 'employee1@example.com',
    password: hashedPassword,
    name: 'Alice Johnson',
    phone: '9876543210',
    address: '456 Tech Park Ave',
    emergency_contact_name: 'Bob Johnson',
    emergency_contact_phone: '9123456780',
    employee_id: 'EMP001',
    position: 'Software Engineer',
    role: 'employee',
    department: 'tech',
    manager_id: null, // ✅ NULL is valid
    director_id: 'cfb95087-69c2-48e3-97c4-c0454b6b35c8', // ✅ Valid UUID
    join_date: '2024-03-15',
    annual_salary: 85000,
    annual_leave_balance: 18,
    college: 'ABC University',
    internship_start_date: '2023-06-01',
    internship_end_date: '2023-12-01',
    manager_title: 'Engineering Manager'
  };

  const { data, error } = await supabase.from('employees').insert([employee]);

  if (error) {
    console.error('❌ Error inserting employee:', error.message);
  } else {
    console.log('✅ Employee seeded successfully:', data);
  }
}

seedEmployee();
