const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// Route to book a listing (protected - must be logged in)
router.post("/:id/book", isLoggedIn, async (req, res) => {
  const { id } = req.params;

  // Optional: Fetch listing to confirm it exists
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }

  // (Optional: Save booking in DB)

  req.flash("success", "Successfully booked your listing!");
  res.redirect(`/listings/${id}`);
});

// Route for search functionality
router.get("/search", async (req, res) => {
  const raw = req.query.q || "";
  // ✅ Security: Sanitize input — strip regex special chars to prevent ReDoS
  const query = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100);
  try {
    const listings = await Listing.find({
      title: { $regex: query, $options: "i" },
    });

    res.render("listings/searchResults", { listings, query });
  } catch (err) {
    console.error("Search error:", err);
    req.flash("error", "Something went wrong with the search.");
    res.redirect("/listings");
  }
});

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing),
  );

//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing),
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

//Edit Route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm),
);

module.exports = router;
