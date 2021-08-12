const router = require('express').Router();
const fs = require('fs');

router.get('/checkauth', async (req, res) => {
    client.getState().then((data) => {
        console.log(data)
        res.send(data)
    }).catch((err) => {
        if (err) {
            res.send("DISCONNECTED, " + err)
            try {
                // fs.unlinkSync('../session.json')
            } catch (err) {
                console.log(err)
            }
        }
    })
});

router.get('/getqr/:auth', async (req, res) => {
    const auth = req.params.auth;
    if (auth === process.env.qrAuthToken) {
        console.log("debug", 1)
        const qrjs = fs.readFileSync('components/qrcode.js');
        console.log("debug", 2)
        fs.readFile('components/last.qr', (err, last_qr) => {
            console.log("debug", 3)
            fs.readFile('session.json', (serr, sessiondata) => {
                console.log("debug", 4, err, sessiondata, serr)
                if (err && sessiondata) {
                    console.log("debug", 5)
                    res.write("<html><body><h2>Already Authenticated</h2></body></html>");
                    res.end();
                } else if (!err && serr) {
                    console.log("debug", 6)
                    const page = `
                    <html>
                        <body>
                            <script>${qrjs}</script>
                            <div id="qrcode"></div>
                            <script type="text/javascript">
                                new QRCode(document.getElementById("qrcode"), "${last_qr}");
                            </script>
                        </body>
                    </html>
                `;
                    console.log("debug", 7)
                    res.write(page)
                    res.end();
                } else {
                    console.log("debug", 8)
                    res.status(400).json({
                        "error": "Some error occurred",
                        "session.json delete": err.message
                    })
                }
            })
        });
    } else {
        res.status(410).json({
            "Authentication": "Failed to authenticate",
            "message": "Contact Developer"
        })
    }
});

function deleteQr(res) {
    fs.unlink("components/last.qr", (err) => {
        if (err) {
            res(err.message)
        } else {
            res("last.qr deleted successfully")
        }
    })
}

function initialize() {
    console.log("Initialize called")
    client.initialize().then(response => {
        console.log("Initialize execute")
        console.log("CLIENT initialize", response)
    }).catch(err => {
        console.error("CLIENT initialize", err)
    });
}

router.get("/reset/:auth", async (req, res) => {
    const auth = req.params.auth;
    console.log("RESET", auth, process.env.resetAuthToken)
    if (auth === process.env.resetAuthToken) {
        fs.unlink("./session.json", async (err) => {
            if (err) {
                deleteQr((qr) => {
                    client.destroy().then((done, rejected) => {
                        if (rejected) {
                            console.error("Destroy Rejected", rejected)
                            initialize()
                        } else {
                            initialize()
                            console.log("Destroy Done")
                        }
                    }).catch(err => {
                        console.error("Destroy Error: " + err.message)
                        initialize()
                    })
                    res.status(400).json({
                        "last.qr delete": qr,
                        "session.json delete": err.message
                    })
                })
            } else {
                deleteQr((qr) => {
                    client.destroy().then((done, rejected) => {
                        if (rejected) {
                            console.error("Destroy Rejected", rejected)
                            initialize()
                        } else {
                            initialize()
                            console.log("Destroy Done", done)
                        }
                    }).catch(err => {
                        console.error("Destroy Error: " + err.message)
                        initialize()
                    })
                    res.status(200).json({
                        "last.qr delete": qr,
                        "session.json delete": "Session.json deleted successfully"
                    })
                })
            }
        })
    } else {
        res.status(410).json({
            "Authentication": "Failed to authenticate",
            "message": "Contact Developer"
        })
    }
})


module.exports = router;