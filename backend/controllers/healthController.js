const db = require('../config/db');


exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;


    const [userProfile] = await db.execute(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (userProfile.length === 0) {
      return res.status(404).json({
        message: 'Profile not found',
        success: false
      });
    }


    const [hbReadings] = await db.execute(
      'SELECT * FROM hb_readings WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );


    const profile = userProfile[0];
    const readings = hbReadings || [];


    const avgHb = readings.length > 0
      ? (readings.reduce((sum, r) => sum + r.hb_level, 0) / readings.length).toFixed(1)
      : null;

    const dashboardData = {
      user: {
        email: req.user.email,
        name: profile.name
      },
      profile: {
        dob: profile.dob,
        height: profile.height,
        weight: profile.weight,
        diet_preference: profile.diet_preference,
        exercise_frequency: profile.exercise_frequency,
        health_goal: profile.health_goal
      },
      health_metrics: {
        average_hb: avgHb,
        total_readings: readings.length,
        last_reading: readings.length > 0 ? readings[0] : null
      },
      period_tracking: {
        last_period_date: profile.last_period_date,
        cycle_length: profile.cycle_length,
        next_period_date: calculateNextPeriod(profile.last_period_date, profile.cycle_length)
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({
      message: 'Server error',
      success: false,
      error: err.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      dob,
      height,
      weight,
      diet_preference,
      meals_per_day,
      water_intake,
      exercise_frequency,
      health_goal,
      last_period_date,
      cycle_length,
      symptoms
    } = req.body;

    const [result] = await db.execute(
      `UPDATE user_profiles SET
        dob = ?, height = ?, weight = ?, diet_preference = ?,
        meals_per_day = ?, water_intake = ?, exercise_frequency = ?,
        health_goal = ?, last_period_date = ?, cycle_length = ?, symptoms = ?
      WHERE user_id = ?`,
      [
        dob,
        height,
        weight,
        diet_preference,
        meals_per_day,
        water_intake,
        exercise_frequency,
        health_goal,
        last_period_date,
        cycle_length,
        JSON.stringify(symptoms),
        userId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Profile not found',
        success: false
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({
      message: 'Server error',
      success: false,
      error: err.message
    });
  }
};

// Add HB (Hemoglobin) reading
exports.addHbReading = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hb_level, notes } = req.body;

    if (!hb_level) {
      return res.status(400).json({
        message: 'HB level is required',
        success: false
      });
    }

    const [result] = await db.execute(
      'INSERT INTO hb_readings (user_id, hb_level, notes) VALUES (?, ?, ?)',
      [userId, hb_level, notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'HB reading added successfully',
      data: {
        id: result.insertId,
        hb_level,
        notes,
        created_at: new Date()
      }
    });
  } catch (err) {
    console.error('Add HB reading error:', err);
    res.status(500).json({
      message: 'Server error',
      success: false,
      error: err.message
    });
  }
};

// Get diet plan based on status
exports.getDietPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.params;

    if (!['normal', 'mild_anemia', 'severe_anemia'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status',
        success: false
      });
    }

    // Get user profile
    const [profile] = await db.execute(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (profile.length === 0) {
      return res.status(404).json({
        message: 'Profile not found',
        success: false
      });
    }

    const dietPlan = getDietPlanByStatus(status, profile[0].diet_preference);

    res.json({
      success: true,
      data: {
        status,
        diet_preference: profile[0].diet_preference,
        plan: dietPlan,
        recommendations: getRecommendations(status, profile[0])
      }
    });
  } catch (err) {
    console.error('Get diet plan error:', err);
    res.status(500).json({
      message: 'Server error',
      success: false,
      error: err.message
    });
  }
};

// Helper functions
function calculateNextPeriod(lastPeriodDate, cycleLength) {
  if (!lastPeriodDate || !cycleLength) return null;

  const lastDate = new Date(lastPeriodDate);
  const nextDate = new Date(lastDate.getTime() + cycleLength * 24 * 60 * 60 * 1000);

  return {
    date: nextDate.toISOString().split('T')[0],
    days_remaining: Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24))
  };
}

