const express = require("express");
const router = express.Router();
const isBase64 = require("is-base64");
const base64Img = require("base64-img");
const fs = require("fs");

const { Media } = require("../models");

// const { HOSTNAME } = process.env;

router.get("/", async (req, res) => {
  const media = await Media.findAll({
    attributes: ["id", "image"],
  });

  const mappedMedia = media.map((m) => {
    m.image = `${req.get("host")}/${m.image}`;
    // m.image = `${HOSTNAME}/${m.image}`;
    return m;
  });

  return res.json({
    status: "success",
    data: mappedMedia,
  });
});

router.post("/", (req, res) => {
  const image = req.body.image;

  if (!isBase64(image, { mimeRequired: true })) {
    return res.status(400).json({ status: "error", message: "invalid base64" });
  }

  base64Img.img(image, "./public/images", Date.now(), async (err, filepath) => {
    if (err) {
      return res.status(400).json({ status: "error", message: err.message });
    }

    // '/public/images/4131313131.png'
    const filename = filepath.split("/").pop();

    const media = await Media.create({ image: `images/$(filename)` });

    return res.json({
      status: "success",
      data: {
        id: media._id,
        image: `${req.get("host")}/images/${filename}`,
        // image: `${HOSTNAME}/images/${filename}`,
      },
    });
  });
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  const media = await Media.findByPk(id);

  if (!media) {
    return res.status(404).json({ status: "error", message: "media not found" });
  }

  fs.unlink(`./public/${media.image}`, async (err) => {
    // fs.unlink(`./public/images/${filename}`, async (err) => {
    if (err) {
      return res.status(400).json({ status: "error", message: err.message });
    }

    try {
      await media.destroy();

      return res.json({
        status: "success",
        message: "image deleted",
      });
    } catch (error) {
      return res.status(500).json({ status: "error", message: "delete fail" });
    }
  });
});

module.exports = router;
