require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const { body, validationResult } = require('express-validator');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // Ensure this points to the correct folder

// MongoDB connection
async function connectDB() {
    let retries = 5;
    while (retries) {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('MongoDB connected successfully.');
            return conn;
        } catch (error) {
            retries -= 1;
            console.error(`MongoDB connection failed. Retrying (${retries} retries left)...`);
            await new Promise((res) => setTimeout(res, 5000));
        }
    }
    console.error('Could not connect to MongoDB. Exiting...');
    process.exit(1);
}

const conn = connectDB();

// GridFS setup
let gfs;
let bucket;

conn.then((db) => {
    if (!db) {
        console.error('Failed to initialize GridFS due to invalid database connection.');
        process.exit(1);
    }

    const mongoClient = mongoose.connection.getClient();
    bucket = new mongoose.mongo.GridFSBucket(mongoClient.db(), {
        bucketName: 'documents',
    });
    gfs = db.connection.db.collection('documents.files');
});

// Multer GridFS Storage
const storage = new GridFsStorage({
    url: process.env.MONGO_URI,
    file: (req, file) => ({
        bucketName: 'documents',
        filename: `${Date.now()}-${file.originalname}`,
    }),
});
const upload = multer({ storage });

// Session setup
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
        cookie: { secure: false }, // Set secure: true in production with HTTPS
    })
);

// Middleware to check authentication
function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login'); // Redirect to login if not authenticated
}

// User schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// Document schema
const documentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    documentName: { type: String, required: true },
    filename: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
});
const Document = mongoose.model('Document', documentSchema);

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about'));
app.get('/contact', (req, res) => res.render('contact'));

// Signup routes
app.get('/signup', (req, res) => res.render('signup', { error: null, success: null }));

app.post(
    '/signup',
    [
        body('email').isEmail().withMessage('Please enter a valid email.'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    ],
    async (req, res) => {
        const { name, email, password } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).render('signup', {
                error: errors.array()[0].msg,
                success: null,
            });
        }

        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).render('signup', {
                    error: 'Email already exists!',
                    success: null,
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ name, email, password: hashedPassword });
            await newUser.save();

            res.render('signup', {
                error: null,
                success: 'User successfully registered! Please log in.',
            });
        } catch (err) {
            console.error('Error during signup:', err);
            res.status(500).render('signup', {
                error: 'Internal Server Error. Please try again later.',
                success: null,
            });
        }
    }
);

// Login routes
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email.'),
        body('password').notEmpty().withMessage('Password is required.'),
    ],
    async (req, res) => {
        const { email, password } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).render('login', { error: errors.array()[0].msg });
        }

        try {
            const user = await User.findOne({ email });
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(400).render('login', { error: 'Invalid email or password.' });
            }

            // Set session user
            req.session.user = { id: user._id, name: user.name, email: user.email };

            // Redirect to dashboard
            res.redirect('/dashboard');
        } catch (err) {
            console.error('Error during login:', err);
            res.status(500).render('login', { error: 'Internal Server Error. Please try again later.' });
        }
    }
);

// Dashboard route
app.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try {
        const documents = await Document.find({ userId: req.session.user.id });
        res.render('dashboard', { user: req.session.user, documents });
    } catch (err) {
        console.error('Error fetching documents:', err);
        res.status(500).send('Error fetching documents. Please try again later.');
    }
});

// Document upload route
app.post('/documents/upload', ensureAuthenticated, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const { documentName } = req.body;
        if (!documentName) {
            return res.status(400).send('Document name is required.');
        }

        const newDocument = new Document({
            userId: req.session.user.id,
            documentName,
            filename: req.file.filename,
        });

        await newDocument.save();
        res.render('dashboard', { user: req.session.user, documents: await Document.find({ userId: req.session.user.id }), success: 'Document successfully uploaded!' });
    } catch (err) {
        console.error('Error uploading document:', err);
        res.status(500).send('Error uploading document. Please try again later.');
    }
});

// Document view route
app.get('/documents', ensureAuthenticated, async (req, res) => {
    try {
        const documents = await Document.find({ userId: req.session.user.id });
        res.render('documents', { user: req.session.user, documents });
    } catch (err) {
        console.error('Error fetching documents:', err);
        res.status(500).send('Error fetching documents. Please try again later.');
    }
});


// View single document route
app.get('/documents/view/:filename', ensureAuthenticated, async (req, res) => {
    try {
        const file = await gfs.find({ filename: req.params.filename }).toArray();
        if (!file || file.length === 0) {
            return res.status(404).send('File not found.');
        }

        res.set('Content-Type', file[0].contentType);
        const readStream = bucket.openDownloadStreamByName(req.params.filename);
        readStream.pipe(res);
    } catch (err) {
        console.error('Error viewing file:', err);
        res.status(500).send('Error viewing file. Please try again later.');
    }
});

// Download document route
app.get('/documents/download/:filename', ensureAuthenticated, async (req, res) => {
    try {
        const file = await gfs.find({ filename: req.params.filename }).toArray();
        if (!file || file.length === 0) {
            return res.status(404).send('File not found.');
        }

        res.set('Content-Type', file[0].contentType);
        res.set('Content-Disposition', `attachment; filename="${file[0].filename}"`);
        const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
        downloadStream.pipe(res);
    } catch (err) {
        console.error('Error downloading file:', err);
        res.status(500).send('Error downloading file. Please try again later.');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);
        }
        res.redirect('/login');
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 