import express from "express"
import pool from "./db.js"
import bodyParser from "body-parser"
import swaggerJsDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import cors from "cors"

const app = express()

app.use(bodyParser.json())
app.use(cors())

// swagger configuration

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Library Management System API",
            version: "2.0.0",
            description: "API documentation for the Library Management System",
        },
        servers: [
            {
                url: "http://localhost:3001",
            },
        ],
    },
    apis: ["./server.js"]
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs))

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get the current server time
 *     responses:
 *       200:
 *         description: Current server time
 */
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()')
        res.send(result.rows)
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error')
    }
})

// /books rest api

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     responses:
 *       200:
 *         description: List of books
 */
app.get('/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT book_id, title, isbn, author, TO_CHAR(publication_date, \'YYYY-MM-DD\') AS publication_date, borrowed, return_date FROM books')
        res.send(result.rows) 
    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get a book by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The book ID
 *     responses:
 *       200:
 *         description: A single book
 *       404:
 *         description: Book not found
 */


app.get('/books/:id', async (req, res) => {
    const { id } = req.params
    try {
        const result = await pool.query(
            'SELECT book_id, title, isbn, author, TO_CHAR(publication_date, \'YYYY-MM-DD\') AS publication_date, borrowed, TO_CHAR(return_date, \'YYYY-MM-DD\') AS return_date FROM books WHERE book_id = $1', [id]
        )

        if(result.rows.length == 0) {
            return res.status(404).send(`Book with id: ${id} could not be found.`)
        }

        

        res.send(result.rows[0])
    } catch(err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Add a new book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               isbn:
 *                 type: string
 *               author:
 *                 type: string
 *               publication_date:
 *                 type: string
 *                 format: date
 *               borrowed:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Book created
 */
app.post('/books', async (req, res) => {
    try {
        const { title, isbn, author, publication_date, borrowed } = req.body
        
        const result = await pool.query(
            'INSERT INTO books (title, isbn, author, publication_date, borrowed, return_date) VALUES ($1, $2, $3, $4::DATE, $5, $6::DATE) RETURNING *',
            [title, isbn, author, publication_date, borrowed]
        )

        res.status(201).send(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update a book by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               isbn:
 *                 type: string
 *               author:
 *                 type: string
 *               publication_date:
 *                 type: string
 *                 format: date
 *               borrowed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Book updated
 *       404:
 *         description: Book not found
 */
app.put('/books/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { title, isbn, author, publication_date, borrowed, return_date } = req.body

        const check = await pool.query(
            'SELECT * FROM books WHERE book_id = $1', [id]
        )

        if(check.rows.length == 0) {
           return res.status(404).send(`Book with id: ${id} could not be found.`)
        }

        const result = await pool.query(
            'UPDATE books SET title = $1, isbn = $2, author = $3, publication_date = $4, borrowed = $5, return_date = $6 WHERE book_id = $7 RETURNING *', 
            [title, isbn, author, publication_date, borrowed, return_date, id]
        )

        res.send(result.rows[0])
    } catch(err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete a book by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The book ID
 *     responses:
 *       200:
 *         description: Book deleted
 *       404:
 *         description: Book not found
 */
app.delete('/books/:id', async (req, res) => {
    try {
        const { id } = req.params

        const check = await pool.query(
            'SELECT * FROM books WHERE book_id = $1', [id]
        )

        if(check.rows.length == 0) {
            return res.status(404).send(`Book with id: ${id} could not be found.`)
        }

        const result = await pool.query(
            'DELETE FROM books WHERE book_id = $1', [id]
        )

        res.status(200).send(`Book with id: ${id} has been deleted.`)
    } catch(err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

// users rest api
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 */
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM users'
        )
        res.send(result.rows)
    } catch(err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: A single user
 *       404:
 *         description: User not found
 */
app.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params

        const result = await pool.query(
            'SELECT * FROM users where user_id = $1', [id]
        )

        if(result.rows.length == 0) {
           return res.status(404).send(`User with id: ${id} could not be found.`)
        }

        res.send(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Add a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_no:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 */

app.post('/users', async (req, res) => {
    try {
        const {username, email, phone_no} = req.body
        const result = await pool.query(
            'INSERT INTO users (username, email, phone_no) VALUES ($1, $2, $3) RETURNING *',
            [username, email, phone_no]
        )
        res.send(result.rows[0])

    } catch(err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_no:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */
app.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { username, email, phone_no } = req.body

        const check = await pool.query(
            'SELECT * FROM users where user_id = $1', [id]
        )

        if(check.rows.length == 0) {
          return  res.status(404).send(`User with id: ${id} could not be found.`)
        }

        const result = await pool.query(
            'UPDATE users SET username = $1, email = $2, phone_no = $3 WHERE user_id = $4 RETURNING *',
            [username, email, phone_no, id]
        )

        res.send(result.rows[0])

    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
    
})

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
app.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params

        const check = await pool.query(
            'SELECT * FROM users where user_id = $1', [id]
        )

        if(check.rows.length == 0) {
           return res.status(404).send(`User with id: ${id} could not be found.`)
        }

        const result = await pool.query(
            'DELETE FROM users where user_id = $1', [id]
        )

        res.send(`User with id: ${id} has been deleted.`)
    } catch(err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})


// /membership endpoint
/**
 * @swagger
 * /membership:
 *   get:
 *     summary: Get all memberships
 *     responses:
 *       200:
 *         description: List of memberships
 */
app.get('/membership', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM book_membership'
        )

        res.send(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

/**
 * @swagger
 * /membership/{id}:
 *   get:
 *     summary: Get a membership by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The membership ID
 *     responses:
 *       200:
 *         description: A single membership
 *       404:
 *         description: Membership not found
 */
app.get('/membership/:id', async (req, res) => {
    try {
        const { id } = req.params
        const result = await pool.query(
            'SELECT * FROM book_membership WHERE membership_id = $1', [id]
        )

        if(result.rows.length == 0) {
          return  res.status(404).send(`Membership with id: ${id} could not be found.`)
        }

        res.send(result.rows[0])
    } catch(err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

/**
 * @swagger
 * /membership:
 *   post:
 *     summary: Add a new membership
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               book_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Membership created
 *       404:
 *         description: User or book not found
 */

app.post('/membership', async (req, res) => {
    try {
        const { user_id, book_id} = req.body

        const userCheck = await pool.query(
            'SELECT * FROM users where user_id = $1', [user_id]
        )

        if(userCheck.rows.length == 0) {
           return res.status(404).send(`User with id: ${user_id} could not be found.`)
        }

        const bookCheck = await pool.query(
            'SELECT * FROM books where book_id = $1', [book_id]
        )
 
        if(bookCheck.rows.length == 0) {
           return res.status(404).send(`Book with id: ${book_id} could not be found.`)
        }

        const result = await pool.query(
            'INSERT INTO book_membership(user_id, book_id) VALUES ($1, $2) RETURNING *',
            [user_id, book_id]
        )

        res.send(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
})


/**
 * @swagger
 * /membership/{id}:
 *   put:
 *     summary: Update a membership by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The membership ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               book_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Membership updated
 *       404:
 *         description: Membership, user, or book not found
 */

app.put('/membership/:id', async(req,res) => {

    try {
        const { id } = req.params
        const { user_id, book_id } = req.body

        const check = await pool.query(
            'SELECT * FROM book_membership WHERE membership_id = $1', [id]
        )

        if(check.rows.length == 0) {
        return  res.status(404).send(`Membership with id: ${id} could not be found.`)
        }

        const userCheck = await pool.query(
            'SELECT * FROM users where user_id = $1', [user_id]
        )

        if(userCheck.rows.length == 0) {
           return res.status(404).send(`User with id: ${user_id} could not be found.`)
        }

        const bookCheck = await pool.query(
            'SELECT * FROM books where book_id = $1', [book_id]
        )
 
        if(bookCheck.rows.length == 0) {
           return res.status(404).send(`Book with id: ${book_id} could not be found.`)
        }

        const result = await pool.query(
            'UPDATE book_membership SET user_id = $1, book_id = $2 WHERE membership_id = $3 RETURNING *', [user_id, book_id, id]
        )

        res.send(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
    

    

})


/**
 * @swagger
 * /membership/{id}:
 *   delete:
 *     summary: Delete a membership by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The membership ID
 *     responses:
 *       200:
 *         description: Membership deleted
 *       404:
 *         description: Membership not found
 */
app.delete('/membership/:id', async (req, res) => {
    try {
        const { id } = req.params

        const check = await pool.query(
            'SELECT * FROM book_membership WHERE membership_id = $1', [id]
        )

        if(check.rows.length == 0) {
          return  res.status(404).send(`Membership with id: ${id} could not be found.`)
        }

        const result = await pool.query(
            'DELETE FROM book_membership WHERE membership_id = $1 RETURNING *', [id]
        )

        res.send(`Membership with id: ${id} has been deleted.`)

    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

// /request endpoint

/**
 * @swagger
 * /request_books:
 *   get:
 *     summary: Get all requested books
 *     responses:
 *       200:
 *         description: List of requested books
 */
app.get('/request_books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM request_books');
        res.send(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

/**
 * @swagger
 * /request_books/{id}:
 *   get:
 *     summary: Get a requested book by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The requested book ID
 *     responses:
 *       200:
 *         description: A single requested book
 *       404:
 *         description: Requested book not found
 */
app.get('/request_books/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM request_books WHERE book_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).send(`Requested book with id: ${id} could not be found.`);
        }
        res.send(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

/**
 * @swagger
 * /request_books:
 *   post:
 *     summary: Add a new requested book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               isbn:
 *                 type: string
 *               author:
 *                 type: string
 *               publication_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Requested book created
 */
app.post('/request_books', async (req, res) => {
    const { title, isbn, author, publication_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO request_books (title, isbn, author, publication_date) VALUES ($1, $2, $3, $4::DATE) RETURNING *',
            [title, isbn, author, publication_date]
        );
        res.status(201).send(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

/**
 * @swagger
 * /request_books/{id}:
 *   put:
 *     summary: Update a requested book by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The requested book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               isbn:
 *                 type: string
 *               author:
 *                 type: string
 *               publication_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Requested book updated
 *       404:
 *         description: Requested book not found
 */
app.put('/request_books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, isbn, author, publication_date } = req.body;
    try {
        const check = await pool.query('SELECT * FROM request_books WHERE book_id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).send(`Requested book with id: ${id} could not be found.`);
        }
        const result = await pool.query(
            'UPDATE request_books SET title = $1, isbn = $2, author = $3, publication_date = $4::DATE WHERE book_id = $5 RETURNING *',
            [title, isbn, author, publication_date, id]
        );
        res.send(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

/**
 * @swagger
 * /request_books/{id}:
 *   delete:
 *     summary: Delete a requested book by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The requested book ID
 *     responses:
 *       200:
 *         description: Requested book deleted
 *       404:
 *         description: Requested book not found
 */
app.delete('/request_books/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const check = await pool.query('SELECT * FROM request_books WHERE book_id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).send(`Requested book with id: ${id} could not be found.`);
        }
        await pool.query('DELETE FROM request_books WHERE book_id = $1', [id]);
        res.status(200).send(`Requested book with id: ${id} has been deleted.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});



app.listen(3001, () => {
    console.log('Server running on port 3001')
})
