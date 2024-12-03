const expressApp = require('express');
const mysqlDb = require('mysql');
const cryptoUtils = require('crypto');
const corsLib = require('cors');
const jwtLib = require('jsonwebtoken');
const { expressjwt: jwtAuth } = require('express-jwt');

const serverPort = process.env.PORT || 3000;
const app = expressApp();
app.use(corsLib());

const dbConnectionConfig = {
    host: 'localhost',
    user: 'root',
    password: '', //'saiKrishnaNBAD',
    database: 'saikrishna_nbad_final', //'saiKrishnaNBAD'
};

const dbConnection = mysqlDb.createConnection(dbConnectionConfig);

const jwtKey = 'SaiKrishna';

const jwtValidationMiddleware = jwtAuth({
    secret: jwtKey,
    algorithms: ['HS256']
});

app.use(expressApp.json());

// Root API Endpoint
app.get('/', async (req, res) => {
    res.status(200).json({ success: true, message: 'API is running.' });
});

// Generate a cryptographic salt
function generateSalt() {
    return cryptoUtils.randomBytes(32).toString('hex');
}

// Hash and salt the password
function encryptPassword(password, salt) {
    const sha256Encryptor = cryptoUtils.createHash('sha256');
    sha256Encryptor.update(password + salt);
    return sha256Encryptor.digest('hex');
}

// API for user signup
app.post('/api/register', async (req, res) => {
    const { password, username } = req.body;
    const userSalt = generateSalt();
    const encryptedPassword = encryptPassword(password, userSalt);

    dbConnection.query(
        'INSERT INTO user (password, salt, username) VALUES (?, ?, ?)',
        [encryptedPassword, userSalt, username],
        (dbError, dbResults) => {
            if (dbError) {
                console.error(dbError);
                res.status(500).json({ success: false, error: dbError.sqlMessage });
            } else {
                res.json({ status: 200, success: true, response: dbResults });
            }
        }
    );
});

// API for user login
app.post('/api/login', async (req, res) => {
    const { password, username } = req.body;

    dbConnection.query('SELECT * FROM user WHERE username = ?', [username], (dbError, dbResults) => {
        if (dbError) {
            console.error(dbError);
            res.status(500).json({ success: false, message: 'Database error occurred while fetching user.' });
        } else {
            if (dbResults.length > 0) {
                const foundUser = dbResults[0];
                const encryptedPassword = encryptPassword(password, foundUser.salt);

                if (encryptedPassword === foundUser.password) {
                    const authToken = jwtLib.sign(
                        { username: foundUser.username, userId: foundUser.id },
                        jwtKey,
                        { expiresIn: '59m' }
                    );

                    res.json({
                        success: true,
                        message: 'Login successful.',
                        user: {
                            username: foundUser.username,
                            userId: foundUser.id
                        },
                        token: authToken
                    });
                } else {
                    res.status(401).json({ success: false, message: 'Incorrect password.' });
                }
            } else {
                res.status(404).json({ success: false, message: 'User not found.' });
            }
        }
    });
});

// API for retrieving innovations by region
app.get('/api/regionInnovations', jwtValidationMiddleware, (req, res) => {
    const userId = req.auth.userId;  // Assuming you have user authentication

    dbConnection.query(
        'SELECT region, percentage_contribution FROM innovations_by_region', 
        (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to get Innovations By Region data' });
            } else {
                res.json(results);
            }
        }
    );
});

// API for retrieving innovations by technology
app.get('/api/technologyInnovations', jwtValidationMiddleware, (req, res) => {
    const userId = req.auth.userId;  // Assuming you have user authentication

    dbConnection.query(
        'SELECT technology, number_of_innovations FROM innovations_by_technology', 
        (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to get Innovations By Technology data' });
            } else {
                res.json(results);
            }
        }
    );
});

// Connect to the database
dbConnection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Successfully connected to the database.');
});

// Gracefully close the database connection
const closeDbConnection = () => {
    dbConnection.end((err) => {
        if (err) {
            console.error('Error closing the database connection:', err);
        } else {
            console.log('Database connection closed');
        }
    });
};

// Start the server
const server = app.listen(serverPort, () => {
    console.log(`Server running on port ${serverPort}`);
});

// Handle server and database closure on process exit
process.on('exit', () => {
    server.close();
    closeDbConnection();
    console.log('Server and database connection closed.');
});

module.exports = app;
