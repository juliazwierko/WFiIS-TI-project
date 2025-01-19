// 2zviarko@pascal23:~$ hostname -I
// 149.156.109.180 2001:6d8:10:4401:20c:29ff:feba:49ca 
// node server.js 

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const app = express();
const port = 3339; 

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'twoj_tajny_klucz';

const corsOpts = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
};
  
app.use(cors(corsOpts));
app.use(bodyParser.json());

mongoose.connect('mongodb://2zviarko:pass2zviarko@172.20.44.25:27017/2zviarko', {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => {
    console.log('Połączono z MongoDB');
}).catch(err => {
    console.log('Błąd połączenia:', err);
});

const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    password: String
}));

const History = mongoose.model('History', new mongoose.Schema({
    username: String,
    algorithm: String,
    arraySize: Number,
    resultTime: Number, // Time result for sorting algorithm
    timestamp: { type: Date, default: Date.now }
}));

 
app.options('*', cors());

app.get('/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Sprawdzamy, czy username jest unikalne, korzystając z istniejącego endpointu
    try {
        const users = await User.find();  // Pobieramy wszystkich użytkowników
        const existingUser = users.find(user => user.username === username);  // Sprawdzamy, czy już istnieje użytkownik z takim username

        if (existingUser) {
            return res.status(400).json({ message: 'Taki użytkownik już istnieje' });
        }

        // Walidacja hasła
        if (!password || password.trim() === '') {
            return res.status(400).json({ message: 'Hasło nie może być puste' });
        }

        // Tworzenie nowego użytkownika
        const user = new User({ username, password });
        await user.save();
        return res.json({ message: 'Użytkownik zarejestrowany' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Błąd serwera, spróbuj ponownie później' });
    }
});

app.post('/save-history', async (req, res) => {
    const { username, algorithm, arraySize, resultTime } = req.body;

    const historyEntry = new History({
        username,
        algorithm,
        arraySize,
        resultTime
    });

    await historyEntry.save();
    res.json({ message: 'Historia została zapisana' });
});

// Getter do pobierania historii po username
app.get('/history/:username', async (req, res) => {
    const { username } = req.params; // Pobieramy username z parametrów URL
    try {
        const history = await History.find({ username }); // Wyszukujemy historię po username
        if (history.length === 0) {
            return res.status(404).json({ message: 'Brak historii dla tego użytkownika' });
        }
        res.json(history); // Zwracamy historię użytkownika
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera', error: err });
    }
});

// app.post('/login', async (req, res) => {
//     const { username, password } = req.body;
//     const user = await User.findOne({ username });
//     if (user && user.password === password) {
//         res.json({ message: 'Zalogowano pomyślnie' });
//     } else {
//         res.json({ message: 'Błędne dane logowania' });
//     }
// });
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && user.password === password) {
        // Create token
        const token = jwt.sign({ userId: user._id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Zalogowano pomyślnie', token, username: user.username });  // Include username in the response
    } else {
        res.status(401).json({ message: 'Błędne dane logowania' });
    }
});

app.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Nieprawidłowy identyfikator użytkownika' });
    }

    try {
        const user = await User.findById(id);
        if (user) {
            user.username = username;
            user.password = password;
            await user.save();
            res.json({ message: 'Użytkownik zaktualizowany' });
        } else {
            res.json({ message: 'Użytkownik nie znaleziony' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

app.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Nieprawidłowy identyfikator użytkownika' });
    }

    try {
        const user = await User.findByIdAndDelete(id);
        if (user) {
            res.json({ message: 'Użytkownik usunięty' });
        } else {
            res.json({ message: 'Użytkownik nie znaleziony' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});


app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}`);
});
