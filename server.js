import express from "express"
import pool from "./db.js"
import bodyParser from "body-parser"

const app = express()

app.use(bodyParser.json())

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

app.get('/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books')
        res.send(result.rows) 
    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

app.get('/books/:id', async (req, res) => {
    const { id } = req.params
    try {
        const result = await pool.query(
            'SELECT * FROM books where book_id = $1', [id]
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

app.post('/books', async (req, res) => {
    try {
        const { title, isbn, author, publication_date, borrowed } = req.body
        
        const result = await pool.query(
            'INSERT INTO books (title, isbn, author, publication_date, borrowed) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, isbn, author, publication_date, borrowed]
        )

        res.status(201).send(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

app.put('/books/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { title, isbn, author, publication_date, borrowed } = req.body

        const check = await pool.query(
            'SELECT * FROM books WHERE book_id = $1', [id]
        )

        if(check.rows.length == 0) {
           return res.status(404).send(`Book with id: ${id} could not be found.`)
        }

        const result = await pool.query(
            'UPDATE books SET title = $1, isbn = $2, author = $3, publication_date = $4, borrowed = $5 WHERE book_id = $6 RETURNING *', 
            [title, isbn, author, publication_date, borrowed, id]
        )

        res.send(result.rows[0])
    } catch(err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
})

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



app.listen(3001, () => {
    console.log('Server running on port 3001')
})
