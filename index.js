require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");
const urlparser = require("url");

app.use(bodyParser.urlencoded({ extended: true }));

let mongoose = require("mongoose");
console.log(process.env.MONGOOSE_URL);
mongoose.connect(process.env.MONGOOSE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UrlDataSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true },
});

const UrlData = mongoose.model("UrlData", UrlDataSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", function (req, res) {
  //res.json({ original_url: req.body.url, short_url: "placeholder" });
  const EnteredUrl = req.body.url;
  dns.lookup(urlparser.parse(EnteredUrl).hostname, async (err, address) => {
    console.log("URL " + EnteredUrl);
    console.log(address);
    if (!address) {
      res.json({ error: "Invalid URL" });
    } else {
      const DataCount = await UrlData.countDocuments();
      var Doc = new UrlData({
        original_url: EnteredUrl,
        short_url: DataCount,
      });
      // UrlData.findOne(
      //   { original_url: EnteredUrl },
      //   (err) => {
      //     if (err) {
      //       console.error(err);
      //     }
      //   }
      // ).exec()
      //   .then((Data) => {
      //     if (!Data) {
      //       Doc.save()
      //         .then((result) => {
      //           res.json(result);
      //         })
      //         .catch((err) => {
      //           console.error(err);
      //           res.json({ error: err });
      //         });
      //     }
      //   })
      //   .catch((err) => {
      //     console.error(err);
      //   });

      const foundData = await UrlData.findOne({
        original_url: EnteredUrl,
      }).exec();
      if (!foundData) {
        Doc.save()
          .then((result) => {
            res.json({
              original_url: EnteredUrl,
              short_url: DataCount,
            });
          })
          .catch((err) => {
            console.error(err);
            res.json({ error: err });
          });
      } else {
        res.json({
          original_url: foundData.original_url,
          short_url: foundData.short_url,
        });
      }
    }
  });
});
app.get("/api/shorturl/:shortId", async (req, res) => {
  const shortId = req.params.shortId;
  const foundData = await UrlData.findOne({
    short_url: shortId,
  })
  res.redirect(foundData.original_url.toString());
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
