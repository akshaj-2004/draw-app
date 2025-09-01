import express from "express";

const app = express()

app.get("", (req, res) => {
    res.json({
        "msg": "app started"
    })
})

app.listen(3001, ()=>{
    console.log('app started')
})