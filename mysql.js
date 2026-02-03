const mysql = require('mysql');

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql-sharu557.alwaysdata.net',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'sharu557',
  password: process.env.DB_PASSWORD || '@Shamsu1440',
  database: process.env.DB_NAME || 'sharu557_ibadu_database'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    throw err;
  }
  console.log('Connected to MySQL database');
});

// Export the database connection
module.exports = db;

// CREATE TABLE IF NOT EXISTS `bookings` (
//   `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
//   `name` VARCHAR(255) NOT NULL,
//   `email` VARCHAR(255) DEFAULT NULL,
//   `gender` VARCHAR(10) NOT NULL,
//   `date_of_birth` DATE NOT NULL,
//   `phone` VARCHAR(20) NOT NULL,
//   `address` TEXT NOT NULL,
//   `message` TEXT,
//   `time_sent` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


// CREATE TABLE staff (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   name VARCHAR(100) NOT NULL,
//   email varchar(100) null,
//   phone varchar(100)  null,
//   role varchar(100)
//   subjects JSON,
//   role VARCHAR(50)
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

// CREATE TABLE h_students (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   name VARCHAR(100) NOT NULL,
//   level varchar (100) null,
//   student_number VARCHAR(20) UNIQUE,
//   gender ENUM('Male', 'Female') NOT NULL
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

// CREATE TABLE h_fees (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   class_name VARCHAR(50) NOT NULL,
//   amount DECIMAL(10, 2) NOT NULL,
//   status ENUM('completed', 'pending') NOT NULL
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

// CREATE TABLE h_calendar (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   term_start DATE,
//   term_end DATE,
//   holidays JSON
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

// -- Insert default SuperAdmin
// CREATE TABLE admins (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   username VARCHAR(50) UNIQUE NOT NULL,
//   password VARCHAR(255) NOT NULL,
//   name VARCHAR(100) NOT NULL,
//   phone VARCHAR(15) NOT NULL,
//   security_question VARCHAR(255) NOT NULL,
//   security_answer VARCHAR(100) NOT NULL,
//   role ENUM('SuperAdmin', 'Assistant', 'Deputy') NOT NULL,
//   first_login BOOLEAN DEFAULT TRUE
// ) ENGINE=InnoDB;

// INSERT INTO admins (username, password, name, phone, security_question, security_answer, role, first_login) 
// VALUES ('Admin', 'admin', 'Default Admin', '1234567890', 'What is your pet\'s name?', 'DOG', 'SuperAdmin', TRUE);