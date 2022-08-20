const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const _ = require("lodash")

require("dotenv").config()

const app = express();

let PORT = process.env.PORT


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)

const itemSchema = ({
  name: String
});


const Item = new mongoose.model("Item", itemSchema);

const items1 = new Item({ name: "Welcome to yout todolist" })
const items2 = new Item({ name: "Hit hte + button to add a new item" })
const items3 = new Item({ name: "<-- Hit this to dalete an item" })

const defaultItems = [items1, items2, items3]

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = mongoose.model("List", listSchema)






app.get("/", function (req, res) {

  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log("Succesfully saved default items to DB")
        }
      })
      res.redirect("/")
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
});






app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName)

  List.findOne({ name: customListName }, (err, results) => {
    if (!err) {
      if (!results) {
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save()
        res.redirect("/" + customListName)
      } else {
        res.render("list", { listTitle: results.name, newListItems: results.items })
      }
    }
  })
})





app.post("/", function (req, res) {

  const item = req.body.newItem;
  const listName = req.body.list

  const newItem = new Item({
    name: item
  })

  if (listName === "Today") {
    newItem.save()
    res.redirect("/")
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push({ name: item })
      foundList.save()
      res.redirect("/" + listName)
    })
  }
});




app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox
  const listName = req.body.listName

  if (listName === "Today") {
    Item.findByIdAndRemove({ _id: checkedItemId }, (err) => {
      if (!err) {
        res.redirect("/")
      } else {
        console.log(err)
      }
    })
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err) => {
        if (!err) {
          res.redirect("/" + listName)
        } else {
          console.log(err)
        }
      })
  }
})



app.get("/about", function (req, res) {
  res.render("about");
});



app.listen(PORT, function () {
  console.log("Server started successfully");
});
