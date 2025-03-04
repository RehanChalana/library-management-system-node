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
            res.status(404).send(`Book with id: ${id} could not be found.`)
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

app.delete('/books/:id', async (req, res) => {
    try {
        const { id } = req.params

        const check = await pool.query(
            'SELECT * FROM books WHERE book_id = $1', [id]
        )

        if(check.rows.length == 0) {
            res.status(404).send(`Book with id: ${id} could not be found.`)
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

app.listen(3000, () => {
    console.log('Server running on port 3000')
})
