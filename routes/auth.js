const cookieParser = require("cookie-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const authenticate = require("../middleware/authenticate");
require("../db/connection");
const User = require("../models/Schema");
const User2 = require("../models/room");
const booking = require("../models/booking");
const moment = require("moment");
router.use(cookieParser());

router.get("/", (req, res) => {
  res.send("hello world from server");
});

//user routes

router.post("/register", (req, res) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  const { name, email, phone, password, cpassword } = req.body;

  if (!name || !email || !phone || !password || !cpassword) {
    return res.status(422);
  }

  User.findOne({ email: email })
    .then((userExist) => {
      if (userExist) {
        return res.status(422).json({ error: "Email already exist" });
      } else if (password != cpassword) {
        return res
          .status(422)
          .json({ error: "please enter same password to confirm" });
      } else {
        const user = new User({ name, email, phone, password, cpassword });

        user
          .save()
          .then(() => {
            res.status(201).json({ message: "user registered successfully" });
          })
          .catch((err) => {
            res.status(501).json({ error: "failed to register" });
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post("/signin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "please enter all the fields" });
  }

  User.findOne({ email: email })
    .then((userExist) => {
      if (!userExist) {
        return res.status(400).json({ message: "Invalid login credentials" });
      } else {
        bcrypt
          .compare(password, userExist.password)
          .then((match) => {
            if (!match) {
              res.status(400).json({ message: "Invalid login credentials" });
            } else {
              userExist
                .generateAuthToken()
                .then((token) => {
                  console.log("token generated");
                  res
                    .status(200)
                    .cookie("jwtoken", token, {
                      expires: new Date(Date.now() + 25892000000),
                      httpOnly: true,
                    })
                    .json({ message: "login successfull" });
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/profile", authenticate, (req, res) => {
  res.send(req.rootUser);
});

router.get("/getdata", authenticate, (req, res) => {
  res.send(req.rootUser);
});

router.post("/contact", authenticate, async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.json(req.body);
    }
    const userContact = await User.findOne({ _id: req.userID });

    if (userContact) {
      const userMessage = await userContact.addMessage(
        name,
        email,
        phone,
        message
      );

      await userContact.save();
      res.status(201).json({ message: "user contact success" });
    }
  } catch (err) {
    console.log(err);
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("jwtoken", { path: "/" });
  res.end();
});

router.post("/insert", (req, res) => {
  const {
    name,
    roomType,
    maxPeople,
    contactNumber,
    rentPerDay,
    imgUrls,
    currentBookings,
    description,
  } = req.body;

  const user2 = new User2({
    name,
    roomType,
    maxPeople,
    contactNumber,
    rentPerDay,
    imgUrls,
    currentBookings,
    description,
  });

  user2
    .save()
    .then(() => {
      res.status(201).json({ message: "room data added" });
    })
    .catch((err) => {
      res.status(501).json({ error: "failed to register" });
    });
});

//rooms routes

router.get("/getallrooms", async (req, res) => {
  try {
    const rooms = await User2.find({});
    return res.status(200).json(rooms);
  } catch (err) {
    return res.json({ error: err });
  }
});

router.post("/getroombyid", async (req, res) => {
  const roomid = req.body.roomid;

  try {
    const room = await User2.findOne({ _id: roomid });
    return res.status(200).json(room);
  } catch (err) {
    return res.json({ error: err });
  }
});

router.post("/addroom", async (req, res) => {
  const { name, type, maxpeople, contact, rent, description, imgUrls } =
    req.body;

  try {
    const newroom = new User2({name,
      roomType:type,
      maxPeople:maxpeople,
      contactNumber:contact,
      rentPerDay:rent,
      imgUrls:imgUrls,
      description:description
    });

    await newroom.save();

    res.send("Room added sucesssfully");
  } catch (error) {
    return res.status(400).json({ error: "error from backend" });
  }
});

router.put("/updateroom/:id", (req, res) => {});

//booking routes

router.post("/bookroom", async (req, res) => {
  const { room, roomid, userid, fromdate, todate, totalamount, totaldays } =
    req.body;

  try {
    const newbooking = new booking({
      userid,
      room,

      roomid,
      fromdate,
      todate,
      totalamount,
      totaldays,
      transactionid: "1234",
    });

    const bookings = await newbooking.save();

    const roomtemp = await User2.findOne({ _id: roomid });

    roomtemp.currentBookings.push({
      bookingid: bookings._id,
      fromdate: moment(fromdate, "DD-MM-YYYY"),
      // fromdate,
      todate: moment(todate, "DD-MM-YYYY"),
      // todate,
      userid,
      status: bookings.status,
    });

    await roomtemp.save();

    res.status(201).json({ message: "room booked sucessfully" });
  } catch (error) {
    console.log(error);
  }
});

router.get("/getbookingsbyuserid", authenticate, async (req, res) => {
  try {
    const mybookings = await booking.find({ userid: req.userID });
    return res.status(200).json(mybookings);
  } catch (err) {
    return res.json({ error: err });
  }
});

router.post("/cancelbooking", async (req, res) => {
  const { bookingid, roomid } = req.body;

  try {
    const bookingitem = await booking.findOne({ _id: bookingid });

    // console.log(bookingitem)

    bookingitem.status = "cancelled";

    await bookingitem.save();

    const room = await User2.findOne({ _id: roomid });

    // console.log(room)
    const bookings = room.currentBookings;

    // console.log(bookings)

    const tempbookings = bookings.filter((booking) => {
      return booking.bookingid != bookingid;
    });
    // console.log(tempbookings)
    room.currentBookings = tempbookings;

    await room.save();

    res.send("cancelled sucessfully");
  } catch (error) {
    return res.json({ error: error });
  }
});

router.get("/getallbookings", async (req, res) => {
  try {
    const allbookings = await booking.find();
    res.send(allbookings);
  } catch (err) {
    return res.json({ error: err });
  }
});

router.get("/getallusers", async (req, res) => {
  try {
    const allusers = await User.find();
    res.send(allusers);
  } catch (err) {
    return res.json({ error: err });
  }
});

//admin route

router.get("/admin", authenticate, (req, res) => {
  res.send(req.rootUser);
});

module.exports = router;
