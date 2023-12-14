-- Create authors Table
CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
	author_value_type VARCHAR(5) NOT NULL,
	author_value VARCHAR(50) NOT NULL UNIQUE,
    author_name VARCHAR(255) NOT NULL
);

-- Create books Table
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
	book_value_type VARCHAR(5) NOT NULL,
	book_value VARCHAR(50) NOT NULL,
    book_title VARCHAR(255) NOT NULL,
    book_date_read DATE NOT NULL,
    book_rating INT NOT NULL,
	author_id INT REFERENCES authors(id),
    user_input TEXT
);
