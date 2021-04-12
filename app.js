//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-victoria:test123@cluster0.olsao.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemsSchema = {
  name: String
 };

const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({ name: "Pet Tiger Cat" });
const item2 = new Item({ name: "Feed Tiger Cat" });
const item3 = new Item({ name: "Clean Tiger Cat's litter box" });
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added default items to list.");
        }
        res.redirect("/");
      });

    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });

});

// dynamic route
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function(err, foundList) {

    if (!foundList) {
      console.log("Doesn't exist!");

      // DNE, make new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save(function(err) {
        if (!err) {
          res.redirect("/" + customListName);
        } else {
          console.log(err);
        }
      });

    } else {
      console.log("Exists!");

      // Show existing list
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items
      });
    }

  });

});

app.post("/", function(req, res) {
  // requested from form submitted by post method in list.ejs
  const itemName = req.body.newItem;
  const listName = req.body.list;

  // make new item
  const item = new Item({
    name: itemName
  });

  // if in root route
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }

    // else in custom route
  else {
    List.findOne({ name: listName }, function(err, foundList) {

      // push item into foundList arr in List collection & save
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;

  // check if on default list/root, then delete and reroute to root
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Item successfully removed.");
        res.redirect("/");
      }
    });
  }

  // delete for custom list
  else {
    List.findOneAndUpdate({ name: listName }, {$pull: {items: {_id: checkedItemId}}},
    function(err, foundItems) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/about", function(req, res) { res.render("about"); });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() { console.log("Server started successfully."); });