function getDietPlanByStatus(status, dietPreference) {
  const plans = {
    normal: {
      title: 'Balanced Diet Plan',
      description: 'Maintain healthy hemoglobin levels',
      foods: getIronRichFoods(dietPreference),
      frequency: 'Daily',
      portions: '3 meals + 2 snacks'
    },
    mild_anemia: {
      title: 'Mild Anemia Diet Plan',
      description: 'Increase iron intake to support hemoglobin production',
      foods: getHighIronFoods(dietPreference),
      frequency: 'Daily',
      portions: '3 meals + 2-3 iron-rich snacks',
      supplements: 'Consider iron supplements (consult doctor)'
    },
    severe_anemia: {
      title: 'Severe Anemia Diet Plan',
      description: 'Intensive iron-rich diet plan',
      foods: getHighIronFoods(dietPreference),
      frequency: 'Daily',
      portions: '3 iron-rich meals + 3 snacks',
      supplements: 'Iron supplements (consult doctor)',
      warning: 'Please consult a healthcare professional'
    }
  };

  return plans[status] || plans.normal;
}

function getIronRichFoods(dietPreference) {
  const foods = {
    Vegetarian: [
      { name: 'Spinach', iron: '2.7mg', prep: 'Cooked' },
      { name: 'Lentils', iron: '3.3mg', prep: 'Boiled' },
      { name: 'Chickpeas', iron: '2.9mg', prep: 'Cooked' },
      { name: 'Fortified Cereals', iron: '18mg', prep: 'Breakfast' },
      { name: 'Pumpkin Seeds', iron: '8.8mg', prep: 'Roasted' },
      { name: 'Tofu', iron: '3.4mg', prep: 'Pan-fried' }
    ],
    'Non-Vegetarian': [
      { name: 'Red Meat', iron: '2.6mg', prep: 'Cooked' },
      { name: 'Chicken', iron: '0.7mg', prep: 'Grilled' },
      { name: 'Fish', iron: '1.2mg', prep: 'Baked' },
      { name: 'Eggs', iron: '1.2mg', prep: 'Boiled' },
      { name: 'Oysters', iron: '5.3mg', prep: 'Steamed' },
      { name: 'Turkey', iron: '1.4mg', prep: 'Grilled' }
    ],
    Vegan: [
      { name: 'Spinach', iron: '2.7mg', prep: 'Cooked' },
      { name: 'Lentils', iron: '3.3mg', prep: 'Boiled' },
      { name: 'Chickpeas', iron: '2.9mg', prep: 'Cooked' },
      { name: 'Pumpkin Seeds', iron: '8.8mg', prep: 'Roasted' },
      { name: 'Fortified Plant Milk', iron: '2mg', prep: 'Plain' },
      { name: 'Tempeh', iron: '3.0mg', prep: 'Pan-fried' }
    ]
  };

  return foods[dietPreference] || foods.Vegetarian;
}

function getHighIronFoods(dietPreference) {
  const foods = getIronRichFoods(dietPreference);
  return foods.sort((a, b) => parseFloat(b.iron) - parseFloat(a.iron)).slice(0, 8);
}

function getRecommendations(status, profile) {
  const recommendations = [];

  if (status === 'severe_anemia') {
    recommendations.push('Consult a healthcare professional immediately');
    recommendations.push('Take prescribed iron supplements');
    recommendations.push('Increase vitamin C intake to enhance iron absorption');
  }

  if (status === 'mild_anemia' || status === 'severe_anemia') {
    recommendations.push('Eat iron-rich foods daily');
    recommendations.push('Avoid caffeine and tea with meals (reduces iron absorption)');
    recommendations.push('Include vitamin C sources (citrus, tomatoes) with iron-rich foods');
  }

  recommendations.push('Stay hydrated (8-10 glasses daily)');
  recommendations.push('Exercise regularly according to your fitness level');
  recommendations.push('Monitor hemoglobin levels monthly');

  if (profile.exercise_frequency === 'Never') {
    recommendations.push('Start with light exercises like walking for 20-30 minutes daily');
  }

  return recommendations;
}