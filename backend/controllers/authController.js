const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.signup = async (req, res) => {
  const { email, password, dob, height, weight, diet_preference, meals_per_day, water_intake, exercise_frequency, health_goal, last_period_date, cycle_length, symptoms } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.execute('SELECT email FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await conn.execute('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
    const userId = userResult.insertId;
    await conn.execute(
      'INSERT INTO user_profiles (user_id, dob, height, weight, diet_preference, meals_per_day, water_intake, exercise_frequency, health_goal, last_period_date, cycle_length, symptoms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, dob, height, weight, diet_preference, meals_per_day, water_intake, exercise_frequency, health_goal, last_period_date, cycle_length, JSON.stringify(symptoms)]
    );
    await conn.commit();
    res.status(201).json({ message: 'Signup successful.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error during signup.' });
  } finally { conn.release(); }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ message: 'Invalid email or password.' });
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password.' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) { res.status(500).json({ message: 'Server error during login.' }); }
};
