const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

//Test route
app.get('/', (req, res) => {
    res.json({message: 'AnemiaCare backend is running!'});
});

//Analyse blood report 
app.post('/api/analyze', upload.single('report'), (req, res) => {
    //Simulate Hb extraction (replace with real OCR/AI later)
    const hb_value = (Math.random() * (14 - 6) + 6).toFixed(1); 
    let status; // Random Hb between 6 and 14

    if (hb_value < 7) status = 'Severe';
    else if (hb_value < 10) status = 'Mild';
    else if (hb_value < 12) status = 'Appropriate';
    else status = 'Sufficient';

    res.json({hb_value: parseFloat(hb_value), status});
});

//Diet Plan by status 
app.get('/api/diet-plan', (req, res) => {
    const plans = {
        Severe: ['Palak dal', 'Rajma rice', 'Amla juice', 'Jaggery chikki'],
        Mild:        ['Chana sabzi', 'Ragi roti', 'Dates', 'Spinach soup'],
        Appropriate: ['Moong dal', 'Mixed veg', 'Fresh fruit', 'Curd rice'],
        Sufficient:  ['Balanced thali', 'Seasonal fruits', 'Milk', 'Sprouts']
    };
    res.json({diet: plans[req.params.status] || plans['Appropriate']});
});

//To-dos by status 
app.get('/api/todos', (req, res) => {
    const todos = [
        'Take iron supplement in the morning',
        'Drink Amla juice after breakfast',
        'Avoid tea/coffee for 1 hour after meals',
        'Light walk for 20 minutes',
        'Log your next Hb test date'
    ];
    res.json({ todos });
});

app.listen(PORT, () => {
  console.log(`AnemiaCare backend running on http://localhost:${PORT}`);
});